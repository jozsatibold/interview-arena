/**
 * Logic Puzzle Session & AI Puzzle Generation Helpers
 * Extracted from server/chat-service.mjs to preserve clean module boundaries.
 */

import crypto from 'node:crypto';
import { FIXED_LOGIC_PERSONALITY } from '../personalities.mjs';
import { LOGIC_PACING_RULE } from './pacing.mjs';
import {
  LOGIC_DIFFICULTIES,
  LOGIC_CATEGORIES,
  CURATED_LOGIC_PUZZLES,
  sanitizeLogicPuzzleForClient,
  getPublicLogicPuzzles,
  findLogicPuzzle
} from '../logic-puzzles.mjs';
import { getSavedLogicPuzzlesSync, saveCustomLogicPuzzleSync } from './db.mjs';
import { COACH_JSON_DELIMITER, fetchOllamaChat, parseJsonObjectStrict } from './ollama.mjs';

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

export function buildLogicSystemPrompt({ teacher, puzzle, firstName = 'there', scratchpadText = '', scratchpadChanged = false, remainingSeconds = null, studentBrief = '', guestMode = false, boardCheckOnly = false }) {
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
