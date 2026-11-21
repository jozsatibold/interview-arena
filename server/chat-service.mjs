import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  pickPersonality,
  FIXED_TUTOR_PERSONALITY,
  FIXED_LOGIC_PERSONALITY
} from '../personalities.mjs';
import {
  stripStaticOpenerSection,
  buildInterviewPacingDirectives,
  TUTOR_PACING_RULE,
  LOGIC_PACING_RULE
} from './pacing.mjs';
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
import {
  ROOT_DIR,
  AGENT_META,
  COMPACT_CANDIDATE_PROFILE,
  TUTOR_CATALOG,
  TUTOR_ROTATION_ANGLES
} from './config.mjs';
import {
  ensureState,
  saveState,
  getActiveCv,
  getStudentMemorySync,
  saveStudentMemorySync,
  getSavedLogicPuzzlesSync,
  saveCustomLogicPuzzleSync
} from './db.mjs';
import {
  COACH_JSON_DELIMITER,
  fetchOllamaChat,
  consumeNdjsonBody,
  stripThinkBlocks,
  extractJsonSafe,
  findCoachMarker,
  summarizeMdPrompt
} from './ollama.mjs';
import { resolveTargetContext } from './document-service.mjs';

let memoryUpdateInFlight = false;
const transientLogicPuzzles = new Map();

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
  const hints = Array.isArray(puzzle?.hints) ? puzzle.hints : [];
  const idx = Math.max(0, Math.min(hints.length - 1, Number(step || 0)));
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
  const parsed = extractJsonSafe(data?.message?.content || '');
  if (!parsed?.title || !parsed?.prompt) {
    throw new Error('Could not generate a valid logic puzzle from the selected model. Please try again.');
  }

  const puzzle = {
    id: `lp-ai-${Date.now()}`,
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

  if (guestMode) transientLogicPuzzles.set(puzzle.id, puzzle);
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
    if (diffDays === 1) {
      state.streak += 1;
    } else if (diffDays > 1 && state.streakFreezes > 0) {
      state.streakFreezes -= 1;
      state.streak += 1;
    } else {
      state.streak = 1;
    }
  }
  state.lastPracticeDate = today;
}

async function appendProgressLog(scorecard, agentMeta, jdId) {
  const logPath = path.join(ROOT_DIR, 'progress-log.md');
  if (!existsSync(logPath) || !scorecard) return;
  const date = new Date().toISOString().slice(0, 10);
  const s = scorecard.subScores || {};
  const row = `| ${date} | ${agentMeta?.code || 'Custom'} (${agentMeta?.topic || 'General'}) | \`${jdId || 'custom'}\` | ${s.english ?? '-'}/10 | ${s.analysis ?? '-'}/10 | ${s.techRoi ?? '-'}/10 | ${s.confidence ?? '-'}/10 | **${scorecard.totalScore}/10** | ${scorecard.percentile} (\`${scorecard.verdict}\`) | ${(scorecard.goldenSentences?.[0] || '').replaceAll('|', '/')} |\n`;
  await fs.appendFile(logPath, row, 'utf8');
}

function recordMistakeItem(state, { category, original, better, reason, topic }) {
  const cleanOrig = String(original || '').trim();
  const cleanBetter = String(better || '').trim();
  if (!cleanOrig || !cleanBetter || cleanOrig.toLowerCase() === cleanBetter.toLowerCase()) return;

  const existing = state.mistakes.find((m) => m.original.toLowerCase() === cleanOrig.toLowerCase());
  const today = new Date().toISOString().slice(0, 10);
  if (existing) {
    existing.count += 1;
    existing.mastered = false;
    existing.lastSeen = today;
  } else {
    state.mistakes.unshift({
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: category || 'Grammar',
      original: cleanOrig,
      better: cleanBetter,
      reasonHu: String(reason || '').trim(),
      count: 1,
      mastered: false,
      topic: topic || 'General',
      lastSeen: today
    });
  }
}

export async function persistChatSideEffects(parsed, { model, action, topic, agentFile, jdFile, day, isRetryPractice = false, doubleXpActive = false }) {
  const state = await ensureState();
  state.selectedModel = model;

  if (parsed.coachPause?.original) {
    recordMistakeItem(state, {
      category: parsed.coachPause.category || 'B2-to-Senior',
      original: parsed.coachPause.original,
      better: parsed.coachPause.seniorUpgrades?.[0] || '',
      reason: parsed.coachPause.reasonHu || parsed.coachPause.reason || '',
      topic
    });
  }
  if (Array.isArray(parsed.grammarFixes)) {
    for (const fix of parsed.grammarFixes) {
      recordMistakeItem(state, {
        category: fix.type || 'Grammar',
        original: fix.said,
        better: fix.better,
        reason: fix.why || '',
        topic
      });
    }
  }

  const xpMult = doubleXpActive ? 2 : 1;
  let xpEarned = action === 'turn' ? (isRetryPractice ? 25 : 15) * xpMult : 0;
  if (parsed.scorecard && typeof parsed.scorecard.totalScore === 'number') {
    updateStreak(state);
    xpEarned = Math.round(50 + parsed.scorecard.totalScore * 10) * xpMult;
    state.xp += xpEarned;
    state.gems += parsed.scorecard.totalScore >= 8 ? 30 : 15;
    if (day && !state.completedDays.includes(Number(day))) state.completedDays.push(Number(day));
    state.sessions.push({
      id: `s-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      topic,
      agentFile,
      jdFile,
      day: day ? Number(day) : null,
      subScores: parsed.scorecard.subScores || { english: 7, analysis: 7, techRoi: 7, confidence: 7 },
      totalScore: parsed.scorecard.totalScore,
      percentile: parsed.scorecard.percentile || 'Top 15%',
      verdict: parsed.scorecard.verdict || 'LEAN HIRE'
    });
    const meta = AGENT_META.find((a) => a.id === agentFile);
    await appendProgressLog(parsed.scorecard, meta, jdFile);
  } else if (action === 'turn') {
    state.xp += xpEarned;
    updateStreak(state);
  }

  await saveState(state);
  return { xpEarned, state };
}

function extractCoachMeta(parsedMeta) {
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
  return {
    coachPause: parsedMeta?.coachPause || null,
    microTipHu: parsedMeta?.microTipHu || null,
    grammarFixes,
    scratchpadPin: scratchpadPin && scratchpadPin.toLowerCase() !== 'null' ? scratchpadPin : null
  };
}

function pickFreshTutorAngle(mem) {
  const recent = new Set((mem.recentAngles || []).map((a) => String(a).toLowerCase()));
  const pool = TUTOR_ROTATION_ANGLES.filter((a) => !recent.has(a.toLowerCase()));
  const list = pool.length ? pool : TUTOR_ROTATION_ANGLES;
  return list[Math.floor(Math.random() * list.length)];
}

function buildStudentMemoryBrief(mem, freshAngle = '') {
  if (!mem) return '';
  const cm = mem.cognitiveMap || {};
  const parts = [];
  if (cm.thinkingStyle || cm.explanationPreference || cm.summary) {
    parts.push(`Thinking & Explanation Map: ${cm.thinkingStyle || ''}. Explanations click best via: ${cm.explanationPreference || 'concrete analogies'}. ${cm.summary || ''}`);
  }
  if (Array.isArray(mem.hobbies) && mem.hobbies.length) parts.push(`Known Interests/Hobbies (use gently as analogies): ${mem.hobbies.join(', ')}`);
  if (Array.isArray(mem.facts) && mem.facts.length) parts.push(`Key Personal Notes: ${mem.facts.slice(-6).join(' | ')}`);
  if (Array.isArray(mem.topicScores) && mem.topicScores.length) {
    const topScores = [...mem.topicScores]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 6)
      .map((t) => `${t.topic} (interest:${t.engagement}/10, fluency:${t.fluency}/10)`);
    parts.push(`Topic History: ${topScores.join(' | ')}`);
  }
  if (freshAngle) parts.push(`TODAY'S FRESH TOPIC ROTATION (must keep conversation diverse and interesting, touch adjacent subjects beyond past topics): ${freshAngle}`);
  return parts.length ? `\nSTUDENT LEARNING & THINKING MAP (subtle guidance — never recite mechanically):\n${parts.join('\n')}` : '';
}

function scheduleStudentMemoryUpdate({ model, messages, topicLabel }) {
  if (memoryUpdateInFlight || !Array.isArray(messages) || messages.length < 2) return;
  const recentTurns = messages.slice(-6).map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
  const current = getStudentMemorySync();
  memoryUpdateInFlight = true;

  (async () => {
    try {
      const prompt = `You are a background educational memory tracker updating a student's Learning & Thinking Map from the latest English conversation snippet.
Preserve existing valid insights, merge NEW facts concisely, score any discussed topics (1-10 engagement & 1-10 English fluency), and refine how the student thinks/understands explanations best.

CURRENT MAP:
- Hobbies: ${JSON.stringify(current.hobbies)}
- Facts: ${JSON.stringify(current.facts)}
- Topic Scores: ${JSON.stringify(current.topicScores)}
- Cognitive Map: ${JSON.stringify(current.cognitiveMap)}
- Current Session Focus: ${topicLabel}

LATEST EXCHANGES:
${recentTurns}

Return ONE compact JSON object:
{
  "newHobbies": ["short hobby/interest only if genuinely mentioned, else []"],
  "newFacts": ["concise factual detail about the student's work/life/goals only if mentioned, else []"],
  "scoredTopics": [{"topic": "short 2-4 word topic", "engagement": 1-10, "fluency": 1-10}],
  "cognitiveMap": {
    "thinkingStyle": "concise label",
    "explanationPreference": "how grammar/concepts click best for this student",
    "tonePreference": "preferred conversational tone",
    "summary": "1-2 sentence portrait of how this student thinks and communicates"
  }
}`;
      const res = await fetchOllamaChat(
        {
          model,
          stream: false,
          format: 'json',
          options: { temperature: 0.2, num_predict: 420 },
          messages: [{ role: 'user', content: prompt }]
        },
        25000
      );
      const data = await res.json();
      const upd = extractJsonSafe(data?.message?.content || '');
      const next = getStudentMemorySync();

      if (Array.isArray(upd.newHobbies)) {
        next.hobbies = [...new Set([...next.hobbies, ...upd.newHobbies.map((x) => String(x).trim()).filter((x) => x.length >= 2 && x.length <= 40)])].slice(0, 14);
      }
      if (Array.isArray(upd.newFacts)) {
        next.facts = [...new Set([...next.facts, ...upd.newFacts.map((x) => String(x).trim()).filter((x) => x.length >= 4 && x.length <= 90)])].slice(0, 14);
      }
      if (Array.isArray(upd.scoredTopics)) {
        const map = new Map(next.topicScores.map((t) => [String(t.topic).toLowerCase(), t]));
        const today = new Date().toISOString().slice(0, 10);
        for (const st of upd.scoredTopics) {
          const name = String(st?.topic || '').trim();
          if (!name || name.length > 48) continue;
          const prev = map.get(name.toLowerCase());
          const eng = Math.max(1, Math.min(10, Math.round(Number(st.engagement || 7))));
          const flu = Math.max(1, Math.min(10, Math.round(Number(st.fluency || 7))));
          map.set(name.toLowerCase(), {
            topic: prev?.topic || name,
            engagement: prev ? Math.round((prev.engagement + eng) / 2) : eng,
            fluency: prev ? Math.round((prev.fluency + flu) / 2) : flu,
            count: (prev?.count || 0) + 1,
            lastUsedAt: today
          });
        }
        next.topicScores = Array.from(map.values()).slice(0, 16);
      }
      if (upd.cognitiveMap && typeof upd.cognitiveMap === 'object') {
        const cm = upd.cognitiveMap;
        next.cognitiveMap = {
          thinkingStyle: String(cm.thinkingStyle || next.cognitiveMap.thinkingStyle).trim().slice(0, 80),
          explanationPreference: String(cm.explanationPreference || next.cognitiveMap.explanationPreference).trim().slice(0, 110),
          tonePreference: String(cm.tonePreference || next.cognitiveMap.tonePreference).trim().slice(0, 80),
          summary: String(cm.summary || next.cognitiveMap.summary).trim().slice(0, 220)
        };
      }
      saveStudentMemorySync(next);
    } catch {
      // Best-effort background memory update
    } finally {
      memoryUpdateInFlight = false;
    }
  })();
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

STREAMING OUTPUT CONTRACT (FOLLOW EXACTLY):
1. First, write ONLY your spoken English teacher reply.
2. Put exact delimiter on its own line:
${COACH_JSON_DELIMITER}
3. Immediately after the delimiter, write ONE compact JSON object in English ONLY:
{
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

STREAMING OUTPUT CONTRACT (FOLLOW EXACTLY):
1. First, write ONLY your spoken English reply (no JSON, no --- yet).
2. Then put this EXACT delimiter on its own line:
${COACH_JSON_DELIMITER}
3. Immediately after ${COACH_JSON_DELIMITER}, write ONE compact valid JSON object in English ONLY:
{
  "coachPause": null,
  "grammarFixes": [] | [{"type":"Grammar"|"Phrasing"|"Word-Choice","said":"exact slip","better":"natural English correction","why":"1 concise explanation"}],
  "scratchpadPin": null | "Short 1-3 line plain-text helper template or question to add to the scratchpad (never the final answer!)",
  "microTipHu": null | "1 short analytical problem-solving or English communication tip"
}`;
}

async function resolveChatContext(body, { isFinish = false } = {}) {
  const {
    model = 'qwen3.5:9b',
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
    customInterviewId = null,
    customRoundId = null,
    personalityId = null,
    personalityTraits = null,
    messages = [],
    action = 'turn',
    topic = 'HR',
    day = null,
    continuousFlow,
    retryOf = null,
    doubleXpActive = false
  } = body;

  const isGuestSession = Boolean(guestMode && (mode === 'tutor' || mode === 'logic'));
  const activeCv = isGuestSession ? null : await getActiveCv();
  const useStaticAgentFile = !isGuestSession && (!activeCv || activeCv.id === 'cv-baseline-1');
  const firstName = isGuestSession
    ? 'Guest'
    : (String(activeCv?.profile?.candidateName || 'there').trim().split(/\s+/)[0] || 'there');

  const normalizedMsgs = (messages || []).map((m) =>
    m.role === 'user' ? { ...m, content: normalizeInterviewTranscript(m.content) } : m
  );

  let systemPrompt = '';
  let startPrompt = '';
  let chosenTutorAngle = '';
  let tutorTopicLabel = '';

  if (mode === 'logic') {
    const teacher = TUTOR_CATALOG.teachers.find((t) => t.id === tutorTeacherId) || TUTOR_CATALOG.teachers[0];
    const puzzle = resolveLogicPuzzleById(logicPuzzleId);
    if (isFinish) {
      return {
        model, mode, isGuestSession, firstName, normalizedMsgs, topic, agentFile, jdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel,
        systemPrompt: '', // built below with jsonContract
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
    const customTopicText = TUTOR_CATALOG.topics.some((tp) => tp.id === tutorTopic) ? '' : tutorTopic;

    if (isFinish) {
      return {
        model, mode, isGuestSession, firstName, normalizedMsgs, topic, agentFile, jdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel,
        tutorFinishMeta: { teacher, tutorLevel },
        systemPrompt: '',
        startPrompt
      };
    }
    if (isGuestSession) {
      chosenTutorAngle = customTopicText || (topicObj.id === 'fresh-rotate' ? TUTOR_ROTATION_ANGLES[Math.floor(Math.random() * TUTOR_ROTATION_ANGLES.length)] : topicObj.label);
      tutorTopicLabel = chosenTutorAngle || 'General English Conversation';
      systemPrompt = buildTutorSystemPrompt({
        teacher, topicObj, customTopic: customTopicText, tutorLevel, firstName: 'there', stackSummary: '',
        studentBrief: '\nGUEST PRACTICE MODE: Have a straightforward, friendly general English conversation. Do NOT assume any specific profession, hobby, or prior history. Do NOT save or reference any personal profile notes.',
        retryOf, action
      });
      startPrompt = `Greet the guest learner patiently and warmly as ${teacher.name} (helpful & unhurried, no fake hype!), smoothly start an approachable conversation about "${chosenTutorAngle}", and ask one welcoming open question! Output ${COACH_JSON_DELIMITER} with empty grammarFixes.`;
    } else {
      const stackSummary = (activeCv?.profile?.coreStack || []).slice(0, 5).join(', ');
      const mem = getStudentMemorySync();
      if (action === 'start' && messages.length === 0) {
        chosenTutorAngle = customTopicText || pickFreshTutorAngle(mem);
        if (!customTopicText) {
          mem.recentAngles = [chosenTutorAngle, ...(mem.recentAngles || []).filter((a) => a !== chosenTutorAngle)].slice(0, 8);
          saveStudentMemorySync(mem);
        }
      } else {
        chosenTutorAngle = customTopicText || mem.recentAngles?.[0] || topicObj.label;
      }
      tutorTopicLabel = chosenTutorAngle || topicObj.label;
      systemPrompt = buildTutorSystemPrompt({
        teacher, topicObj, customTopic: customTopicText, tutorLevel, firstName, stackSummary,
        studentBrief: buildStudentMemoryBrief(mem, chosenTutorAngle), retryOf, action
      });
      startPrompt = `Greet ${firstName} patiently and warmly as ${teacher.name} (helpful & unhurried, no fake hype!), smoothly open a conversation on this fresh angle: "${chosenTutorAngle}"${mem.hobbies?.length ? ' (feel free to weave a natural bridge without forcing past hobbies)' : ''}, and ask one engaging open question! Output ${COACH_JSON_DELIMITER} with empty grammarFixes.`;
    }
  } else {
    const isContinuous = continuousFlow !== undefined ? Boolean(continuousFlow) : topic === 'HR';
    const adaptedAgents = getAdaptedAgents(AGENT_META, activeCv);
    const meta = adaptedAgents.find((a) => a.id === path.basename(agentFile));
    const personality = pickPersonality(topic, personalityTraits || personalityId);
    const personalityBlock = `INTERVIEWER PERSONALITY (${personality.emoji} ${personality.label} — ${personality.mood}):\nEmbody this realistic human personality naturally without exaggerating or becoming extreme.\nBEHAVIORAL DIRECTIVE: ${personality.prompt}`;
    const rawAgentMd = useStaticAgentFile
      ? stripStaticOpenerSection(await fs.readFile(path.join(ROOT_DIR, 'agents', path.basename(agentFile)), 'utf8'))
      : '';
    const agentPrompt = useStaticAgentFile
      ? summarizeMdPrompt(rawAgentMd, isFinish ? 2200 : 1900)
      : buildDynamicAgentDirective({ meta, activeCv });
    const { jdPrompt, openerHint } = await resolveTargetContext({ jdFile, customInterviewId, customRoundId, day }, isFinish ? 1400 : 1300);
    const userTurns = normalizedMsgs.filter((m) => m.role === 'user').length;
    const pacing = buildInterviewPacingDirectives({
      action,
      topic,
      userTurns,
      firstName,
      avatarName: meta?.avatarName || 'the interviewer',
      personality,
      openerHint
    });

    if (!isFinish) {
      const activeProfilePrompt = activeCv?.profile?.profilePrompt || COMPACT_CANDIDATE_PROFILE;
      const ndaClause = 'unless the candidate makes a major interview red flag (badmouthing past teams or sharing confidential internal data)';
      const flowRule = isContinuous
        ? `CONTINUOUS DIALOGUE MODE: React authentically in your assigned personality to a detail ${firstName} said, bridge smoothly if changing topic, and ask ONE follow-up or next question in 2-4 crisp spoken English sentences. NEVER interrupt with coachPause ${ndaClause}. INSTEAD, whenever ${firstName} says ANY grammar error, non-native phrasing, or awkward B2 wording, put 1-2 immediate fixes in "grammarFixes"!`
        : `STRICT COACH MODE: If ${firstName} uses plain B2 phrasing, awkward non-native grammar, or shares confidential baselines, output a brief English pause line and populate coachPause with 2 Senior upgrades AND include specific fixes in "grammarFixes".`;

      systemPrompt = `${activeProfilePrompt}
Interviewer Persona: ${meta?.avatarName || 'Interviewer'} (${meta?.title || topic}).
${personalityBlock}
${pacing.pacingBlock}
${agentPrompt}
Target Role: ${jdPrompt}

LANGUAGE RULE (CRITICAL): English ONLY everywhere.
STT TOLERANCE RULE: Fix ASR typos silently — ONLY critique real English grammar/phrasing mistakes!

STREAMING OUTPUT CONTRACT (FOLLOW EXACTLY):
1. First, begin IMMEDIATELY with a short 3-7 word proportionally attuned reaction, followed by 1-3 crisp conversational sentences (include a gentle 1-sentence transition bridge whenever introducing a new angle or CV detail; NO markdown, NO emojis, NO bullet points, NO JSON yet).
2. After the spoken English reply, put exact delimiter on its own line:
${COACH_JSON_DELIMITER}
3. Immediately after the delimiter, write ONE compact JSON object in English ONLY:
{
  "coachPause": null | {"category":"B2-to-Senior"|"Grammar"|"Non-Native"|"Anti-Freeze"|"NDA-Safety","original":"phrase","reasonHu":"short English explanation","seniorUpgrades":["upgrade 1","upgrade 2"]},
  "grammarFixes": [] | [{"type":"Grammar"|"Phrasing"|"Non-Native"|"Senior-Tone","said":"exact weak or ungrammatical phrase candidate said","better":"natural C1 Senior phrasing fix","why":"1 concise sentence explaining the fix"}],
  "microTipHu": null | "1 short vocabulary/delivery tip"
}
On EVERY "turn" (not "start"): include 1-2 "grammarFixes" whenever anything grammatical or phrasing-wise can be improved! On "start", set "grammarFixes": [].
${flowRule}${action === 'turn' && retryOf?.better ? `\n\nRETRY PRACTICE NOTE: ${firstName} clicked "Say It Again" to practice improving "${String(retryOf.said || '').slice(0, 180)}" -> "${String(retryOf.better).slice(0, 240)}". Briefly acknowledge cleanly, then ask your next follow-up.` : ''}`;

      startPrompt = `${pacing.startPrompt}\nThen output ${COACH_JSON_DELIMITER} with empty grammarFixes and null coachPause.`;
    } else {
      const coreRules = !useStaticAgentFile
        ? `${activeCv?.profile?.profilePrompt || ''}\n\nFULL CV:\n${summarizeMdPrompt(activeCv?.rawText || '', 3000)}`
        : await fs.readFile(path.join(ROOT_DIR, '00-candidate-profile-and-core-rules.md'), 'utf8');
      return {
        model, mode, isGuestSession, firstName, normalizedMsgs, topic, agentFile, jdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel,
        interviewFinishMeta: { coreRules, personalityBlock, agentPrompt, jdPrompt, activeCv, meta, isContinuous },
        systemPrompt: '',
        startPrompt
      };
    }
  }

  return { model, mode, isGuestSession, firstName, normalizedMsgs, topic, agentFile, jdFile, day, doubleXpActive, retryOf, chosenTutorAngle, tutorTopicLabel, systemPrompt, startPrompt, action };
}

export async function handleChatStream(body, res) {
  const ctx = await resolveChatContext(body, { isFinish: false });
  const chatMessages = [{ role: 'system', content: ctx.systemPrompt }, ...ctx.normalizedMsgs];
  if (ctx.action === 'start' && ctx.normalizedMsgs.length === 0) {
    chatMessages.push({ role: 'user', content: ctx.startPrompt });
  }

  const ollamaRes = await fetchOllamaChat({
    model: ctx.model,
    messages: chatMessages,
    stream: true,
    options: { temperature: 0.45, num_predict: 380 }
  });

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.flushHeaders?.();

  let rawAll = '';
  let streamedSpokenLen = 0;
  let inThinking = false;
  let delimReached = false;

  await consumeNdjsonBody(ollamaRes.body, (obj) => {
    if (obj.message?.thinking) res.write(JSON.stringify({ type: 'thinking' }) + '\n');
    const delta = obj.message?.content || '';
    if (!delta) return;

    rawAll += delta;
    if (/<think>/i.test(rawAll) && !/<\/think>/i.test(rawAll)) {
      if (!inThinking) {
        inThinking = true;
        res.write(JSON.stringify({ type: 'thinking' }) + '\n');
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
      const tailHold = spokenPart.match(/(?:\s---+\s*\{?|\s```(?:json)?\s*\{?|\s\{\s*"coach|\s---?)$/);
      if (tailHold && tailHold.index !== undefined && tailHold.index < safeEnd) safeEnd = tailHold.index;
    }
    if (delimIdx !== -1) delimReached = true;

    if (safeEnd > streamedSpokenLen) {
      const nextDelta = spokenPart.slice(streamedSpokenLen, safeEnd);
      streamedSpokenLen = safeEnd;
      res.write(JSON.stringify({ type: 'token', delta: nextDelta, spokenSoFar: spokenPart.slice(0, safeEnd).trimStart() }) + '\n');
    }
  });

  const cleanFinal = stripThinkBlocks(rawAll).trim();
  const { idx: delimIdx, markerLen } = findCoachMarker(cleanFinal);
  const spokenEnglish = (delimIdx !== -1 ? cleanFinal.slice(0, delimIdx) : cleanFinal)
    .replace(/\*\*/g, '')
    .replace(/\s+\*\s+/g, ' ')
    .replace(/\s+---+\s*$/, '')
    .trim() || "That makes a lot of sense. Could you tell me a bit more about that?";

  const metaJson = delimIdx !== -1 ? extractCoachMeta(extractJsonSafe(cleanFinal.slice(delimIdx + markerLen).trim())) : { coachPause: null, microTipHu: null, grammarFixes: [], scratchpadPin: null };
  const reply = { spokenEnglish, coachPause: metaJson.coachPause, microTipHu: metaJson.microTipHu, grammarFixes: metaJson.grammarFixes, scratchpadPin: metaJson.scratchpadPin || null, scorecard: null };

  const { xpEarned, state } = ctx.isGuestSession
    ? { xpEarned: 0, state: await ensureState() }
    : await persistChatSideEffects(reply, {
        model: ctx.model, action: ctx.action, topic: ctx.topic, agentFile: ctx.agentFile, jdFile: ctx.jdFile, day: ctx.day,
        isRetryPractice: Boolean(ctx.retryOf?.better), doubleXpActive: Boolean(ctx.doubleXpActive)
      });

  res.write(JSON.stringify({ type: 'done', reply, xpEarned, state, tutorAngle: ctx.chosenTutorAngle || null }) + '\n');
  res.end();

  if (ctx.mode === 'tutor' && !ctx.isGuestSession && ctx.action === 'turn' && ctx.normalizedMsgs.length >= 2) {
    scheduleStudentMemoryUpdate({
      model: ctx.model,
      messages: [...ctx.normalizedMsgs, { role: 'assistant', content: spokenEnglish }],
      topicLabel: ctx.tutorTopicLabel
    });
  }
}

export async function handleChat(body) {
  const ctx = await resolveChatContext(body, { isFinish: true });
  const isContinuous = ctx.interviewFinishMeta?.isContinuous ?? true;
  const flowRules = isContinuous
    ? `- CONVERSATION MODE: CONTINUOUS NATURAL DIALOGUE. Put refinements in "microTipHu".`
    : `- CONVERSATION MODE: STRICT COACH PAUSE. Trigger coachPause if phrasing is weak.`;

  const jsonContract = `
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
    "verdict": "NO HIRE" | "LEAN HIRE" | "STRONG HIRE (TOP 5%)",
    "strengthsHu": ["Concrete strength 1 in English", "Concrete strength 2 in English"],
    "weaknessesHu": ["Concrete improvement 1 in English", "Concrete improvement 2 in English"],
    "goldenSentences": ["Senior English golden sentence 1", "Golden sentence 2", "Golden sentence 3"]
  }
}
${flowRules}`;

  let systemPrompt = '';
  let finishPrompt = 'The 10-minute interview is over. Say a realistic English goodbye in "spokenEnglish" and return the strict English Top 5% "scorecard" JSON object now.';
  if (ctx.logicFinishMeta) {
    const { teacher, puzzle, scratchpadText } = ctx.logicFinishMeta;
    systemPrompt = `You are ${teacher.name}, wrapping up a collaborative ${puzzle?.durationMinutes || 10}-minute analytical logic puzzle ("${puzzle?.title || 'Logic Puzzle'}") with ${ctx.firstName}.
Active scratchpad notes: """${String(scratchpadText || '').slice(0, 1500)}"""
Reference key solution: ${puzzle?.solutionGuide || ''}
Set "verdict" to "SHARP REASONING", "SOLID STRUCTURE", or "KEEP PRACTICING", give 2 concrete strengths in "strengthsHu", 2 improvements in "weaknessesHu", and 3 English problem-solving phrases in "goldenSentences".\n\n${jsonContract}`;
    finishPrompt = 'The logic puzzle practice call is wrapping up! Summarize what worked well on the scratchpad and reasoning in "spokenEnglish" (concise grounded English), and return ONLY valid JSON with an honest analytical "scorecard" object.';
  } else if (ctx.tutorFinishMeta) {
    const { teacher, tutorLevel } = ctx.tutorFinishMeta;
    systemPrompt = `You are ${teacher.name}, a warm female English teacher wrapping up a lesson with ${ctx.firstName} (Target level: ${tutorLevel}). Evaluate English clarity, grammar progress, natural phrasing, and confidence in English ONLY. Set "verdict" to "EXCELLENT PROGRESS" or "GREAT FLUENCY", give 2 strengths in "strengthsHu", 2 grammar rules in "weaknessesHu", and 3 sentences in "goldenSentences".\n\n${jsonContract}`;
    finishPrompt = 'The English lesson is wrapping up! Return a warm teacher goodbye in "spokenEnglish" and return ONLY valid JSON matching the exact schema with an encouraging "scorecard" object.';
  } else {
    const m = ctx.interviewFinishMeta;
    systemPrompt = `${m.coreRules}\n\n${m.personalityBlock}\n\n=== ACTIVE INTERVIEWER AGENT ===\n${m.agentPrompt}\n\n=== TARGET JOB DESCRIPTION ===\n${m.jdPrompt}\n\n${jsonContract}`;
  }

  const chatMessages = [{ role: 'system', content: systemPrompt }, ...ctx.normalizedMsgs, { role: 'user', content: finishPrompt }];
  const ollamaRes = await fetchOllamaChat({
    model: ctx.model,
    messages: chatMessages,
    stream: false,
    format: 'json',
    options: { temperature: 0.45 }
  });
  const ollamaData = await ollamaRes.json();
  const parsed = extractJsonSafe(ollamaData?.message?.content || '');

  const { xpEarned, state } = ctx.isGuestSession
    ? { xpEarned: 0, state: await ensureState() }
    : await persistChatSideEffects(parsed, {
        model: ctx.model, action: body.action || 'finish', topic: ctx.topic, agentFile: ctx.agentFile, jdFile: ctx.jdFile, day: ctx.day, doubleXpActive: Boolean(ctx.doubleXpActive)
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
