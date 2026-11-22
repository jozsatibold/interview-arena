// Background English Tutor cognitive map & student memory tracking module.

import { FIXED_TUTOR_PERSONALITY } from '../personalities.mjs';
import { TUTOR_PACING_RULE } from './pacing.mjs';
import { TUTOR_ROTATION_ANGLES } from './config.mjs';
import { getStudentMemorySync, saveStudentMemorySync, getMemoryResetGeneration } from './db.mjs';
import { COACH_JSON_DELIMITER, fetchOllamaChat, parseJsonObjectStrict } from './ollama.mjs';

let memoryUpdateInFlight = false;

export function pickFreshTutorAngle(mem) {
  const recent = new Set((mem.recentAngles || []).map((a) => String(a).toLowerCase()));
  const pool = TUTOR_ROTATION_ANGLES.filter((a) => !recent.has(a.toLowerCase()));
  const list = pool.length ? pool : TUTOR_ROTATION_ANGLES;
  return list[Math.floor(Math.random() * list.length)];
}

export function buildStudentMemoryBrief(mem, freshAngle = '') {
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
      .sort((a, b) => Number(b.engagement || 0) - Number(a.engagement || 0))
      .slice(0, 6)
      .map((t) => `${t.topic} (interest:${t.engagement}/10, fluency:${t.fluency}/10)`);
    parts.push(`Topic History: ${topScores.join(' | ')}`);
  }
  if (freshAngle) parts.push(`TODAY'S FRESH TOPIC ROTATION (must keep conversation diverse and interesting, touch adjacent subjects beyond past topics): ${freshAngle}`);
  return parts.length ? `\nSTUDENT LEARNING & THINKING MAP (subtle guidance — never recite mechanically):\n${parts.join('\n')}` : '';
}

export function scheduleStudentMemoryUpdate({ model, messages, topicLabel }) {
  if (memoryUpdateInFlight || !Array.isArray(messages) || messages.length < 2) return;
  const recentTurns = messages.slice(-6).map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
  const startGen = getMemoryResetGeneration();
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
      const upd = parseJsonObjectStrict(data?.message?.content || '');
      if (!upd || getMemoryResetGeneration() !== startGen) return;

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
          const rawEng = Number(st.engagement);
          const rawFlu = Number(st.fluency);
          const eng = Math.max(1, Math.min(10, Math.round(Number.isFinite(rawEng) ? rawEng : 7)));
          const flu = Math.max(1, Math.min(10, Math.round(Number.isFinite(rawFlu) ? rawFlu : 7)));
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
      if (upd.cognitiveMap && typeof upd.cognitiveMap === 'object' && !Array.isArray(upd.cognitiveMap)) {
        const cm = upd.cognitiveMap;
        next.cognitiveMap = {
          thinkingStyle: String(cm.thinkingStyle || next.cognitiveMap.thinkingStyle).trim().slice(0, 80),
          explanationPreference: String(cm.explanationPreference || next.cognitiveMap.explanationPreference).trim().slice(0, 110),
          tonePreference: String(cm.tonePreference || next.cognitiveMap.tonePreference).trim().slice(0, 80),
          summary: String(cm.summary || next.cognitiveMap.summary).trim().slice(0, 220)
        };
      }
      if (getMemoryResetGeneration() === startGen) saveStudentMemorySync(next);
    } catch {
      // Best-effort background memory update
    } finally {
      memoryUpdateInFlight = false;
    }
  })();
}

export function buildTutorSystemPrompt({ teacher, topicObj, customTopic = '', tutorLevel = 'B2-C1', firstName = 'there', stackSummary = '', studentBrief = '', retryOf = null, action = 'turn' }) {
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
