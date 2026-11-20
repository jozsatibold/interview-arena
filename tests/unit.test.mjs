import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeInterviewTranscript } from '../shared/transcript.mjs';
import {
  CURATED_LOGIC_PUZZLES,
  getPublicLogicPuzzles,
  findLogicPuzzle
} from '../logic-puzzles.mjs';
import {
  stripThinkBlocks,
  extractJsonSafe,
  findCoachMarker,
  pickRecommendedPlannerModels,
  pickVisionModels
} from '../server/ollama.mjs';
import { pickPersonality } from '../personalities.mjs';
import { detectRoleArchetype, getAdaptedAgents } from '../role-adapter.mjs';
import { AGENT_META } from '../server/config.mjs';

test('shared transcript normalizer cleans ASR tech terms cleanly', () => {
  assert.equal(normalizeInterviewTranscript('We built micro front end with rx js and ng rx'), 'We built micro-frontend with RxJS and NgRx');
  assert.equal(normalizeInterviewTranscript('We used play right and next js'), 'We used Playwright and Next.js');
  assert.equal(normalizeInterviewTranscript('   '), '');
});

test('logic puzzles catalog covers 5m/10m/15m and never leaks solutionGuide to client', () => {
  assert.ok(CURATED_LOGIC_PUZZLES.length >= 12);
  const publicList = getPublicLogicPuzzles();
  assert.equal(publicList.length, CURATED_LOGIC_PUZZLES.length);
  for (const item of publicList) {
    assert.equal('solutionGuide' in item, false, `solutionGuide leaked on ${item.id}`);
    assert.equal('hints' in item, false, `hints array should stay server-side on ${item.id}`);
    assert.ok(item.scratchpadTemplate.length > 10, `Missing scratchpadTemplate on ${item.id}`);
  }
  const switches = findLogicPuzzle('lp-3-switches');
  assert.equal(switches.durationMinutes, 5);
  assert.ok(switches.solutionGuide.length > 20);
});

test('ollama response parser strips <think>, handles strict & fallback --- delimiters, and extracts JSON', () => {
  assert.equal(stripThinkBlocks('<think>internal reasoning</think>Hello there!'), 'Hello there!');

  const strict = 'Great point.\n---COACH_JSON---\n{"coachPause":null,"grammarFixes":[]}';
  const mStrict = findCoachMarker(strict);
  assert.notEqual(mStrict.idx, -1);
  assert.deepEqual(extractJsonSafe(strict.slice(mStrict.idx + mStrict.markerLen)), { coachPause: null, grammarFixes: [] });

  const sloppy = 'You got it! --- { "coachPause": null, "grammarFixes": [], "microTipHu": "Nice clarity." }';
  const mSloppy = findCoachMarker(sloppy);
  assert.notEqual(mSloppy.idx, -1);
  const parsed = extractJsonSafe(sloppy.slice(mSloppy.idx + mSloppy.markerLen));
  assert.equal(parsed.microTipHu, 'Nice clarity.');
});

test('model rankers prioritize planner and vision models properly', () => {
  const models = [
    { name: 'nomic-embed-text:latest' },
    { name: 'qwen3-vl:8b' },
    { name: 'llama3.1:8b' },
    { name: 'qwen3.6:35b-a3b-q8_0' }
  ];
  const planners = pickRecommendedPlannerModels(models);
  assert.equal(planners[0].name, 'qwen3.6:35b-a3b-q8_0');
  assert.equal(planners.some((m) => /embed/.test(m.name)), false);

  const visions = pickVisionModels(models);
  assert.equal(visions[0].name, 'qwen3-vl:8b');
});

test('personalities and role-adapter return valid domain configs for uploaded CVs', () => {
  const mood = pickPersonality('HR');
  assert.ok(mood?.id && mood?.label && mood?.prompt);

  const arch = detectRoleArchetype('Senior Java Spring Boot Microservices Engineer with Kafka and PostgreSQL', {
    headline: 'Senior Java Engineer',
    coreStack: ['Java', 'Spring Boot', 'Kafka']
  });
  assert.ok(arch);
  const adapted = getAdaptedAgents(AGENT_META, {
    id: 'cv-custom-1',
    profile: { headline: 'Senior Java Engineer', coreStack: ['Java', 'Spring Boot'] },
    agentOverrides: {}
  });
  assert.equal(adapted.length, AGENT_META.length);
});
