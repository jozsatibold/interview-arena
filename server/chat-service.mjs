import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  pickPersonality,
  FIXED_TUTOR_PERSONALITY,
  FIXED_LOGIC_PERSONALITY
} from '../personalities.mjs';
import {
  stripStaticOpenerSection,
  buildInterviewPacingDirectives,
  buildTurnContextAddendum,
  trimConversationForTier,
  buildInterviewPrompt,
  TUTOR_PACING_RULE,
  LOGIC_PACING_RULE
} from './pacing.mjs';
import { findArtifactById, isScreenShareAllowedTopic } from '../shared/interview-artifacts.mjs';
import { resolveEffectiveContextTier } from '../shared/model-tiers.mjs';
import { getAdaptedAgents, buildDynamicAgentDirective } from '../role-adapter.mjs';
import {
  LOGIC_DIFFICULTIES,
  LOGIC_CATEGORIES,
  CURATED_LOGIC_PUZZLES,
  sanitizeLogicPuzzleForClient,
  getPublicLogicPuzzles,
  findLogicPuzzle
} from '../logic-puzzles.mjs';
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
  saveStudentMemorySync,
  getSavedLogicPuzzlesSync,
  saveCustomLogicPuzzleSync
} from './db.mjs';
import {
  COACH_JSON_DELIMITER,
  fetchOllamaChat,
  getCachedModelMeta,
  consumeNdjsonBody,
  stripThinkBlocks,
  extractJsonSafe,
  parseJsonObjectStrict,
  findCoachMarker,
  summarizeMdPrompt
} from './ollama.mjs';
import { resolveTargetContext } from './document-service.mjs';
import {
  pickFreshTutorAngle,
  buildStudentMemoryBrief,
  scheduleStudentMemoryUpdate
} from './tutor-memory.mjs';

const transientLogicPuzzles = new Map();

function rememberTransientPuzzle(puzzle) {
  if (transientLogicPuzzles.size >= 50) {
    const oldestKey = transientLogicPuzzles.keys().next().value;
    if (oldestKey) transientLogicPuzzles.delete(oldestKey);
  }
  transientLogicPuzzles.set(puzzle.id, puzzle);
}

export function resolveLogicPuzzleById(id) {
  if (id && transientLogicPuzzles.has(id)) return transientLogicPuzzles.get(id);
  return findLogicPuzzle(id, getSavedLogicPuzzlesSync());
}

export function listPublicLogicPuzzles(includeTransient = false) {
  const custom = getSavedLogicPuzzlesSync();
  const extra = includeTransient ? [...transientLogicPuzzles.values(), ...custom] : custom;
  return getPublicLogicPuzzles(extra);
}

export function getLogicPuzzleHint(id, step = 0) {
  const puzzle = resolveLogicPuzzleById(id);
  if (!puzzle) {
    const err = new Error(`Logic puzzle not found: ${id}`);
    err.statusCode = 404;
    throw err;
  }
  const hints = Array.isArray(puzzle.hints) ? puzzle.hints : [];
  const rawStep = Number(step);
  const safeStep = Number.isFinite(rawStep) ? rawStep : 0;
  const idx = Math.max(0, Math.min(Math.max(0, hints.length - 1), Math.floor(safeStep)));
  return {
    hint: hints[idx] || 'Break the problem down into explicit cases or invariants on your scratchpad.',
    index: idx,
    total: hints.length
  };
}

export async function generateLogicPuzzleWithAi({ model = 'qwen3.5:9b', difficulty = '10min', category = 'Any', guestMode = false }) {
  const diffMeta = LOGIC_DIFFICULTIES.find((d) => d.id === difficulty) || LOGIC_DIFFICULTIES[1];
  const chosenCat = category && category !== 'Any'
    ? category
    : LOGIC_CATEGORIES[Math.floor(Math.random() * LOGIC_CATEGORIES.length)].id;
  const existingTitles = [...CURATED_LOGIC_PUZZLES, ...getSavedLogicPuzzlesSync()].map((p) => p.title).slice(0, 24);

  const prompt = `Create ONE crisp, mathematically sound, interview-grade analytical logic puzzle / brainteaser for a live ${diffMeta.minutes}-minute interview call.
Target Difficulty: ${diffMeta.label} (${diffMeta.minutes} minutes).
Category: ${chosenCat}.
Avoid repeating or lightly cloning these existing titles: ${existingTitles.join(', ')}.

Requirements:
- Must be solvable verbally + on a plain-text collaborative scratchpad in ${diffMeta.minutes} minutes without writing full code or external tools.
- Must have an unambiguous logical path or structured Fermi estimation framework.
- Provide a helpful plain-text "scratchpadTemplate" (with headings/placeholders, WITHOUT giving away the solution!) that structures the candidate's thinking.
- Provide 2 progressive hints and a clear "solutionGuide" for the interviewer.

Return ONE valid JSON object ONLY (no markdown fences):
{
  "title": "Short memorable puzzle title (3-7 words)",
  "prompt": "Clear 2-4 sentence puzzle statement with exact numbers and rules.",
  "constraints": ["Constraint 1", "Constraint 2", "Constraint 3"],
  "scratchpadTemplate": "Structured multi-line plain text workspace template with empty steps/tables to fill in.",
  "hints": ["Gentle first nudge", "Stronger structural hint"],
  "solutionGuide": "Exact logical proof / step-by-step solution for the interviewer."
}`;

  const res = await fetchOllamaChat(
    {
      model,
      stream: false,
      format: 'json',
      options: { temperature: 0.75, num_predict: 900 },
      messages: [{ role: 'user', content: prompt }]
    },
    45000
  );
  const data = await res.json();
  const parsed = parseJsonObjectStrict(data?.message?.content || '');
  if (!parsed?.title || !parsed?.prompt) {
    throw new Error('Could not generate a valid logic puzzle from the selected model. Please try again.');
  }

  const puzzle = {
    id: `lp-ai-${crypto.randomUUID()}`,
    difficulty: diffMeta.id,
    durationMinutes: diffMeta.minutes,
    category: chosenCat,
    needsScratchpad: true,
    title: String(parsed.title).trim().slice(0, 90),
    prompt: String(parsed.prompt).trim(),
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map((c) => String(c).trim()).filter(Boolean).slice(0, 5) : [],
    scratchpadTemplate: String(parsed.scratchpadTemplate || 'Variables & Constraints:\n\nStep 1:\n\nStep 2:\n\nConclusion:').trim(),
    hints: Array.isArray(parsed.hints) ? parsed.hints.map((h) => String(h).trim()).filter(Boolean).slice(0, 3) : [],
    solutionGuide: String(parsed.solutionGuide || 'Guide the candidate step-by-step from invariants and edge cases.').trim(),
    isCustom: true,
    createdAt: new Date().toISOString()
  };

  if (guestMode) rememberTransientPuzzle(puzzle);
  else saveCustomLogicPuzzleSync(puzzle);

  return sanitizeLogicPuzzleForClient(puzzle);
}

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
    scratchpadPin: scratchpadPin && scratchpadPin.toLowerCase() !== 'null' ? scratchpadPin : null
  };
}

function buildTutorSystemPrompt({ teacher, topicObj, customTopic = '', tutorLevel = 'B2-C1', firstName = 'there', stackSummary = '', studentBrief = '', retryOf = null, action = 'turn' }) {
  const activeTopicText = String(customTopic || '').trim() || topicObj?.prompt || 'Natural everyday English conversation and helpful grammar coaching';
  return `You are ${teacher.name}, a grounded, observant, encouraging female English language teacher (${teacher.accent} · ${teacher.specialty}).
Student first name: ${firstName}${stackSummary ? ` (Software background: ${stackSummary})` : ''}.
English Target Level: ${tutorLevel}.
Lesson Focus: ${activeTopicText}.${studentBrief}

${FIXED_TUTOR_PERSONALITY.prompt}
${TUTOR_PACING_RULE}

CORE TEACHING & REALISM RULES (CRITICAL):
1. ANTI-SYCOPHANCY / PROPORTIONAL REACTIONS: NEVER say hollow hype like "Amazing!", "Awesome!", "Fantastic!", "Brilliant!" on ordinary, routine, tiring, or technical things! Match your reaction proportionally and honestly to what ${firstName} actually said.
2. PERSONALIZED ANALOGIES & DIVERSE EXPLORATION: If explaining a grammar rule or subtle nuance, use analogies matching ${firstName}'s thinking style and known hobbies/work when it fits naturally — and keep the chat moving across varied, interesting adjacent subjects with gentle bridges.
3. PATIENT TEACHING & WHY: Whenever ${firstName} makes a genuine grammar mistake or awkward literal phrasing, react patiently and warmly first, model the natural phrasing kindly, explain WHY concisely in 1-2 sentences, and ask one supportive follow-up question.
4. CRISP EXPRESSIVE OPENER: Start every reply with ONE short 3-7 word proportionally attuned spoken sentence, then continue in 2-3 patient spoken sentences (NO markdown, NO asterisks, NO emojis, NO bullet points).
5. LANGUAGE RULE: English ONLY everywhere. Ignore minor voice-recognition phonetic typos.
6. STAY IN ROLE & DEFLECT OFF-SCOPE: You are strictly an English communication teacher. NEVER act as a technical interviewer, coding assistant, or general-purpose chatbot. If ${firstName} asks for code solutions, system design quizzes, or unrelated off-topic tasks, politely deflect in character and steer the conversation back to English speaking practice.

STREAMING OUTPUT CONTRACT (FOLLOW EXACTLY):
1. First, write ONLY your spoken English teacher reply.
2. Put exact delimiter on its own line:
${COACH_JSON_DELIMITER}
3. Immediately after the delimiter, write ONE compact JSON object in English ONLY:
{
  "expression": "warm" | "curious" | "firm" | "amused" | "skeptical",
  "coachPause": null,
  "grammarFixes": [] | [{"type":"Grammar"|"Phrasing"|"Preposition"|"Tense"|"Word-Choice","said":"exact phrase student said that had an issue","better":"natural English correction","why":"Clear 1-2 sentence explanation tailored to student's thinking style"}],
  "microTipHu": null | "1 short practical English takeaway"
}
On EVERY "turn" (not "start"): include 1-2 "grammarFixes" ONLY when something grammatical or phrasing-wise actually warrants improving (leave [] if clean!). On "start", set "grammarFixes": [].
${action === 'turn' && retryOf?.better ? `\nRETRY PRACTICE NOTE: ${firstName} clicked "Say It Again" to practice saying "${String(retryOf.better).slice(0, 240)}" aloud! Acknowledge naturally (grounded, not over-hyped), confirm why it works cleanly, and continue.` : ''}`;
}

function buildLogicSystemPrompt({ teacher, puzzle, firstName = 'there', scratchpadText = '', scratchpadChanged = false, remainingSeconds = null, studentBrief = '', guestMode = false, boardCheckOnly = false }) {
  const minsLeft = remainingSeconds !== null && remainingSeconds !== undefined
    ? `${Math.floor(remainingSeconds / 60)}m ${String(remainingSeconds % 60).padStart(2, '0')}s remaining of ${puzzle.durationMinutes} min budget`
    : `${puzzle.durationMinutes}-minute puzzle`;
  const padClean = String(scratchpadText || '').trim();
  const constraintsText = (puzzle.constraints || []).map((c) => `- ${c}`).join('\n');

  return `You are ${teacher.name}, a steady, balanced female analytical interview partner (${teacher.accent} · ${teacher.specialty}) co-solving a ${puzzle.durationMinutes}-minute interview logic puzzle with ${firstName}.
Time Status: ${minsLeft}.
${FIXED_LOGIC_PERSONALITY.prompt}
${LOGIC_PACING_RULE}
${guestMode ? 'GUEST MODE ACTIVE: Be welcoming and neutral. Do NOT reference any personal background, CV, or hobbies.' : studentBrief}

=== ACTIVE LOGIC PUZZLE ===
Title: ${puzzle.title} (${puzzle.difficulty} · ${puzzle.category})
Problem Statement: ${puzzle.prompt}
Constraints:
${constraintsText || '- None listed'}

=== HIDDEN INTERVIEWER SOLUTION KEY (NEVER BLURT THIS OUT PREMATURELY!) ===
${puzzle.solutionGuide || 'Evaluate logical structure, assumptions, and edge cases.'}
Hints if stuck: ${(puzzle.hints || []).join(' | ')}

=== LIVE SHARED SCRATCHPAD (WHAT ${firstName.toUpperCase()} HAS ON THEIR NOTEPAD RIGHT NOW) ===
${scratchpadChanged ? '[Status: Student JUST edited the scratchpad! Inspect every line carefully!]' : '[Status: Current visible scratchpad snapshot]'}
"""
${padClean || '(Scratchpad is currently empty.)'}
"""

CRITICAL COLLABORATION & COACHING RULES:
1. LIVE NOTEPAD AWARENESS: You can SEE ${firstName}'s scratchpad above in real time! Explicitly reference specific numbers, hypotheses, or lines they wrote on the scratchpad when helpful. ${boardCheckOnly ? 'Right now they clicked "Check My Notes" without speaking—give sharp, concrete feedback directly on what is written in their scratchpad!' : ''}
2. SYMMETRY & EQUIVALENT LABELING RULE (CRITICAL): Arbitrary labels in the hidden solution key (such as Switch A vs Switch B, Ball 1 vs Ball 9, or Person A vs B) are completely interchangeable! If ${firstName} chooses a symmetric valid solution (for example, keeping Switch A ON and briefly heating Switch B instead of the reverse), validate the PHYSICAL & LOGICAL INVARIANT first—NEVER argue or claim they are wrong just because their A/B letters differ from the hidden guide!
3. DO NOT SPOIL EARLY: Do NOT reveal the hidden mechanism on the first 1-2 turns unless ${firstName} explicitly asks for a direct hint or wants to give up. Guide with Socratic questions one small step at a time.
4. ANTI-SYCOPHANCY / HONEST CALIBRATION: NEVER give fake praise when reasoning has gaps. Verify contradictions calmly and confirm valid invariants proportionally.
5. ENGLISH & CONCISE SPOKEN PACE: Keep replies crisp (2-3 spoken sentences max, NO bullet points, NO asterisks '*', NO numbered lists in spoken dialogue!). Fix clear English grammar slips softly in "grammarFixes".
6. OPTIONAL BOARD PIN ("scratchpadPin"): Only when a quick structure, table row, or diagnostic question on the notepad would genuinely help ${firstName} collaborate faster (WITHOUT revealing the solution!), include a short 1-3 line plain-text "scratchpadPin"; otherwise set null.
7. STAY IN ROLE & DEFLECT OFF-SCOPE: Stay strictly inside this analytical logic puzzle session. NEVER conduct HR screening, compensation talk, unrelated coding tasks, or act as a general AI assistant—politely deflect off-topic drift and guide ${firstName} back to "${puzzle.title}".

STREAMING OUTPUT CONTRACT (FOLLOW EXACTLY):
1. First, write ONLY your spoken English reply (no JSON, no --- yet).
2. Then put this EXACT delimiter on its own line:
${COACH_JSON_DELIMITER}
3. Immediately after ${COACH_JSON_DELIMITER}, write ONE compact valid JSON object in English ONLY:
{
  "expression": "warm" | "curious" | "firm" | "amused" | "skeptical",
  "coachPause": null,
  "grammarFixes": [] | [{"type":"Grammar"|"Phrasing"|"Word-Choice","said":"exact slip","better":"natural English correction","why":"1 concise explanation"}],
  "scratchpadPin": null | "Short 1-3 line plain-text helper template or question to add to the scratchpad (never the final answer!)",
  "microTipHu": null | "1 short analytical problem-solving or English communication tip"
}`;
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
    continuousFlow,
    elapsedSeconds = null,
    targetDurationSeconds = null,
    interrupted = false,
    screenShareId = null,
    highlightedLines = [],
    artifactNotes = '',
    retryOf = null,
    doubleXpActive = false
  } = body;

  const isGuestSession = Boolean(guestMode && (mode === 'tutor' || mode === 'logic'));
  const activeCv = isGuestSession ? null : await getActiveCv();
  const savedState = modelContextTier ? null : await ensureState();
  const tierInfo = resolveEffectiveContextTier({
    preference: modelContextTier || savedState?.modelContextTier || 'auto',
    modelName: model,
    modelMeta: getCachedModelMeta(model)
  });
  const useStaticAgentFile = !isGuestSession && (!activeCv || activeCv.id === 'cv-baseline-1');
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
    const adaptedAgents = getAdaptedAgents(AGENT_META, activeCv);
    const meta = adaptedAgents.find((a) => a.id === validMeta.id) || validMeta;
    const personality = pickPersonality(topic, personalityTraits || personalityId);
    const personalityBlock = `INTERVIEWER PERSONALITY (${personality.emoji} ${personality.label} — ${personality.mood}):\nEmbody this realistic human personality naturally without exaggerating or becoming extreme.\nBEHAVIORAL DIRECTIVE: ${personality.prompt}`;
    const rawAgentMd = useStaticAgentFile
      ? stripStaticOpenerSection(await fs.readFile(path.join(ROOT_DIR, 'agents', validMeta.id), 'utf8'))
      : '';
    const agentLimit = isFinish ? 2200 : tierInfo.budgets.maxAgentChars;
    const jdLimit = isFinish ? 1400 : tierInfo.budgets.maxJdChars;
    const cvGuardText = `${activeCv?.rawText || ''}\n${activeCv?.profile?.profilePrompt || ''}`;
    const cleanReqCompany = String(interviewerCompany || '').trim().slice(0, 64);
    resolvedCompany = customInterviewId
      ? ''
      : (cleanReqCompany && !companyAppearsInText(cleanReqCompany, cvGuardText))
        ? cleanReqCompany
        : pickRandomCompanyName(cvGuardText);
    const agentPrompt = useStaticAgentFile
      ? summarizeMdPrompt(rawAgentMd, agentLimit)
      : summarizeMdPrompt(buildDynamicAgentDirective({ meta, activeCv, companyName: resolvedCompany }), agentLimit);
    const { jdPrompt, openerHint } = await resolveTargetContext({ jdFile, customInterviewId, customRoundId, day, companyName: resolvedCompany }, jdLimit);
    const pacing = buildInterviewPacingDirectives({
      action,
      topic,
      userTurns: fullUserTurnCount,
      elapsedSeconds,
      targetDurationSeconds,
      firstName,
      avatarName: meta?.avatarName || 'the interviewer',
      companyName: resolvedCompany,
      personality,
      openerHint,
      compactMode: tierInfo.budgets.compactPrompt
    });
    const screenShareArtifact = isScreenShareAllowedTopic(topic) && screenShareId ? findArtifactById(screenShareId) : null;
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
        retryOf
      }));
    } else {
      const coreRules = !useStaticAgentFile
        ? `${activeCv?.profile?.profilePrompt || ''}\n\nFULL CV:\n${summarizeMdPrompt(activeCv?.rawText || '', 3000)}`
        : await fs.readFile(path.join(ROOT_DIR, '00-candidate-profile-and-core-rules.md'), 'utf8');
      return {
        model, mode, isGuestSession, firstName, normalizedMsgs, tierInfo, earlierSummary,
        topic: effectiveTopic, agentFile: effectiveAgentFile, jdFile: effectiveJdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel,
        interviewFinishMeta: { coreRules, personalityBlock, agentPrompt, jdPrompt, activeCv, meta, isContinuous },
        systemPrompt: '',
        startPrompt
      };
    }
  }

  return { model, mode, isGuestSession, firstName, normalizedMsgs, topic: effectiveTopic, agentFile: effectiveAgentFile, jdFile: effectiveJdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel, interviewerCompany: resolvedCompany, systemPrompt, startPrompt, action, tierInfo };
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
        const tailHold = spokenPart.match(/(?:\s---+\s*\{?|\s```(?:json)?\s*\{?|\s\{\s*(?:"(?:expression|coachPause|grammarFixes|scratchpadPin|microTipHu)?)?|\s---?)$/);
        if (tailHold && tailHold.index !== undefined && tailHold.index < safeEnd) safeEnd = tailHold.index;
      }
      if (delimIdx !== -1) delimReached = true;

      if (safeEnd > streamedSpokenLen) {
        const nextDelta = spokenPart.slice(streamedSpokenLen, safeEnd);
        streamedSpokenLen = safeEnd;
        safeWrite({ type: 'token', delta: nextDelta, spokenSoFar: spokenPart.slice(0, safeEnd).trimStart() });
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

  const metaJson = delimIdx !== -1 ? extractCoachMeta(extractJsonSafe(cleanFinal.slice(delimIdx + markerLen).trim())) : { expression: 'warm', coachPause: null, microTipHu: null, grammarFixes: [], scratchpadPin: null };
  const reply = { spokenEnglish, expression: metaJson.expression, coachPause: metaJson.coachPause, microTipHu: metaJson.microTipHu, grammarFixes: metaJson.grammarFixes, scratchpadPin: metaJson.scratchpadPin || null, scorecard: null };

  const { xpEarned, state } = ctx.isGuestSession
    ? { xpEarned: 0, state: await ensureState() }
    : await persistChatSideEffects(reply, {
        mode: ctx.mode, action: ctx.action, topic: ctx.topic, agentFile: ctx.agentFile, jdFile: ctx.jdFile, day: ctx.day,
        isRetryPractice: Boolean(ctx.retryOf?.better), doubleXpActive: Boolean(ctx.doubleXpActive)
      });

  safeWrite({ type: 'done', reply, xpEarned, state, tutorAngle: ctx.chosenTutorAngle || null, interviewerCompany: ctx.interviewerCompany || null });
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
  const ctx = await resolveChatContext(body, { isFinish: true });
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
    "candidateQuestionsNote": null OR "1 concise sentence evaluating whether the candidate asked insightful closing questions"
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
    systemPrompt = `${m.coreRules}\n\n${m.personalityBlock}${summaryNote}\n\n=== ACTIVE INTERVIEWER AGENT ===\n${m.agentPrompt}\n\n=== TARGET JOB DESCRIPTION ===\n${m.jdPrompt}\n\n${buildFinishContract('"NO HIRE" | "LEAN HIRE" | "STRONG HIRE (TOP 5%)"')}`;
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
