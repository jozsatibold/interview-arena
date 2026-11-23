import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  pickPersonality
} from '../personalities.mjs';
import {
  stripStaticOpenerSection,
  buildInterviewPacingDirectives,
  buildTurnContextAddendum,
  trimConversationForTier,
  buildInterviewPrompt
} from './pacing.mjs';
import { advanceScriptState } from '../shared/interview-script-engine.mjs';
import {
  resolveOrCreateScriptSession,
  updateScriptSessionPlan,
  recordScriptBeatSignal,
  clearScriptSession
} from './script-session-store.mjs';
import { findArtifactById, isScreenShareAllowedTopic } from '../shared/interview-artifacts.mjs';
import { getLeadershipTier } from '../shared/role-archetypes.mjs';
import { resolveEffectiveContextTier } from '../shared/model-tiers.mjs';
import { formatKnowledgeForInterviewer, formatKnowledgeForDebrief } from '../shared/role-knowledge.mjs';
import { formatTechStacksForInterviewer } from '../shared/kb-tech-stacks.mjs';
import { resolveEffectiveArchetype, getAdaptedAgents, buildDynamicAgentDirective } from '../role-adapter.mjs';
import { CURATED_LOGIC_PUZZLES } from '../logic-puzzles.mjs';
import { normalizeInterviewTranscript } from '../shared/transcript.mjs';
import { pickRandomCompanyName, companyAppearsInText } from '../shared/company.mjs';
import { normalizeExpression } from '../shared/expression.mjs';
import {
  ROOT_DIR,
  AGENT_META,
  COMPACT_CANDIDATE_PROFILE,
  TUTOR_CATALOG
} from './config.mjs';
import {
  ensureState,
  mutateStateSync,
  getActiveCv,
  getStudentMemorySync,
  saveStudentMemorySync
} from './db.mjs';
import {
  COACH_JSON_DELIMITER,
  fetchOllamaChat,
  getCachedModelMeta,
  consumeNdjsonBody,
  stripThinkBlocks,
  extractJsonSafe,
  findCoachMarker,
  summarizeMdPrompt
} from './ollama.mjs';
import { resolveTargetContext } from './document-service.mjs';
import {
  pickFreshTutorAngle,
  buildStudentMemoryBrief,
  scheduleStudentMemoryUpdate,
  buildTutorSystemPrompt
} from './tutor-memory.mjs';
import {
  resolveLogicPuzzleById,
  listPublicLogicPuzzles,
  getLogicPuzzleHint,
  generateLogicPuzzleWithAi,
  buildLogicSystemPrompt
} from './logic-service.mjs';

export {
  resolveLogicPuzzleById,
  listPublicLogicPuzzles,
  getLogicPuzzleHint,
  generateLogicPuzzleWithAi
};

function updateStreak(state) {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastPracticeDate === today) return;
  if (!state.lastPracticeDate) {
    state.streak = 1;
  } else {
    const diffDays = Math.round((new Date(today) - new Date(state.lastPracticeDate)) / 86400000);
    if (diffDays <= 0) return;
    if (diffDays === 1) {
      state.streak += 1;
    } else {
      const missedDays = diffDays - 1;
      if (missedDays <= Number(state.streakFreezes || 0)) {
        state.streakFreezes -= missedDays;
        state.streak += 1;
      } else {
        state.streak = 1;
      }
    }
  }
  state.lastPracticeDate = today;
}

async function appendProgressLog(scorecard, agentLabel, jdLabel) {
  const logPath = path.join(ROOT_DIR, 'progress-log.md');
  if (!existsSync(logPath) || !scorecard) return;
  const date = new Date().toISOString().slice(0, 10);
  const s = scorecard.subScores || {};
  const cleanGolden = String(scorecard.goldenSentences?.[0] || '').replace(/[\r\n]+/g, ' ').replaceAll('|', '/').trim();
  const row = `| ${date} | ${String(agentLabel || 'Custom').replace(/[\r\n|]+/g, ' ')} | \`${String(jdLabel || 'custom').replace(/[\r\n`]+/g, '')}\` | ${s.english ?? '-'}/10 | ${s.analysis ?? '-'}/10 | ${s.techRoi ?? '-'}/10 | ${s.confidence ?? '-'}/10 | **${scorecard.totalScore}/10** | ${scorecard.percentile} (\`${scorecard.verdict}\`) | ${cleanGolden} |\n`;
  await fs.appendFile(logPath, row, 'utf8');
}

export async function persistChatSideEffects(parsed, { mode = 'interview', action, topic, agentFile, jdFile, day, isRetryPractice = false, doubleXpActive = false, speechMetrics = null }) {
  const today = new Date().toISOString().slice(0, 10);
  const pendingMistakes = [];
  const queueMistake = ({ category, original, better, reason }) => {
    const cleanOrig = String(original || '').trim();
    const cleanBetter = String(better || '').trim();
    if (!cleanOrig || !cleanBetter || cleanOrig.toLowerCase() === cleanBetter.toLowerCase()) return;
    pendingMistakes.push({
      id: `m-${crypto.randomUUID()}`,
      category: category || 'Grammar',
      original: cleanOrig,
      better: cleanBetter,
      reasonHu: String(reason || '').trim(),
      topic: topic || 'General',
      lastSeen: today
    });
  };

  if (parsed.coachPause?.original) {
    queueMistake({
      category: parsed.coachPause.category || 'B2-to-Senior',
      original: parsed.coachPause.original,
      better: parsed.coachPause.seniorUpgrades?.[0] || '',
      reason: parsed.coachPause.reasonHu || parsed.coachPause.reason || ''
    });
  }
  if (Array.isArray(parsed.grammarFixes)) {
    for (const fix of parsed.grammarFixes) {
      queueMistake({ category: fix.type || 'Grammar', original: fix.said, better: fix.better, reason: fix.why || '' });
    }
  }

  const xpMult = doubleXpActive ? 2 : 1;
  let xpEarned = action === 'turn' ? (isRetryPractice ? 25 : 15) * xpMult : 0;
  let clampedScorecard = null;
  let newSession = null;

  const rawScore = Number(parsed?.scorecard?.totalScore);
  if (parsed?.scorecard && Number.isFinite(rawScore)) {
    const totalScore = Math.max(1, Math.min(10, Math.round(rawScore * 10) / 10));
    clampedScorecard = { ...parsed.scorecard, totalScore };
    parsed.scorecard.totalScore = totalScore;
    xpEarned = Math.round(50 + totalScore * 10) * xpMult;
    newSession = {
      id: `s-${crypto.randomUUID()}`,
      date: today,
      topic,
      agentFile: agentFile || null,
      jdFile: jdFile || null,
      day: day != null && Number.isFinite(Number(day)) ? Number(day) : null,
      subScores: parsed.scorecard.subScores || { english: 7, analysis: 7, techRoi: 7, confidence: 7 },
      totalScore,
      percentile: parsed.scorecard.percentile || 'Top 15%',
      verdict: parsed.scorecard.verdict || 'LEAN HIRE',
      speechMetrics: speechMetrics && typeof speechMetrics === 'object' ? speechMetrics : null
    };
  }

  const { state } = mutateStateSync((st) => {
    if (newSession) {
      updateStreak(st);
      st.xp = Number(st.xp || 0) + xpEarned;
      st.gems = Number(st.gems || 0) + (newSession.totalScore >= 8 ? 30 : 15);
      if (day != null && Number.isFinite(Number(day)) && !st.completedDays.includes(Number(day))) {
        st.completedDays.push(Number(day));
      }
      return { newSession, upsertMistakes: pendingMistakes };
    }
    if (action === 'turn') {
      st.xp = Number(st.xp || 0) + xpEarned;
      updateStreak(st);
    }
    return { upsertMistakes: pendingMistakes };
  });

  if (clampedScorecard) {
    const meta = mode === 'interview' ? AGENT_META.find((a) => a.id === agentFile) : null;
    const agentLabel = meta ? `${meta.code} (${meta.topic})` : `${agentFile || mode} (${topic})`;
    await appendProgressLog(clampedScorecard, agentLabel, jdFile || topic);
  }
  return { xpEarned, state };
}

export function extractCoachMeta(parsedMeta) {
  const rawFixes = Array.isArray(parsedMeta?.grammarFixes) ? parsedMeta.grammarFixes : [];
  const grammarFixes = rawFixes
    .filter((f) => f && f.said && f.better)
    .slice(0, 2)
    .map((f) => ({
      type: String(f.type || 'Grammar').trim(),
      said: String(f.said).trim(),
      better: String(f.better).trim(),
      why: String(f.why || '').trim()
    }));
  const scratchpadPin = parsedMeta?.scratchpadPin ? String(parsedMeta.scratchpadPin).trim().slice(0, 480) : null;
  const rawPause = parsedMeta?.coachPause;
  const coachPause =
    rawPause && typeof rawPause === 'object' && !Array.isArray(rawPause) && typeof rawPause.original === 'string' && rawPause.original.trim()
      ? rawPause
      : null;
  return {
    expression: normalizeExpression(parsedMeta?.expression),
    coachPause,
    microTipHu: typeof parsedMeta?.microTipHu === 'string' ? parsedMeta.microTipHu : null,
    grammarFixes,
    scratchpadPin: scratchpadPin && scratchpadPin.toLowerCase() !== 'null' ? scratchpadPin : null,
    beatDone: typeof parsedMeta?.beatDone === 'boolean' ? parsedMeta.beatDone : null
  };
}

async function resolveChatContext(body, { isFinish = false } = {}) {
  const {
    model = 'qwen3.5:9b',
    modelContextTier = '',
    mode = 'interview',
    guestMode = false,
    tutorTeacherId = 'tutor-sarah',
    tutorTopic = '',
    tutorLevel = 'B2-C1',
    logicPuzzleId = null,
    scratchpadText = '',
    scratchpadChanged = false,
    remainingSeconds = null,
    boardCheckOnly = false,
    agentFile = '01-hr-recruiter-screening.md',
    jdFile = 'jd-01-senior-frontend-fintech-bnpl.md',
    interviewerCompany = '',
    customInterviewId = null,
    customRoundId = null,
    personalityId = null,
    personalityTraits = null,
    messages = [],
    action = 'turn',
    topic = 'HR',
    day = null,
    targetRoleTrack = '',
    continuousFlow,
    elapsedSeconds = null,
    targetDurationSeconds = null,
    interrupted = false,
    screenShareId = null,
    highlightedLines = [],
    artifactNotes = '',
    retryOf = null,
    doubleXpActive = false,
    scriptSessionId = null
  } = body;

  const isGuestSession = Boolean(guestMode && (mode === 'tutor' || mode === 'logic'));
  const activeCv = isGuestSession ? null : await getActiveCv();
  const savedState = (!modelContextTier || !targetRoleTrack) ? await ensureState() : null;
  const resolvedRoleTrack = String(targetRoleTrack || savedState?.targetRoleTrack || 'auto').trim() || 'auto';
  const effectiveArchKey = resolveEffectiveArchetype(activeCv, resolvedRoleTrack);
  const tierInfo = resolveEffectiveContextTier({
    preference: modelContextTier || savedState?.modelContextTier || 'auto',
    modelName: model,
    modelMeta: getCachedModelMeta(model)
  });
  const useStaticAgentFile =
    !isGuestSession &&
    (!activeCv || activeCv.id === 'cv-baseline-1') &&
    resolvedRoleTrack === 'auto' &&
    effectiveArchKey === 'frontend';
  const firstName = isGuestSession
    ? 'Guest'
    : (String(activeCv?.profile?.candidateName || 'there').trim().split(/\s+/)[0] || 'there');

  const rawNormalizedMsgs = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => {
      const content = String(m.content || '').slice(0, 8000);
      return {
        role: m.role,
        content: m.role === 'user' ? normalizeInterviewTranscript(content, { mode }) : content
      };
    });
  const { recentMessages: normalizedMsgs, earlierSummary } = trimConversationForTier(
    rawNormalizedMsgs,
    isFinish ? 24 : tierInfo.budgets.maxHistoryMsgs
  );
  const fullUserTurnCount = rawNormalizedMsgs.filter((m) => m.role === 'user').length;

  let systemPrompt = '';
  let startPrompt = '';
  let chosenTutorAngle = '';
  let tutorTopicLabel = '';
  let resolvedCompany = '';
  let effectiveAgentFile = agentFile;
  let effectiveJdFile = jdFile;
  let effectiveTopic = topic;
  let resolvedScriptSessionId = null;

  if (mode === 'logic') {
    const teacher = TUTOR_CATALOG.teachers.find((t) => t.id === tutorTeacherId) || TUTOR_CATALOG.teachers[0];
    const puzzle = resolveLogicPuzzleById(logicPuzzleId) || CURATED_LOGIC_PUZZLES[0];
    effectiveAgentFile = teacher.id;
    effectiveJdFile = puzzle.id;
    effectiveTopic = puzzle.category || 'Logic Puzzle';
    if (isFinish) {
      return {
        model, mode, isGuestSession, firstName, normalizedMsgs, tierInfo, earlierSummary,
        topic: effectiveTopic, agentFile: effectiveAgentFile, jdFile: effectiveJdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel,
        systemPrompt: '',
        logicFinishMeta: { teacher, puzzle, scratchpadText },
        startPrompt
      };
    }
    const studentBrief = isGuestSession ? '' : buildStudentMemoryBrief(getStudentMemorySync(), puzzle.category);
    systemPrompt = buildLogicSystemPrompt({
      teacher,
      puzzle,
      firstName: isGuestSession ? 'there' : firstName,
      scratchpadText,
      scratchpadChanged,
      remainingSeconds,
      studentBrief,
      guestMode: isGuestSession,
      boardCheckOnly: Boolean(boardCheckOnly)
    });
    startPrompt = `Introduce yourself briefly as ${teacher.name} with a calm, steady, balanced manner, set the ${puzzle.durationMinutes}-minute timer framing for "${puzzle.title}", summarize the core puzzle clearly in 2-3 spoken English sentences (mentioning you can both see and collaborate on the live Scratchpad), and invite ${isGuestSession ? 'them' : firstName} to share their first angle or assumption. Output ${COACH_JSON_DELIMITER} with empty grammarFixes and scratchpadPin: null.`;
  } else if (mode === 'tutor') {
    const teacher = TUTOR_CATALOG.teachers.find((t) => t.id === tutorTeacherId) || TUTOR_CATALOG.teachers[0];
    const topicObj = TUTOR_CATALOG.topics.find((tp) => tp.id === topic || tp.id === tutorTopic) || TUTOR_CATALOG.topics[0];
    const customTopicText = TUTOR_CATALOG.topics.some((tp) => tp.id === tutorTopic) ? '' : String(tutorTopic || '').trim();
    effectiveAgentFile = teacher.id;
    effectiveTopic = 'English Tutor';
    if (isFinish) {
      effectiveJdFile = customTopicText || topicObj.label;
      return {
        model, mode, isGuestSession, firstName, normalizedMsgs, tierInfo, earlierSummary,
        topic: effectiveTopic, agentFile: effectiveAgentFile, jdFile: effectiveJdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel,
        tutorFinishMeta: { teacher, tutorLevel },
        systemPrompt: '',
        startPrompt
      };
    }
    if (isGuestSession) {
      chosenTutorAngle = customTopicText || (topicObj.id === 'fresh-rotate' ? pickFreshTutorAngle({ recentAngles: [] }) : topicObj.label);
      tutorTopicLabel = chosenTutorAngle || 'General English Conversation';
      effectiveJdFile = tutorTopicLabel;
      systemPrompt = buildTutorSystemPrompt({
        teacher, topicObj, customTopic: customTopicText, tutorLevel, firstName: 'there', stackSummary: '',
        studentBrief: '\nGUEST PRACTICE MODE: Have a straightforward, friendly general English conversation. Do NOT assume any specific profession, hobby, or prior history. Do NOT save or reference any personal profile notes.',
        retryOf, action
      });
      startPrompt = `Greet the guest learner patiently and warmly as ${teacher.name} (helpful & unhurried, no fake hype!), smoothly start an approachable conversation about "${chosenTutorAngle}", and ask one welcoming open question! Output ${COACH_JSON_DELIMITER} with empty grammarFixes.`;
    } else {
      const stackSummary = (activeCv?.profile?.coreStack || []).slice(0, 5).join(', ');
      const mem = getStudentMemorySync();
      if (action === 'start' && rawNormalizedMsgs.length === 0) {
        chosenTutorAngle = customTopicText || (topicObj.id === 'fresh-rotate' ? pickFreshTutorAngle(mem) : topicObj.label);
        if (!customTopicText && topicObj.id === 'fresh-rotate') {
          mem.recentAngles = [chosenTutorAngle, ...(mem.recentAngles || []).filter((a) => a !== chosenTutorAngle)].slice(0, 8);
          saveStudentMemorySync(mem);
        }
      } else {
        chosenTutorAngle = customTopicText || (topicObj.id === 'fresh-rotate' ? (mem.recentAngles?.[0] || topicObj.label) : topicObj.label);
      }
      tutorTopicLabel = chosenTutorAngle || topicObj.label;
      effectiveJdFile = tutorTopicLabel;
      systemPrompt = buildTutorSystemPrompt({
        teacher, topicObj, customTopic: customTopicText, tutorLevel, firstName, stackSummary,
        studentBrief: buildStudentMemoryBrief(mem, chosenTutorAngle), retryOf, action
      });
      startPrompt = `Greet ${firstName} patiently and warmly as ${teacher.name} (helpful & unhurried, no fake hype!), smoothly open a conversation on this fresh angle: "${chosenTutorAngle}"${mem.hobbies?.length ? ' (feel free to weave a natural bridge without forcing past hobbies)' : ''}, and ask one engaging open question! Output ${COACH_JSON_DELIMITER} with empty grammarFixes.`;
    }
  } else {
    const isContinuous = continuousFlow !== undefined ? Boolean(continuousFlow) : topic === 'HR';
    const safeBaseAgent = path.basename(String(agentFile || ''));
    const validMeta = AGENT_META.find((a) => a.id === safeBaseAgent);
    if (!validMeta) {
      const err = new Error(`Unknown interviewer agent: ${safeBaseAgent}`);
      err.statusCode = 400;
      throw err;
    }
    const tierId = tierInfo.id || (tierInfo.budgets.compactPrompt ? 'small' : 'medium');
    const isSmallTier = tierId === 'small';
    const adaptedAgents = getAdaptedAgents(AGENT_META, activeCv, resolvedRoleTrack);
    const meta = adaptedAgents.find((a) => a.id === validMeta.id) || validMeta;
    const personality = pickPersonality(topic, personalityTraits || personalityId);
    const personalityBlock = isSmallTier
      ? `INTERVIEWER STYLE (${personality.label} — ${personality.mood}): ${summarizeMdPrompt(personality.prompt, 280)}`
      : `INTERVIEWER PERSONALITY (${personality.emoji} ${personality.label} — ${personality.mood}):\nEmbody this realistic human personality naturally without exaggerating or becoming extreme.\nBEHAVIORAL DIRECTIVE: ${personality.prompt}`;
    const rawAgentMd = useStaticAgentFile
      ? stripStaticOpenerSection(await fs.readFile(path.join(ROOT_DIR, 'agents', validMeta.id), 'utf8'))
      : '';
    const agentLimit = isFinish ? (isSmallTier ? 900 : 2200) : tierInfo.budgets.maxAgentChars;
    const jdLimit = isFinish ? (isSmallTier ? 550 : 1400) : tierInfo.budgets.maxJdChars;
    const cvGuardText = `${activeCv?.rawText || ''}\n${activeCv?.profile?.profilePrompt || ''}`;
    const cleanReqCompany = String(interviewerCompany || '').trim().slice(0, 64);
    resolvedCompany = customInterviewId
      ? ''
      : (cleanReqCompany && !companyAppearsInText(cleanReqCompany, cvGuardText))
        ? cleanReqCompany
        : pickRandomCompanyName(cvGuardText);
    const { jdPrompt, openerHint } = await resolveTargetContext({ jdFile, customInterviewId, customRoundId, day, companyName: resolvedCompany, targetRoleTrack: resolvedRoleTrack }, jdLimit);
    const stackAddendum = useStaticAgentFile
      ? formatTechStacksForInterviewer({ archKey: effectiveArchKey, cvText: activeCv?.rawText || '', coreStack: activeCv?.profile?.coreStack || [], jdText: jdPrompt, topic, tier: tierId })
      : '';
    const agentPrompt = useStaticAgentFile
      ? summarizeMdPrompt(`${rawAgentMd}\n\n${formatKnowledgeForInterviewer({ archKey: effectiveArchKey, topic, tier: tierId })}${stackAddendum ? `\n\n${stackAddendum}` : ''}`, agentLimit)
      : summarizeMdPrompt(buildDynamicAgentDirective({ meta, activeCv, companyName: resolvedCompany, archKey: effectiveArchKey, tier: tierId, compactMode: tierInfo.budgets.compactPrompt, jdText: jdPrompt }), agentLimit);
    const lastUserMsg = [...rawNormalizedMsgs].reverse().find((m) => m.role === 'user');
    let activeScriptPlan = null;
    if (!isFinish) {
      const sessionRes = resolveOrCreateScriptSession({
        scriptSessionId,
        action,
        topic,
        archKey: effectiveArchKey,
        targetDurationSeconds,
        tierInfo,
        hasScreenShare: Boolean(screenShareId) || isScreenShareAllowedTopic(topic, effectiveArchKey),
        userTurns: fullUserTurnCount,
        elapsedSeconds
      });
      resolvedScriptSessionId = sessionRes.scriptSessionId;
      activeScriptPlan = sessionRes.recovered
        ? sessionRes.plan
        : advanceScriptState(sessionRes.plan, {
            action,
            userTurns: fullUserTurnCount,
            lastUserText: lastUserMsg?.content || '',
            interrupted: Boolean(interrupted),
            retryOf,
            elapsedSeconds,
            targetDurationSeconds,
            archKey: effectiveArchKey
          });
      updateScriptSessionPlan(resolvedScriptSessionId, activeScriptPlan);
    }

    const pacing = buildInterviewPacingDirectives({
      action,
      topic,
      archKey: effectiveArchKey,
      userTurns: fullUserTurnCount,
      elapsedSeconds,
      targetDurationSeconds,
      firstName,
      avatarName: meta?.avatarName || 'the interviewer',
      companyName: resolvedCompany,
      personality,
      openerHint,
      compactMode: tierInfo.budgets.compactPrompt,
      scriptPlan: activeScriptPlan
    });
    const screenShareArtifact = isScreenShareAllowedTopic(topic, effectiveArchKey) && screenShareId ? findArtifactById(screenShareId) : null;
    const addendum = buildTurnContextAddendum({
      interrupted: Boolean(interrupted),
      screenShareArtifact,
      highlightedLines: Array.isArray(highlightedLines) ? highlightedLines.slice(0, 10) : [],
      artifactNotes
    });

    if (!isFinish) {
      const activeProfilePrompt = summarizeMdPrompt(
        activeCv?.profile?.profilePrompt || COMPACT_CANDIDATE_PROFILE,
        tierInfo.budgets.maxProfileChars
      );
      ({ systemPrompt, startPrompt } = buildInterviewPrompt({
        compactPrompt: tierInfo.budgets.compactPrompt,
        activeProfilePrompt,
        meta,
        companyName: resolvedCompany,
        topic,
        archKey: effectiveArchKey,
        firstName,
        personalityBlock,
        pacing,
        earlierSummary,
        addendum,
        agentPrompt,
        jdPrompt,
        delimiter: COACH_JSON_DELIMITER,
        isContinuous,
        action,
        retryOf,
        enableBeatSignal: Boolean(activeScriptPlan && activeScriptPlan.complexity !== 'lean')
      }));
    } else {
      const rawCore = !useStaticAgentFile
        ? `${activeCv?.profile?.profilePrompt || ''}\n\nFULL CV:\n${summarizeMdPrompt(activeCv?.rawText || '', isSmallTier ? 700 : 3000)}`
        : await fs.readFile(path.join(ROOT_DIR, '00-candidate-profile-and-core-rules.md'), 'utf8');
      const coreRules = isSmallTier ? summarizeMdPrompt(rawCore, 950) : rawCore;
      return {
        model, mode, isGuestSession, firstName, normalizedMsgs, tierInfo, earlierSummary,
        topic: effectiveTopic, agentFile: effectiveAgentFile, jdFile: effectiveJdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel,
        interviewFinishMeta: { coreRules, personalityBlock, agentPrompt, jdPrompt, activeCv, meta, isContinuous, effectiveArchKey, effectiveTopic, isSmallTier },
        systemPrompt: '',
        startPrompt
      };
    }
  }

  return { model, mode, isGuestSession, firstName, normalizedMsgs, topic: effectiveTopic, agentFile: effectiveAgentFile, jdFile: effectiveJdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel, interviewerCompany: resolvedCompany, scriptSessionId: resolvedScriptSessionId, systemPrompt, startPrompt, action, tierInfo };
}

export async function handleChatStream(body, reqOrRes, maybeRes = null) {
  const req = maybeRes ? reqOrRes : null;
  const res = maybeRes || reqOrRes;
  const ac = new AbortController();
  const markAborted = () => { if (!res.writableFinished) ac.abort(); };
  req?.on?.('aborted', markAborted);
  res.on?.('close', markAborted);

  const ctx = await resolveChatContext(body, { isFinish: false });
  const chatMessages = [{ role: 'system', content: ctx.systemPrompt }, ...ctx.normalizedMsgs];
  if (ctx.action === 'start' && ctx.normalizedMsgs.length === 0) {
    chatMessages.push({ role: 'user', content: ctx.startPrompt });
  }

  const budgets = ctx.tierInfo?.budgets || { numCtx: 8192, numPredict: 380, repeatPenalty: 1.05 };
  const ollamaRes = await fetchOllamaChat(
    {
      model: ctx.model,
      messages: chatMessages,
      stream: true,
      options: {
        temperature: 0.45,
        num_ctx: budgets.numCtx,
        num_predict: budgets.numPredict,
        repeat_penalty: budgets.repeatPenalty
      }
    },
    0,
    ac.signal
  );

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.flushHeaders?.();

  const safeWrite = (obj) => {
    if (!res.writableEnded && !res.destroyed) res.write(JSON.stringify(obj) + '\n');
  };

  let rawAll = '';
  let streamedSpokenLen = 0;
  let inThinking = false;
  let delimReached = false;

  try {
    await consumeNdjsonBody(ollamaRes.body, (obj) => {
      if (ac.signal.aborted) return;
      if (obj.message?.thinking) safeWrite({ type: 'thinking' });
      const delta = obj.message?.content || '';
      if (!delta) return;

      rawAll += delta;
      if (/<think>/i.test(rawAll) && !/<\/think>/i.test(rawAll)) {
        if (!inThinking) {
          inThinking = true;
          safeWrite({ type: 'thinking' });
        }
        return;
      }
      inThinking = false;

      const clean = stripThinkBlocks(rawAll);
      const { idx: delimIdx } = findCoachMarker(clean);
      const spokenPart = delimIdx !== -1 ? clean.slice(0, delimIdx) : clean;

      let safeEnd = spokenPart.length;
      if (!delimReached && delimIdx === -1) {
        for (let k = Math.min(COACH_JSON_DELIMITER.length - 1, spokenPart.length); k >= 1; k--) {
          if (COACH_JSON_DELIMITER.startsWith(spokenPart.slice(spokenPart.length - k))) {
            safeEnd = spokenPart.length - k;
            break;
          }
        }
        const tailHold = spokenPart.match(/(?:\s---+\s*\{?|\s```(?:json)?\s*\{?|\s\{\s*(?:"(?:expression|coachPause|grammarFixes|scratchpadPin|microTipHu|beatDone)?)?|\s---?)$/);
        if (tailHold && tailHold.index !== undefined && tailHold.index < safeEnd) safeEnd = tailHold.index;
      }
      if (delimIdx !== -1) delimReached = true;

      if (safeEnd > streamedSpokenLen) {
        const nextDelta = spokenPart.slice(streamedSpokenLen, safeEnd);
        streamedSpokenLen = safeEnd;
        const cleanSoFar = spokenPart
          .slice(0, safeEnd)
          .replace(/\*\*/g, '')
          .replace(/\s+\*\s+/g, ' ')
          .trimStart();
        safeWrite({ type: 'token', delta: nextDelta, spokenSoFar: cleanSoFar });
      }
    });
  } catch (err) {
    if (!ac.signal.aborted) {
      safeWrite({ type: 'error', error: err.message });
    }
    if (!res.writableEnded && !res.destroyed) res.end();
    return;
  }

  if (ac.signal.aborted) {
    if (!res.writableEnded && !res.destroyed) res.end();
    return;
  }

  const cleanFinal = stripThinkBlocks(rawAll).trim();
  const { idx: delimIdx, markerLen } = findCoachMarker(cleanFinal);
  const spokenEnglish = (delimIdx !== -1 ? cleanFinal.slice(0, delimIdx) : cleanFinal)
    .replace(/\*\*/g, '')
    .replace(/\s+\*\s+/g, ' ')
    .replace(/\s+---+\s*$/, '')
    .trim() || "That makes a lot of sense. Could you tell me a bit more about that?";

  const metaJson = delimIdx !== -1 ? extractCoachMeta(extractJsonSafe(cleanFinal.slice(delimIdx + markerLen).trim())) : { expression: 'warm', coachPause: null, microTipHu: null, grammarFixes: [], scratchpadPin: null, beatDone: null };
  if (ctx.scriptSessionId && metaJson.beatDone !== null) {
    recordScriptBeatSignal(ctx.scriptSessionId, metaJson.beatDone);
  }
  const reply = { spokenEnglish, expression: metaJson.expression, coachPause: metaJson.coachPause, microTipHu: metaJson.microTipHu, grammarFixes: metaJson.grammarFixes, scratchpadPin: metaJson.scratchpadPin || null, scorecard: null };

  const { xpEarned, state } = ctx.isGuestSession
    ? { xpEarned: 0, state: await ensureState() }
    : await persistChatSideEffects(reply, {
        mode: ctx.mode, action: ctx.action, topic: ctx.topic, agentFile: ctx.agentFile, jdFile: ctx.jdFile, day: ctx.day,
        isRetryPractice: Boolean(ctx.retryOf?.better), doubleXpActive: Boolean(ctx.doubleXpActive)
      });

  safeWrite({ type: 'done', reply, xpEarned, state, tutorAngle: ctx.chosenTutorAngle || null, interviewerCompany: ctx.interviewerCompany || null, scriptSessionId: ctx.scriptSessionId || null });
  if (!res.writableEnded && !res.destroyed) res.end();

  if (ctx.mode === 'tutor' && !ctx.isGuestSession && ctx.action === 'turn' && ctx.normalizedMsgs.length >= 2) {
    scheduleStudentMemoryUpdate({
      model: ctx.model,
      messages: [...ctx.normalizedMsgs, { role: 'assistant', content: spokenEnglish }],
      topicLabel: ctx.tutorTopicLabel
    });
  }
}

export async function handleChat(body) {
  if (body?.action && body.action !== 'finish') {
    const err = new Error('POST /api/chat only handles action="finish"; use POST /api/chat/stream for turns.');
    err.statusCode = 400;
    throw err;
  }
  clearScriptSession(body?.scriptSessionId);
  const ctx = await resolveChatContext(body, { isFinish: true });
  const finishTier = getLeadershipTier(ctx.interviewFinishMeta?.effectiveArchKey || 'general');
  const qNoteHint = finishTier === 'executive'
    ? '1 concise sentence evaluating Executive Reverse Due Diligence (Board alignment, runway/burn, NRR/churn truth, mandate autonomy)'
    : finishTier === 'manager'
      ? '1 concise sentence evaluating Leadership Due Diligence (team health, headcount, PM-Eng trade-offs, autonomy)'
      : '1 concise sentence evaluating whether the candidate asked insightful closing questions';
  const buildFinishContract = (verdictEnum) => `
=== STRICT OUTPUT FORMAT (RETURN ONLY VALID JSON, NO MARKDOWN FENCES) ===
CRITICAL LANGUAGE RULE: ALL JSON fields MUST be in English ONLY.
{
  "spokenEnglish": "Warm, natural spoken English goodbye (2-3 crisp sentences max, NO markdown).",
  "coachPause": null,
  "microTipHu": null OR "1-2 sentence tip",
  "scorecard": {
    "subScores": { "english": 1-10, "analysis": 1-10, "techRoi": 1-10, "confidence": 1-10 },
    "totalScore": number (1.0-10.0),
    "percentile": "Top X%",
    "verdict": ${verdictEnum},
    "strengthsHu": ["Concrete strength 1 in English", "Concrete strength 2 in English"],
    "weaknessesHu": ["Concrete improvement 1 in English", "Concrete improvement 2 in English"],
    "goldenSentences": ["Senior English golden sentence 1", "Golden sentence 2", "Golden sentence 3"],
    "candidateQuestionsNote": null OR "${qNoteHint}"
  }
}`;

  let systemPrompt = '';
  let finishPrompt = 'The 10-minute interview is over. Say a realistic English goodbye in "spokenEnglish" and return the strict English Top 5% "scorecard" JSON object now.';
  const summaryNote = ctx.earlierSummary ? `\n\n${ctx.earlierSummary}` : '';
  if (ctx.logicFinishMeta) {
    const { teacher, puzzle, scratchpadText } = ctx.logicFinishMeta;
    systemPrompt = `You are ${teacher.name}, wrapping up a collaborative ${puzzle?.durationMinutes || 10}-minute analytical logic puzzle ("${puzzle?.title || 'Logic Puzzle'}") with ${ctx.firstName}.
Active scratchpad notes: """${String(scratchpadText || '').slice(0, 1500)}"""
Reference key solution: ${puzzle?.solutionGuide || ''}
Give 2 concrete strengths in "strengthsHu", 2 improvements in "weaknessesHu", and 3 English problem-solving phrases in "goldenSentences".${summaryNote}\n\n${buildFinishContract('"SHARP REASONING" | "SOLID STRUCTURE" | "KEEP PRACTICING"')}`;
    finishPrompt = 'The logic puzzle practice call is wrapping up! Summarize what worked well on the scratchpad and reasoning in "spokenEnglish" (concise grounded English), and return ONLY valid JSON with an honest analytical "scorecard" object.';
  } else if (ctx.tutorFinishMeta) {
    const { teacher, tutorLevel } = ctx.tutorFinishMeta;
    systemPrompt = `You are ${teacher.name}, a warm female English teacher wrapping up a lesson with ${ctx.firstName} (Target level: ${tutorLevel}). Evaluate English clarity, grammar progress, natural phrasing, and confidence in English ONLY. Give 2 strengths in "strengthsHu", 2 grammar rules in "weaknessesHu", and 3 sentences in "goldenSentences".${summaryNote}\n\n${buildFinishContract('"EXCELLENT PROGRESS" | "GREAT FLUENCY" | "STEADY GROWTH"')}`;
    finishPrompt = 'The English lesson is wrapping up! Return a warm teacher goodbye in "spokenEnglish" and return ONLY valid JSON matching the exact schema with an encouraging "scorecard" object.';
  } else {
    const m = ctx.interviewFinishMeta;
    const kbDebrief = formatKnowledgeForDebrief({ archKey: m.effectiveArchKey || 'general', topic: m.effectiveTopic || 'Technical', compact: Boolean(m.isSmallTier) });
    systemPrompt = m.isSmallTier
      ? `Interviewer: ${m.meta?.avatarName || 'Interviewer'} (${m.effectiveTopic}). Evaluate candidate objectively.\n${m.coreRules}${summaryNote}\n\n${kbDebrief}\n\n=== TARGET JD ===\n${m.jdPrompt}\n\n${buildFinishContract('"NO HIRE" | "LEAN HIRE" | "STRONG HIRE (TOP 5%)"')}`
      : `${m.coreRules}\n\n${m.personalityBlock}${summaryNote}\n\n${kbDebrief}\n\n=== ACTIVE INTERVIEWER AGENT ===\n${m.agentPrompt}\n\n=== TARGET JOB DESCRIPTION ===\n${m.jdPrompt}\n\n${buildFinishContract('"NO HIRE" | "LEAN HIRE" | "STRONG HIRE (TOP 5%)"')}`;
  }

  const budgets = ctx.tierInfo?.budgets || { numCtx: 8192, numPredict: 700 };
  const chatMessages = [{ role: 'system', content: systemPrompt }, ...ctx.normalizedMsgs, { role: 'user', content: finishPrompt }];
  const ollamaRes = await fetchOllamaChat(
    {
      model: ctx.model,
      messages: chatMessages,
      stream: false,
      format: 'json',
      options: { temperature: 0.45, num_ctx: budgets.numCtx, num_predict: Math.max(700, budgets.numPredict || 700) }
    },
    90000
  );
  const ollamaData = await ollamaRes.json();
  const parsed = extractJsonSafe(ollamaData?.message?.content || '');

  const { xpEarned, state } = ctx.isGuestSession
    ? { xpEarned: 0, state: await ensureState() }
    : await persistChatSideEffects(parsed, {
        mode: ctx.mode, action: body.action || 'finish', topic: ctx.topic, agentFile: ctx.agentFile, jdFile: ctx.jdFile, day: ctx.day, doubleXpActive: Boolean(ctx.doubleXpActive),
        speechMetrics: body?.speechMetrics || null
      });

  if (ctx.mode === 'tutor' && !ctx.isGuestSession && ctx.normalizedMsgs.length >= 2) {
    scheduleStudentMemoryUpdate({
      model: ctx.model,
      messages: [...ctx.normalizedMsgs, { role: 'assistant', content: parsed.spokenEnglish || '' }],
      topicLabel: ctx.topic
    });
  }
  return { reply: parsed, xpEarned, state };
}

export { resolveChatContext };
