import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeInterviewTranscript } from '../shared/transcript.mjs';
import { buildVisemeTimeline, sampleVisemeTimeline } from '../shared/viseme.mjs';
import { pickRandomCompanyName, companyAppearsInText } from '../shared/company.mjs';
import {
  CURATED_LOGIC_PUZZLES,
  getPublicLogicPuzzles,
  findLogicPuzzle
} from '../logic-puzzles.mjs';
import {
  stripThinkBlocks,
  extractJsonSafe,
  parseJsonObjectStrict,
  findCoachMarker,
  pickRecommendedPlannerModels,
  pickVisionModels
} from '../server/ollama.mjs';
import { extractCoachMeta } from '../server/chat-service.mjs';
import { createAvatarMotionState, reportUserMicLevel, inferEarlyExpression } from '../app/modules/avatar-motion.js';
import { computeCallSpeechMetrics } from '../shared/speech-metrics.mjs';
import { isScreenShareAllowedTopic, getArtifactsForTopic, findArtifactById } from '../shared/interview-artifacts.mjs';
import { buildTurnContextAddendum } from '../server/pacing.mjs';
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
  buildInterviewPacingDirectives,
  trimConversationForTier,
  buildInterviewPrompt,
  getTopicScopeContract
} from '../server/pacing.mjs';
import {
  detectModelParamBillions,
  resolveEffectiveContextTier
} from '../shared/model-tiers.mjs';
import { rollDetailedDna, getExpressionTargets } from '../app/modules/avatar-detailed.js';
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
  assert.equal(PERSONALITY_DIMENSIONS.length, 11);
  for (const dim of PERSONALITY_DIMENSIONS) {
    assert.ok(dim.options.length >= 4 && dim.options.length <= 5, `${dim.key} should have 4-5 moderate options`);
  }

  const mood = pickPersonality('HR');
  assert.ok(mood?.id && mood?.label && mood?.prompt);
  assert.equal(Object.keys(mood.traits || {}).length, 11);
  assert.ok(mood.traits.humor);

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
  assert.equal(p4.phase, 'explore');
  const p7 = buildInterviewPacingDirectives({ action: 'turn', topic: 'HR', userTurns: 7, firstName: 'Alex' });
  assert.equal(p7.phase, 'reverse_qa');
  assert.ok(/questions do you have for me/i.test(p7.pacingBlock));

  const pTimed = buildInterviewPacingDirectives({ action: 'turn', topic: 'Technical', userTurns: 3, elapsedSeconds: 600, targetDurationSeconds: 720, firstName: 'Alex' });
  assert.equal(pTimed.phase, 'reverse_qa');

  const p8 = buildInterviewPacingDirectives({ action: 'turn', topic: 'HR', userTurns: 8, firstName: 'Alex' });
  assert.equal(p8.phase, 'closing');
  assert.ok(/practical details|wrapping up/i.test(p8.pacingBlock));
});

test('LLM size scraper and context tier optimizer classify Small/Medium/Large and trim history', () => {
  assert.equal(detectModelParamBillions({ name: 'qwen3.5:4b' }).tier, 'small');
  assert.equal(detectModelParamBillions({ name: 'hf.co/LiquidAI/LFM2.5-2.6B-GGUF' }).tier, 'small');
  assert.equal(detectModelParamBillions({ name: 'gemma4:e4b' }).tier, 'small');
  assert.equal(detectModelParamBillions({ name: 'qwen3.5:9b' }).tier, 'medium');
  assert.equal(detectModelParamBillions({ name: 'qwen3.6:35b-a3b-q8_0' }).tier, 'medium');
  assert.equal(detectModelParamBillions({ name: 'llama3.3:70b' }).tier, 'large');
  assert.equal(detectModelParamBillions({ name: 'custom-model', parameterSize: '4.0B' }).source, 'metadata');
  assert.equal(detectModelParamBillions({ name: 'custom-model', sizeBytes: 4e9 }).tier, 'small');

  const autoSmall = resolveEffectiveContextTier({ preference: 'auto', modelName: 'qwen3.5:4b' });
  assert.equal(autoSmall.mode, 'auto');
  assert.equal(autoSmall.tier, 'small');
  assert.equal(autoSmall.budgets.compactPrompt, true);
  assert.equal(autoSmall.budgets.maxHistoryMsgs, 6);

  const manualLarge = resolveEffectiveContextTier({ preference: 'large', modelName: 'qwen3.5:4b' });
  assert.equal(manualLarge.mode, 'manual');
  assert.equal(manualLarge.tier, 'large');
  assert.equal(manualLarge.budgets.numCtx, 16384);

  const msgs = Array.from({ length: 10 }, (_, idx) => ({ role: idx % 2 === 0 ? 'assistant' : 'user', content: `Turn ${idx}` }));
  const trimmed = trimConversationForTier(msgs, 6);
  assert.equal(trimmed.recentMessages.length, 6);
  assert.ok(trimmed.earlierSummary.includes('Turn 0'));
});

test('detailed avatar DNA generates bounded anatomy traits cleanly for male and female personas', () => {
  const fDna = rollDetailedDna({}, null, 'female');
  assert.equal(fDna.facialHair, 'none');
  assert.ok(fDna.faceWidthScale >= 0.94 && fDna.faceWidthScale <= 1.06);
  assert.ok(fDna.browHeight >= -3 && fDna.browHeight <= 3);

  const mDna = rollDetailedDna({}, null, 'male');
  assert.equal(mDna.earrings, false);
  assert.ok(['none', 'stubble', 'trimmed-beard'].includes(mDna.facialHair));
});

test('hybrid lip-sync timeline models bilabial closures and distinct vowel visemes', () => {
  const frames = buildVisemeTimeline('Boom, see?');
  assert.ok(frames.length >= 6);
  // 'b' bilabial seal, 'oo' round vowel, 'm' bilabial seal, ',' rest, 'ee' wide vowel, '?' rest
  assert.equal(frames[0].close, true);
  assert.equal(frames[0].open, 0);
  assert.ok(frames[1].round > 0.8);
  assert.equal(frames[2].close, true);
  assert.ok(frames.some((f) => f.width > 0.8));
  assert.equal(frames[frames.length - 1].end, 1);

  const sampledRound = sampleVisemeTimeline(frames, frames[1].start + 0.01);
  assert.ok(sampledRound.round > 0.7);
});

test('random company picker avoids CV employers and anchors interviewer identity before CV in compact prompts', () => {
  const cvText = 'Senior Frontend Engineer at OptiMonk and Northbridge Pay with TypeScript experience.';
  for (let i = 0; i < 20; i++) {
    const company = pickRandomCompanyName(cvText);
    assert.equal(companyAppearsInText(company, cvText), false);
    assert.ok(!/optimonk/i.test(company));
  }

  const pacing = buildInterviewPacingDirectives({
    action: 'start',
    topic: 'HR',
    userTurns: 0,
    firstName: 'Jozsa',
    avatarName: 'Maya',
    companyName: 'Kestrel Cloud',
    compactMode: true
  });
  assert.ok(pacing.startPrompt.includes('Maya from Kestrel Cloud'));

  const built = buildInterviewPrompt({
    compactPrompt: true,
    activeProfilePrompt: 'Candidate worked at OptiMonk.',
    meta: { avatarName: 'Maya', title: 'Internal Talent Partner' },
    companyName: 'Kestrel Cloud',
    topic: 'HR',
    firstName: 'Jozsa',
    pacing
  });
  const idIdx = built.systemPrompt.indexOf('YOU ARE: Maya from Kestrel Cloud');
  const cvIdx = built.systemPrompt.indexOf('Candidate worked at OptiMonk.');
  assert.ok(idIdx >= 0 && cvIdx > idIdx);

  const hrScope = getTopicScopeContract('HR');
  assert.match(hrScope.forbidden, /NEVER run technical deep-dives/i);
  assert.match(built.systemPrompt, /AUTHORITY & DEFLECTION RULE \(HR\)/);
  assert.match(built.systemPrompt, /NEVER run technical deep-dives/i);

  const hrExplore = buildInterviewPacingDirectives({
    action: 'turn',
    topic: 'HR',
    userTurns: 2,
    firstName: 'Jozsa',
    avatarName: 'Maya',
    companyName: 'Kestrel Cloud',
    compactMode: true
  });
  assert.ok(!/trickiest constraint/i.test(hrExplore.pacingBlock));
  assert.match(hrExplore.pacingBlock, /STAY STRICTLY IN HR SCOPE/);
  assert.match(built.systemPrompt, /"expression":"warm"\|"curious"\|"firm"\|"amused"\|"skeptical"/);

  const curious = getExpressionTargets('curious');
  assert.ok(curious.browRaiseL < curious.browRaiseR);
  const skeptical = getExpressionTargets('skeptical');
  assert.ok(skeptical.smileBias < 0 && skeptical.browRaiseL > skeptical.browRaiseR);
  assert.deepEqual(getExpressionTargets('nonexistent'), getExpressionTargets('warm'));
});

test('extractCoachMeta & findCoachMarker parse delimited and delimiter-less coach JSON cleanly', () => {
  const delimited = 'Great point!\n---COACH_JSON---\n{"expression":"curious","coachPause":false,"grammarFixes":[],"microTipHu":"Jó"}';
  const delim = findCoachMarker(delimited);
  assert.ok(delim.idx > 0);
  const parsedDelim = extractCoachMeta(extractJsonSafe(delimited.slice(delim.idx + delim.markerLen)));
  assert.equal(parsedDelim.expression, 'curious');

  const rawMarker = 'That makes sense. {"expression":"amused","coachPause":false,"grammarFixes":[],"microTipHu":"Ok"}';
  const raw = findCoachMarker(rawMarker);
  assert.ok(raw.idx > 0);
  const parsedRaw = extractCoachMeta(extractJsonSafe(rawMarker.slice(raw.idx + raw.markerLen)));
  assert.equal(rawMarker.slice(0, raw.idx).trim(), 'That makes sense.');
  assert.equal(parsedRaw.expression, 'amused');
});

test('parseJsonObjectStrict extracts balanced JSON objects and rejects arrays or invalid text', () => {
  const obj = parseJsonObjectStrict('Here is your result:\n{"score": 9, "nested": {"ok": true}}\nThanks!');
  assert.deepEqual(obj, { score: 9, nested: { ok: true } });
  assert.equal(parseJsonObjectStrict('[1, 2, 3]'), null);
  assert.equal(parseJsonObjectStrict('not json'), null);
});

test('normalizeInterviewTranscript only rewrites interview-specific terms in interview mode', () => {
  const txt = 'I worked with front and and next js using type script and exhaust map.';
  const interviewNormalized = normalizeInterviewTranscript(txt, { mode: 'interview' });
  assert.ok(interviewNormalized.includes('frontend'));
  assert.ok(interviewNormalized.includes('Next.js'));
  assert.ok(interviewNormalized.includes('TypeScript'));
  assert.ok(interviewNormalized.includes('exhaustMap'));

  const tutorRaw = normalizeInterviewTranscript('Let us talk about front and and next js.', { mode: 'tutor' });
  assert.equal(tutorRaw, 'Let us talk about front and and next js.');
});

test('personality dimensions & cyclePersonalityTrait respect HR focusLens exclusions', () => {
  assert.ok(PERSONALITY_DIMENSIONS.length >= 10);
  const cycled = cyclePersonalityTrait({ warmth: 'warm', focusLens: 'ownership' }, 'focusLens', 'HR');
  assert.ok(cycled && cycled.traits.focusLens);
  assert.notEqual(cycled.traits.focusLens, 'architecture-drill');
});

test('avatar motion engine produces smooth posture lean, listening nod, and early expression cues', () => {
  assert.equal(inferEarlyExpression('Haha, I love that example!', 'warm'), 'amused');
  assert.equal(inferEarlyExpression('Wait, are you sure that scaled?', 'warm'), 'skeptical');
  assert.equal(inferEarlyExpression('Why did you pick that architecture?', 'warm'), 'curious');

  const stepMotion = createAvatarMotionState();
  reportUserMicLevel(0.4);
  const frame = stepMotion({
    now: performance.now() + 120,
    dt: 0.016,
    mode: 'listening',
    expression: 'curious',
    targetViseme: { open: 0, width: 0, round: 0 }
  });
  assert.ok(frame.leanScale > 1.0);
  assert.ok(Number.isFinite(frame.nodY));
});

test('computeCallSpeechMetrics computes WPM, fillers, talk ratio, and typed fallback cleanly', () => {
  const voiceMetrics = computeCallSpeechMetrics({
    messages: [
      { role: 'assistant', content: 'Tell me about your recent project.' },
      { role: 'user', content: 'Um like basically we migrated twenty components to React and actually improved LCP by forty percent over two quarters.' }
    ],
    userSpeakMs: 8000,
    aiSpeakMs: 4000,
    turnDurationsMs: [8000]
  });
  assert.equal(voiceMetrics.userWords, 19);
  assert.equal(voiceMetrics.wpm, 143);
  assert.equal(voiceMetrics.fillerCount, 4);
  assert.equal(voiceMetrics.userTalkPct, 67);
  assert.equal(voiceMetrics.aiTalkPct, 33);
  assert.equal(voiceMetrics.avgTurnSec, 8);

  const typed = computeCallSpeechMetrics({
    messages: [{ role: 'assistant', content: 'Hello there.' }, { role: 'user', content: 'Hi I am ready to discuss architecture.' }],
    userSpeakMs: 0,
    aiSpeakMs: 0
  });
  assert.equal(typed.wpm, null);
  assert.equal(typed.wpmBand, 'Typed mode');

  const empty = computeCallSpeechMetrics();
  assert.equal(empty.userWords, 0);
  assert.equal(empty.userTalkPct, 50);
});

test('interview screen-share artifacts are restricted to tech topics and build clean prompt addenda', () => {
  assert.equal(isScreenShareAllowedTopic('HR'), false);
  assert.equal(isScreenShareAllowedTopic('Behavioral'), false);
  assert.equal(isScreenShareAllowedTopic('Technical'), true);
  assert.equal(isScreenShareAllowedTopic('System Design'), true);
  assert.equal(getArtifactsForTopic('HR').length, 0);
  assert.ok(getArtifactsForTopic('Technical').length >= 2);

  const art = findArtifactById('ts-checkout-race');
  assert.ok(art && art.lines.length > 5);
  const addendum = buildTurnContextAddendum({
    interrupted: true,
    screenShareArtifact: art,
    highlightedLines: [6, 7],
    artifactNotes: 'Missing AbortController'
  });
  assert.match(addendum, /BARGE-IN/);
  assert.match(addendum, /Candidate highlighted line\(s\): 6, 7/);
  assert.match(addendum, /Missing AbortController/);
});
