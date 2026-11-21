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
import {
  PERSONALITY_DIMENSIONS,
  FIXED_TUTOR_PERSONALITY,
  FIXED_LOGIC_PERSONALITY,
  rollInterviewPersonality,
  cyclePersonalityTrait,
  pickPersonality
} from '../personalities.mjs';
import {
  stripStaticOpenerSection,
  buildInterviewPacingDirectives
} from '../server/pacing.mjs';
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
  assert.equal(PERSONALITY_DIMENSIONS.length, 10);
  for (const dim of PERSONALITY_DIMENSIONS) {
    assert.ok(dim.options.length >= 4 && dim.options.length <= 5, `${dim.key} should have 4-5 moderate options`);
  }

  const mood = pickPersonality('HR');
  assert.ok(mood?.id && mood?.label && mood?.prompt);
  assert.equal(Object.keys(mood.traits || {}).length, 10);

  const rolled = rollInterviewPersonality('Technical');
  const cycled = cyclePersonalityTrait(rolled, 'patience');
  assert.notEqual(cycled.traits.patience, rolled.traits.patience);

  assert.equal(FIXED_TUTOR_PERSONALITY.mode, 'tutor');
  assert.equal(FIXED_TUTOR_PERSONALITY.traits.patience, 'very-patient');
  assert.equal(FIXED_LOGIC_PERSONALITY.mode, 'logic');
  assert.equal(FIXED_LOGIC_PERSONALITY.traits.patience, 'balanced-pace');

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

test('interview pacing enforces warm-up, smooth agenda intro, bridged exploration, and opener stripping', () => {
  const cleaned = stripStaticOpenerSection('# Agent 01\nMain rules\n\n## 4. How to Start Immediately\n> Jump right in!');
  assert.equal(cleaned.includes('How to Start Immediately'), false);
  assert.ok(cleaned.includes('Main rules'));

  const p0 = buildInterviewPacingDirectives({ action: 'start', topic: 'HR', userTurns: 0, firstName: 'Alex' });
  assert.equal(p0.phase, 'warmup');
  assert.ok(/Do NOT ask a CV-specific/i.test(p0.startPrompt));

  const p1 = buildInterviewPacingDirectives({ action: 'turn', topic: 'HR', userTurns: 1, firstName: 'Alex', openerHint: 'Day 2 CV gap' });
  assert.equal(p1.phase, 'intro');
  assert.ok(/Do NOT jump abruptly from "How are you\?"/i.test(p1.pacingBlock));

  const p2 = buildInterviewPacingDirectives({ action: 'turn', topic: 'HR', userTurns: 2, firstName: 'Alex', openerHint: 'Day 2 CV gap' });
  assert.equal(p2.phase, 'explore');
  assert.ok(/BRIDGE smoothly/i.test(p2.pacingBlock));

  const p4 = buildInterviewPacingDirectives({ action: 'turn', topic: 'HR', userTurns: 4, firstName: 'Alex' });
  assert.equal(p4.phase, 'closing');
  assert.ok(/practical alignment/i.test(p4.pacingBlock));
});
