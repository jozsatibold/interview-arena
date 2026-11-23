import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeInterviewTranscript, computeUnspokenTail } from '../shared/transcript.mjs';
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
import { getTopicUiLabels, getRoleCategory, getLeadershipTier, ROLE_ARCHETYPES } from '../shared/role-archetypes.mjs';
import { normalizeGeneratedRounds } from '../server/document-service.mjs';
import {
  ROLE_KNOWLEDGE_BASES,
  getRoleKnowledgeBase,
  formatKnowledgeForInterviewer,
  formatKnowledgeForDebrief
} from '../shared/role-knowledge.mjs';
import {
  TECH_STACK_KBS,
  detectRelevantTechStacks,
  formatTechStacksForInterviewer
} from '../shared/kb-tech-stacks.mjs';
import { buildTurnContextAddendum } from '../server/pacing.mjs';
import { getAdaptedAgents, getActiveJobDescriptions, resolveEffectiveArchetype, buildDynamicAgentDirective, detectRoleArchetype, adaptMorningPathForTrack } from '../role-adapter.mjs';
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
  resolveEffectiveContextTier,
  LLM_CONTEXT_TIERS
} from '../shared/model-tiers.mjs';
import { rollDetailedDna, getExpressionTargets } from '../app/modules/avatar-detailed.js';
import { AGENT_META, MORNING_PATH } from '../server/config.mjs';
import { SCRIPT_STAGES, SCRIPT_BEATS, SCRIPT_BEAT_MAP } from '../shared/script-beats.mjs';
import {
  resolveScriptComplexity,
  selectStageSpine,
  generateInterviewScript,
  advanceScriptState,
  renderScriptPacingDirectives
} from '../shared/interview-script-engine.mjs';
import {
  MAX_SCRIPT_SESSIONS,
  resolveOrCreateScriptSession,
  updateScriptSessionPlan,
  recordScriptBeatSignal,
  clearScriptSession,
  getScriptSessionCount
} from '../server/script-session-store.mjs';

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

test('universal tech-company archetypes detect PM, PO, CTO, CEO, COO, Tech Lead and adapt prompts/artifacts cleanly', () => {
  assert.equal(detectRoleArchetype('Senior Product Manager working with React & SQL engineers on activation funnel and PRD', { headline: 'Senior Product Manager' }), 'pm');
  assert.equal(detectRoleArchetype('Product Owner facilitating Scrum backlog refinement and acceptance criteria in Jira', { headline: 'Product Owner' }), 'po');
  assert.equal(detectRoleArchetype('Chief Technology Officer scaling 90 engineers, cloud FinOps, and SOC2 roadmap', { headline: 'CTO / VP Engineering' }), 'cto');
  assert.equal(detectRoleArchetype('CEO & Co-Founder leading Series B fundraising, P&L, NRR, and board governance', { headline: 'Chief Executive Officer' }), 'ceo');
  assert.equal(detectRoleArchetype('Chief Operating Officer driving SLA recovery, unit economics, and RevOps scaling', { headline: 'COO' }), 'coo');
  assert.equal(detectRoleArchetype('Staff Tech Lead authoring RFCs, mentoring squads on React & TypeScript architecture', { headline: 'Staff Tech Lead' }), 'techlead');
  assert.equal(detectRoleArchetype('Engineering Manager leading 1-on-1s, hiring loops, and delivery predictability', { headline: 'Engineering Manager' }), 'em');
  assert.equal(detectRoleArchetype('Senior Product Designer owning Figma design system and WCAG usability testing', { headline: 'Senior Product Designer' }), 'design');

  assert.equal(getRoleCategory('ceo'), 'executive');
  assert.equal(getRoleCategory('pm'), 'product');
  assert.ok(Object.keys(ROLE_ARCHETYPES).length >= 18);

  const pmLabels = getTopicUiLabels('pm');
  assert.equal(pmLabels['Live Coding'], 'Live Case');
  const ceoLabels = getTopicUiLabels('ceo');
  assert.equal(ceoLabels['Live Coding'], 'Exec Scenario');

  const pmScope = getTopicScopeContract('Live Coding', 'pm');
  assert.match(pmScope.forbidden, /NEVER ask the candidate to write programming code/i);
  const ctoScope = getTopicScopeContract('Live Coding', 'cto');
  assert.match(ctoScope.forbidden, /NEVER ask the candidate to write code/i);

  const pmArtifacts = getArtifactsForTopic('Technical', 'pm');
  assert.ok(pmArtifacts.some((a) => a.id === 'pm-activation-funnel'));
  assert.ok(!pmArtifacts.some((a) => a.id === 'ts-checkout-race'));

  const ceoArtifacts = getArtifactsForTopic('Technical', 'ceo');
  assert.ok(ceoArtifacts.some((a) => a.id === 'ceo-board-runway'));

  const effTrack = resolveEffectiveArchetype({ rawText: 'React', profile: { headline: 'Frontend' } }, 'coo');
  assert.equal(effTrack, 'coo');
  const adapted = getAdaptedAgents([{ id: '04-live-coding-anti-freeze-trainer.md', topic: 'Live Coding', title: 'Old', badgeText: '{}' }], null, 'coo');
  assert.match(adapted[0].title, /Ops Case/i);
  const jds = getActiveJobDescriptions([], null, 'cto');
  assert.match(jds[0].roleTitle, /CTO|Chief Technology/i);

  const dir = buildDynamicAgentDirective({ meta: { title: 'Strategy', topic: 'Technical', avatarName: 'Maya' }, activeCv: { profile: { candidateName: 'Jozsa' } }, companyName: 'TestCo', archKey: 'ceo' });
  assert.match(dir, /CEO \/ Co-Founder/i);
  assert.match(dir, /NEVER quiz coding syntax/i);
});

test('every tech-company archetype has a complete senior knowledge base, zero prompt truncation across all 3 LLM tiers & targeted artifacts', () => {
  const keys = Object.keys(ROLE_ARCHETYPES);
  assert.ok(keys.length >= 32, `Expected >=32 startup/enterprise archetypes, got ${keys.length}`);
  const topics = ['HR', 'Behavioral', 'Technical', 'Live Coding', 'System Design', 'Negotiation'];

  for (const key of keys) {
    const kb = ROLE_KNOWLEDGE_BASES[key];
    assert.ok(kb, `Missing KB for role ${key}`);
    assert.ok(typeof kb.mandate === 'string' && kb.mandate.length > 40, `Weak mandate for ${key}`);
    assert.ok(Array.isArray(kb.mentalModels) && kb.mentalModels.length >= 4, `Need >=4 mentalModels for ${key}`);
    assert.ok(Array.isArray(kb.probeLadders) && kb.probeLadders.length >= 3, `Need >=3 probeLadders for ${key}`);
    assert.ok(Array.isArray(kb.redFlags) && kb.redFlags.length >= 3, `Need >=3 redFlags for ${key}`);
    assert.ok(Array.isArray(kb.powerPhrases) && kb.powerPhrases.length >= 2, `Need >=2 powerPhrases for ${key}`);
    for (const t of topics) {
      assert.ok(typeof kb.roundRubrics?.[t] === 'string' && kb.roundRubrics[t].length > 25, `Missing ${t} rubric for ${key}`);
    }
    // Verify ZERO prompt truncation on Small, Medium, and Large LLM budgets!
    for (const tierId of ['small', 'medium', 'large']) {
      const dir = buildDynamicAgentDirective({
        meta: { title: 'Core Craft', topic: 'Technical', avatarName: 'Alex' },
        activeCv: { profile: { candidateName: 'Test Candidate', topAchievements: ['Scaled system 4x', 'Cut costs 30%'], gapAreas: ['Metrics framing'] } },
        companyName: 'TestCo',
        archKey: key,
        tier: tierId
      });
      const cap = LLM_CONTEXT_TIERS[tierId].budgets.maxAgentChars;
      assert.ok(dir.length <= cap, `Prompt truncation risk for ${key} on ${tierId}: ${dir.length} > ${cap}`);
    }
  }

  // Design tools & workflow depth
  const designKb = getRoleKnowledgeBase('design');
  const designBlob = `${designKb.mentalModels.join(' ')} ${designKb.roundRubrics.Technical}`;
  assert.match(designBlob, /Figma/i);
  assert.match(designBlob, /Dev Mode/i);
  assert.match(designBlob, /Storybook/i);
  assert.match(designBlob, /ProtoPie|Rive/i);
  assert.match(designBlob, /Maze|Dovetail/i);

  // Startup & Enterprise role detection
  assert.equal(detectRoleArchetype('Chief Financial Officer leading ASC 606 audit, Rule of 40 FP&A, and Series C fundraising', { headline: 'CFO' }), 'cfo');
  assert.equal(detectRoleArchetype('Chief Revenue Officer scaling Enterprise MEDDPICC pipeline coverage and $35M ARR', { headline: 'CRO / VP Sales' }), 'cro');
  assert.equal(detectRoleArchetype('Director of Product Marketing driving ICP positioning, PLG launches, and CAC payback', { headline: 'PMM Director' }), 'marketing');
  assert.equal(detectRoleArchetype('Principal Solutions Architect scoping Okta SCIM PoCs and EU bank integrations', { headline: 'Solutions Architect' }), 'solutions');
  assert.equal(detectRoleArchetype('Senior Go Engineer building gRPC microservices, goroutine worker pools, and pprof optimization', { headline: 'Senior Go Engineer' }), 'go');
  assert.equal(detectRoleArchetype('Senior Rust Systems Engineer writing Tokio async storage pipelines with zero-copy serde', { headline: 'Senior Rust Engineer' }), 'rust');
  assert.equal(detectRoleArchetype('Senior iOS Engineer maintaining SwiftUI, structured concurrency, and legacy Objective-C SDK bridges', { headline: 'Senior iOS Engineer' }), 'ios');
  assert.equal(detectRoleArchetype('Senior Android Engineer building Kotlin Coroutines, Jetpack Compose, Room and WorkManager', { headline: 'Senior Android Engineer' }), 'android');
  assert.equal(detectRoleArchetype('Senior C++20 Systems Engineer optimizing RAII lock-free ring buffers and cache locality', { headline: 'Senior C++ Engineer' }), 'cpp');
  assert.equal(detectRoleArchetype('Senior Mobile Engineer migrating Apache Cordova WKWebView plugins and React Native Hermes apps', { headline: 'Senior React Native / Mobile Engineer' }), 'mobile');
  assert.equal(detectRoleArchetype('Staff Technical Program Manager managing critical path RAID risks and 6-squad Go/No-Go launches', { headline: 'Staff Technical Program Manager' }), 'tpm');
  assert.equal(detectRoleArchetype('Enterprise Customer Success Manager driving 122% NRR, executive QBRs, and churn rescue', { headline: 'Enterprise CSM / TAM' }), 'csm');
  assert.equal(detectRoleArchetype('Head of People Ops & Technical Recruiting scaling hiring rubrics, comp bands, and HRBP org design', { headline: 'Head of People Ops' }), 'people');

  // Non-coding roles MUST NEVER receive IC coding stack pitfalls or coding scope contracts
  for (const nonCodeRole of ['ceo', 'coo', 'cto', 'cfo', 'cro', 'em', 'pm', 'po', 'design', 'marketing', 'tpm', 'csm', 'people']) {
    assert.equal(formatTechStacksForInterviewer({ archKey: nonCodeRole, cvText: 'React Java SQL', topic: 'Technical' }), '', `${nonCodeRole} leaked coding stack KB`);
    const lcScope = getTopicScopeContract('Live Coding', nonCodeRole);
    assert.match(lcScope.forbidden, /NEVER ask the candidate to write/i, `${nonCodeRole} missing no-code Live Coding guardrail`);
  }

  // Built-in 20 multi-language / mobile / web / data / cloud stack deep KBs
  const all20Stacks = ['typescript', 'nodejs', 'react', 'vue', 'lit', 'angular', 'java', 'dotnet', 'python', 'go', 'rust', 'cpp', 'swift', 'objc', 'kotlin', 'reactnative', 'cordova', 'flutter', 'sql', 'cloud'];
  for (const stackId of all20Stacks) {
    assert.ok(TECH_STACK_KBS[stackId]?.pitfalls && TECH_STACK_KBS[stackId]?.probe, `Missing built-in tech KB for ${stackId}`);
  }
  const hybridMobileStacks = detectRelevantTechStacks({
    archKey: 'mobile',
    cvText: 'Migrated Cordova WKWebView plugins to React Native New Architecture with Swift native bridges',
    coreStack: ['Cordova', 'React Native', 'Swift'],
    maxCount: 3
  });
  const hybridIds = hybridMobileStacks.map((s) => s.id);
  assert.ok(hybridIds.includes('cordova') && hybridIds.includes('reactnative') && hybridIds.includes('swift'));

  const litReactPrompt = formatTechStacksForInterviewer({
    archKey: 'frontend',
    cvText: 'Built 12KB Lit Web Components Shadow DOM widgets and React Next.js SaaS',
    topic: 'Technical',
    tier: 'large'
  });
  assert.match(litReactPrompt, /Lit \/ Web Components/i);
  assert.match(litReactPrompt, /React \/ Next\.js/i);

  const debriefBar = formatKnowledgeForDebrief({ archKey: 'cro', topic: 'Live Coding' });
  assert.match(debriefBar, /SENIOR ROLE GRADING RUBRIC \(CRO/i);
  assert.match(debriefBar, /Automatic Penalty Red Flags/i);
  const compactDebrief = formatKnowledgeForDebrief({ archKey: 'mobile', topic: 'Technical', compact: true });
  assert.ok(compactDebrief.length <= 750, `Compact debrief too long for small LLM: ${compactDebrief.length}`);
  assert.match(compactDebrief, /Top 5% Bar:/i);
  assert.match(compactDebrief, /Red Flags/i);
  assert.ok(formatKnowledgeForDebrief({ archKey: 'mobile', topic: 'Technical', compact: false }).length > 1000);

  // Exact first Screen Share artifact pinning across every specialized track
  assert.equal(getArtifactsForTopic('Technical', 'ceo')[0]?.id, 'ceo-board-runway');
  assert.equal(getArtifactsForTopic('Technical', 'coo')[0]?.id, 'coo-ops-sla');
  assert.equal(getArtifactsForTopic('Technical', 'cto')[0]?.id, 'cto-finops-org');
  assert.equal(getArtifactsForTopic('Technical', 'pm')[0]?.id, 'pm-activation-funnel');
  assert.equal(getArtifactsForTopic('Technical', 'po')[0]?.id, 'po-sprint-scope');
  assert.equal(getArtifactsForTopic('Technical', 'cfo')[0]?.id, 'cfo-rule40-cohort');
  assert.equal(getArtifactsForTopic('Technical', 'cro')[0]?.id, 'cro-pipeline-meddpicc');
  assert.equal(getArtifactsForTopic('Technical', 'marketing')[0]?.id, 'mktg-plg-positioning');
  assert.equal(getArtifactsForTopic('Technical', 'solutions')[0]?.id, 'sol-enterprise-poc');
  assert.equal(getArtifactsForTopic('Technical', 'devops')[0]?.id, 'devops-k8s-outage');
  assert.equal(getArtifactsForTopic('Technical', 'qa')[0]?.id, 'qa-flaky-ci-pyramid');
  assert.equal(getArtifactsForTopic('Technical', 'java')[0]?.id, 'backend-idempotency-outbox');
  assert.equal(getArtifactsForTopic('Technical', 'flutter')[0]?.id, 'mobile-jank-offline');
  assert.equal(getArtifactsForTopic('Technical', 'go')[0]?.id, 'go-context-leak');
  assert.equal(getArtifactsForTopic('Technical', 'rust')[0]?.id, 'rust-tokio-mutex');
  assert.equal(getArtifactsForTopic('Technical', 'ios')[0]?.id, 'ios-actor-reentrancy');
  assert.equal(getArtifactsForTopic('Technical', 'android')[0]?.id, 'android-compose-anr');
  assert.equal(getArtifactsForTopic('Technical', 'cpp')[0]?.id, 'cpp-raii-falsesharing');
  assert.equal(getArtifactsForTopic('Technical', 'mobile')[0]?.id, 'rn-cordova-bridge');
  assert.equal(getArtifactsForTopic('Technical', 'tpm')[0]?.id, 'tpm-cross-org-slip');
  assert.equal(getArtifactsForTopic('Technical', 'csm')[0]?.id, 'csm-enterprise-churn');
  assert.equal(getArtifactsForTopic('Technical', 'people')[0]?.id, 'people-hiring-leveling');

  assert.ok(getRoleKnowledgeBase('unknown-fallback') === ROLE_KNOWLEDGE_BASES.general);
});

test('computeUnspokenTail prevents double-speaking when streamed text and final reply differ in trailing whitespace or markdown', () => {
  // Exact regression case: streamed sentences ended with trailing newline before ===COACH_JSON===, trimmed on done
  assert.equal(
    computeUnspokenTail('Hi Alex! Welcome to our chat. How is your week going?', 'Hi Alex! Welcome to our chat. How is your week going?\n'),
    ''
  );
  // Only final unfinished sentence remains
  assert.equal(
    computeUnspokenTail('Hi Alex! Welcome to our chat. How is your week going?', 'Hi Alex! Welcome to our chat.'),
    'How is your week going?'
  );
  // Markdown ** stripped between stream and final reply
  assert.equal(
    computeUnspokenTail('Hi Alex, glad to meet you! How is your week going?', 'Hi **Alex**, glad to meet you!'),
    'How is your week going?'
  );
  // Nothing queued during stream yet -> speak entire final text once
  assert.equal(
    computeUnspokenTail('How has your week been going?', ''),
    'How has your week been going?'
  );
  // Anchor recovery if minor mid-sentence edit happened before done
  assert.equal(
    computeUnspokenTail('That makes complete sense. What was your biggest trade-off there?', 'That makes total sense. What was'),
    'your biggest trade-off there?'
  );
});

test('executive and manager interview architecture: custom loops, time-scaled pacing, visuals & behavioral Screen Share', () => {
  assert.equal(getLeadershipTier('ceo'), 'executive');
  assert.equal(getLeadershipTier('cfo'), 'executive');
  assert.equal(getLeadershipTier('cto'), 'executive');
  assert.equal(getLeadershipTier('coo'), 'executive');
  assert.equal(getLeadershipTier('cro'), 'executive');
  assert.equal(getLeadershipTier('em'), 'manager');
  assert.equal(getLeadershipTier('tpm'), 'manager');
  assert.equal(getLeadershipTier('people'), 'manager');
  assert.equal(getLeadershipTier('frontend'), 'ic');
  assert.equal(getLeadershipTier('pm'), 'ic');

  // Distinct 20-day blueprints per tier
  const ceoPath = adaptMorningPathForTrack(MORNING_PATH, null, AGENT_META, 'ceo');
  const emPath = adaptMorningPathForTrack(MORNING_PATH, null, AGENT_META, 'em');
  assert.equal(ceoPath.length, 20);
  assert.equal(emPath.length, 20);
  assert.ok(ceoPath.some((d) => /100-Day Plan/i.test(d.title)));
  assert.equal(ceoPath.filter((d) => d.topic === 'System Design').length, 3);
  assert.equal(emPath.filter((d) => d.topic === 'Behavioral').length, 4);
  assert.equal(emPath.filter((d) => d.topic === 'Live Coding').length, 4);

  // Target Interviews: 7-round Executive / 6-round Manager fallback rosters
  const execRounds = normalizeGeneratedRounds(null, 'Kestrel EU', 'Chief Financial Officer (CFO)');
  assert.equal(execRounds.length, 7);
  assert.ok(execRounds.some((r) => /100-Day Plan/i.test(r.title)));
  assert.ok(execRounds.some((r) => /C-Suite Peer/i.test(r.title)));

  const mgrRounds = normalizeGeneratedRounds(null, 'ScaleGrid', 'Engineering Manager');
  assert.equal(mgrRounds.length, 6);
  assert.ok(mgrRounds.some((r) => /Coaching & Retention Roleplay/i.test(r.title)));

  const icRounds = normalizeGeneratedRounds(null, 'FinPay', 'Senior Java Engineer');
  assert.equal(icRounds.length, 5);

  // Time-scaled pacing: 25m/45m stays in explore at userTurns=8 instead of premature closing!
  const midExec = buildInterviewPacingDirectives({
    action: 'turn', topic: 'Technical', archKey: 'ceo',
    userTurns: 8, elapsedSeconds: 420, targetDurationSeconds: 1500, firstName: 'Alex'
  });
  assert.equal(midExec.phase, 'explore');

  // Executive Mutual Due Diligence triggers at ~28% remaining budget (400s left of 1500s)
  const execDiligence = buildInterviewPacingDirectives({
    action: 'turn', topic: 'Technical', archKey: 'ceo',
    userTurns: 11, elapsedSeconds: 1100, targetDurationSeconds: 1500, firstName: 'Alex'
  });
  assert.equal(execDiligence.phase, 'reverse_qa');
  assert.match(execDiligence.pacingBlock, /EXECUTIVE MUTUAL DUE DILIGENCE/i);

  // Executive / Manager interviewer presentation removes developer studio headsets
  const execAgents = getAdaptedAgents(AGENT_META, null, 'ceo');
  assert.ok(execAgents.every((a) => a.persona === 'business' && a.headset === 'none' && a.glasses !== 'tech'));
  assert.ok(execAgents.filter((a) => a.gender === 'male').every((a) => a.tie === true));

  // Screen Share allows Behavioral ONLY for executive & manager (IC Behavioral stays false!)
  assert.equal(isScreenShareAllowedTopic('Behavioral'), false);
  assert.equal(isScreenShareAllowedTopic('Behavioral', 'frontend'), false);
  assert.equal(isScreenShareAllowedTopic('Behavioral', 'ceo'), true);
  assert.equal(isScreenShareAllowedTopic('Behavioral', 'em'), true);

  const ceoBehArts = getArtifactsForTopic('Behavioral', 'ceo').map((a) => a.id);
  assert.ok(ceoBehArts.includes('exec-peer-conflict'));
  const ceoCaseArts = getArtifactsForTopic('Live Coding', 'ceo').map((a) => a.id);
  assert.ok(ceoCaseArts.includes('exec-100day-plan'));
  const emCaseArts = getArtifactsForTopic('Live Coding', 'em').map((a) => a.id);
  assert.ok(emCaseArts.includes('em-pip-coaching'));
});

test('interview script engine: graph integrity, 1000+ coherent rolls, complexity tiers & state machine guards', () => {
  // 1. Referential integrity of beat graph edges
  for (const beat of SCRIPT_BEATS) {
    assert.ok(SCRIPT_STAGES.includes(beat.stage), `Invalid stage on ${beat.id}`);
    for (const ref of [...(beat.preferredNext || []), ...(beat.forbiddenNext || [])]) {
      assert.ok(SCRIPT_BEAT_MAP[ref], `Dangling beat edge "${ref}" on ${beat.id}`);
    }
  }

  // 2. LLM complexity tier mapping (user's local Ollama roster + small/medium/large)
  const tierFor = (name) => resolveEffectiveContextTier({ preference: 'auto', modelName: name });
  assert.equal(resolveScriptComplexity(tierFor('LFM2.5-2.6B')), 'lean');
  assert.equal(resolveScriptComplexity(tierFor('qwen2.5:7b')), 'lean');
  assert.equal(resolveScriptComplexity(tierFor('qwen3.5:9b')), 'standard');
  assert.equal(resolveScriptComplexity(tierFor('gemma4:12b')), 'standard');
  assert.equal(resolveScriptComplexity(tierFor('qwen3.6:27b')), 'rich');
  assert.equal(resolveScriptComplexity(tierFor('qwen3.6:35b-a3b-q8_0')), 'rich');
  assert.equal(resolveScriptComplexity(tierFor('llama3.3:70b')), 'rich');
  assert.deepEqual(selectStageSpine({ topic: 'HR', archKey: 'frontend', targetDurationSeconds: 720, complexity: 'lean' }), ['arrival', 'framing', 'core_anchor', 'reverse_qa', 'closing']);
  assert.ok(selectStageSpine({ topic: 'Technical', archKey: 'ceo', targetDurationSeconds: 1500, complexity: 'rich' }).includes('applied_case'));

  // 3. Exhaustive Monte Carlo coherence test across roles x topics x complexities x durations
  const stageIdxOf = (stage) => SCRIPT_STAGES.indexOf(stage);
  const archSample = ['frontend', 'em', 'ceo'];
  const topicSample = ['HR', 'Behavioral', 'Technical', 'Live Coding', 'System Design', 'Negotiation'];
  const compSample = ['lean', 'standard', 'rich'];
  const durSample = [600, 1500, 2700];
  let totalRolls = 0;

  for (const archKey of archSample) {
    for (const topic of topicSample) {
      for (const complexity of compSample) {
        for (const targetDurationSeconds of durSample) {
          for (let k = 0; k < 7; k++) {
            totalRolls += 1;
            const plan = generateInterviewScript({
              topic,
              archKey,
              targetDurationSeconds,
              complexity,
              hasScreenShare: topic !== 'HR' && topic !== 'Negotiation'
            });
            assert.ok(plan.beatIds.length >= 5, `Spine too short for ${archKey}/${topic}/${complexity}`);
            const firstBeat = SCRIPT_BEAT_MAP[plan.beatIds[0]];
            const lastBeat = SCRIPT_BEAT_MAP[plan.beatIds[plan.beatIds.length - 1]];
            assert.equal(firstBeat.stage, 'arrival');
            assert.equal(lastBeat.stage, 'closing');

            const seenTags = new Set();
            let prevBeat = null;
            for (const id of plan.beatIds) {
              const b = SCRIPT_BEAT_MAP[id];
              assert.ok(b, `Unknown beat id ${id}`);
              if (prevBeat) {
                assert.equal(prevBeat.forbiddenNext?.includes(id), false, `Forbidden jump ${prevBeat.id} -> ${id}`);
                assert.ok(stageIdxOf(b.stage) > stageIdxOf(prevBeat.stage), `Non-monotonic stage ${prevBeat.stage} -> ${b.stage}`);
              }
              for (const ex of b.excludes || []) {
                assert.equal(seenTags.has(ex), false, `Conflict excludes=${ex} on ${id} in ${plan.beatIds.join(',')}`);
              }
              for (const tag of b.provides || []) seenTags.add(tag);
              prevBeat = b;
            }
          }
        }
      }
    }
  }
  assert.ok(totalRolls > 1000);

  // 4. Meaningful random variety across rolls (arrival & framing shouldn't collapse to 1 variant)
  const arrivalsSeen = new Set();
  const framingsSeen = new Set();
  for (let i = 0; i < 60; i++) {
    const p = generateInterviewScript({
      topic: 'Technical',
      archKey: 'ceo',
      targetDurationSeconds: 1500,
      complexity: 'rich',
      hasScreenShare: true
    });
    arrivalsSeen.add(p.beatIds[0]);
    framingsSeen.add(p.beatIds[1]);
  }
  assert.ok(arrivalsSeen.size >= 3, `Expected >=3 arrival variants, got ${arrivalsSeen.size}`);
  assert.ok(framingsSeen.size >= 3, `Expected >=3 framing variants, got ${framingsSeen.size}`);

  // 5. State machine safeguards (barge-in, retry, short clarification, rich adaptive hold, lean deterministic, clock jump)
  let richPlan = {
    id: 'test-rich',
    complexity: 'rich',
    topic: 'Technical',
    archKey: 'frontend',
    beatIds: ['arrival_warm_smalltalk', 'framing_role_problem', 'arc_problem_resonance', 'anchor_domain_tradeoff', 'probe_scale_constraint', 'qa_classic_team', 'close_warm_takeaway'],
    currentIndex: 3, // anchor_domain_tradeoff (minTurns 1, maxTurns 2)
    turnsOnBeat: 0,
    shortHoldUsedOnBeat: false,
    completedIds: ['arrival_warm_smalltalk', 'framing_role_problem', 'arc_problem_resonance'],
    lastBeatDone: null
  };

  // Barge-in & retry must hold current beat
  const onBargeIn = advanceScriptState(richPlan, { action: 'turn', userTurns: 4, lastUserText: 'Wait let me clarify my point about sharding!', interrupted: true });
  assert.equal(onBargeIn.currentIndex, 3);
  const onRetry = advanceScriptState(richPlan, { action: 'turn', userTurns: 4, lastUserText: 'Better phrasing here', retryOf: { better: 'Better phrasing' } });
  assert.equal(onRetry.currentIndex, 3);

  // Short (<7 word) clarification holds once, then second normal reply can proceed
  const onShort = advanceScriptState(richPlan, { action: 'turn', userTurns: 4, lastUserText: 'Could you repeat that?' });
  assert.equal(onShort.currentIndex, 3);
  assert.equal(onShort.shortHoldUsedOnBeat, true);

  // Adaptive hold on rich when lastBeatDone === false (holds up to maxTurns=2, then forces advance)
  const onHold = advanceScriptState({ ...richPlan, lastBeatDone: false }, { action: 'turn', userTurns: 4, lastUserText: 'We just chose PostgreSQL because it seemed safer for transactions overall.' });
  assert.equal(onHold.currentIndex, 3);
  assert.equal(onHold.turnsOnBeat, 1);
  const onForceAdvance = advanceScriptState({ ...onHold, lastBeatDone: false }, { action: 'turn', userTurns: 5, lastUserText: 'Specifically we needed strict ACID serializable isolation for ledger settlement balances across shards.' });
  assert.equal(onForceAdvance.currentIndex, 4);
  assert.equal(onForceAdvance.turnsOnBeat, 0);

  // Lean mode ignores lastBeatDone: false on framing and advances deterministically
  const leanPlan = {
    id: 'test-lean',
    complexity: 'lean',
    topic: 'HR',
    archKey: 'frontend',
    beatIds: ['arrival_warm_smalltalk', 'framing_company_story', 'anchor_cv_deepdive', 'qa_classic_team', 'close_warm_takeaway'],
    currentIndex: 1,
    turnsOnBeat: 0,
    shortHoldUsedOnBeat: false,
    completedIds: ['arrival_warm_smalltalk'],
    lastBeatDone: false
  };
  const leanNext = advanceScriptState(leanPlan, { action: 'turn', userTurns: 2, lastUserText: 'Sounds great, happy to talk through my recent backend experience here.' });
  assert.equal(leanNext.currentIndex, 2);

  // Clock safety jump to reverse_qa and closing
  const toQa = advanceScriptState(richPlan, { action: 'turn', userTurns: 5, lastUserText: 'That makes total sense in production systems.', elapsedSeconds: 600, targetDurationSeconds: 720, archKey: 'frontend' });
  assert.equal(SCRIPT_BEAT_MAP[toQa.beatIds[toQa.currentIndex]].stage, 'reverse_qa');
  const toClose = advanceScriptState(toQa, { action: 'turn', userTurns: 6, lastUserText: 'What does onboarding look like in the first month?', elapsedSeconds: 685, targetDurationSeconds: 720, archKey: 'frontend' });
  assert.equal(SCRIPT_BEAT_MAP[toClose.beatIds[toClose.currentIndex]].stage, 'closing');

  // 6. Invisible session store + meta leak protection + Small (4096 ctx) budget guard
  const created = resolveOrCreateScriptSession({
    action: 'start',
    topic: 'Technical',
    archKey: 'ceo',
    targetDurationSeconds: 1500,
    tierInfo: tierFor('qwen3.6:27b'),
    hasScreenShare: true
  });
  assert.ok(created.scriptSessionId.startsWith('ss_'));
  updateScriptSessionPlan(created.scriptSessionId, { ...created.plan, currentIndex: 1 });
  recordScriptBeatSignal(created.scriptSessionId, false);
  const renderedRichHold = renderScriptPacingDirectives({ ...richPlan, turnsOnBeat: 1 }, { firstName: 'Alex', avatarName: 'Maya', companyName: 'Kestrel', topic: 'Technical' });
  assert.match(renderedRichHold.pacingBlock, /DEPTH HOLD ACTIVE/);
  assert.match(renderedRichHold.pacingBlock, /UPCOMING TRANSITION HINT/);
  const metaCheck = extractCoachMeta({ expression: 'curious', beatDone: false, grammarFixes: [] });
  assert.equal(metaCheck.beatDone, false);

  // Mid-call recovery with unknown token positions cursor past arrival/framing
  const recovered = resolveOrCreateScriptSession({
    scriptSessionId: 'ss_nonexistent_after_restart',
    action: 'turn',
    topic: 'Technical',
    archKey: 'ceo',
    userTurns: 4,
    targetDurationSeconds: 1500,
    tierInfo: tierFor('qwen3.6:35b-a3b-q8_0')
  });
  assert.equal(recovered.recovered, true);
  assert.ok(recovered.plan.currentIndex >= 3);

  // Cleanup & bounded session store check
  clearScriptSession(created.scriptSessionId);
  clearScriptSession(recovered.scriptSessionId);
  for (let i = 0; i < MAX_SCRIPT_SESSIONS + 12; i++) {
    resolveOrCreateScriptSession({ action: 'start', topic: 'HR', archKey: 'frontend', tierInfo: tierFor('qwen2.5:7b') });
  }
  assert.ok(getScriptSessionCount() <= MAX_SCRIPT_SESSIONS);

  // Small (4096) compact prompt stays <= 58% budget across ALL beats of a lean script
  const leanPromptPlan = generateInterviewScript({ topic: 'HR', archKey: 'frontend', targetDurationSeconds: 720, complexity: 'lean' });
  const smallTier = tierFor('qwen2.5:7b');
  for (let bIdx = 0; bIdx < leanPromptPlan.beatIds.length; bIdx++) {
    const stepPlan = { ...leanPromptPlan, currentIndex: bIdx, completedIds: leanPromptPlan.beatIds.slice(0, bIdx) };
    const pacing = buildInterviewPacingDirectives({
      action: bIdx === 0 ? 'start' : 'turn',
      topic: 'HR',
      archKey: 'frontend',
      firstName: 'Alex',
      avatarName: 'Sarah',
      companyName: 'VeloPay',
      compactMode: true,
      scriptPlan: stepPlan
    });
    assert.ok(pacing.pacingBlock.length <= 360, `Lean pacingBlock too long (${pacing.pacingBlock.length}) on beat ${bIdx}`);
    const built = buildInterviewPrompt({
      compactPrompt: true,
      activeProfilePrompt: 'Senior Engineer with 7 years Node.js/TypeScript & React experience.',
      meta: { avatarName: 'Sarah', title: 'HR Recruiter' },
      companyName: 'VeloPay',
      topic: 'HR',
      archKey: 'frontend',
      firstName: 'Alex',
      personalityBlock: 'INTERVIEWER STYLE (Calm & Warm): Natural, polite, grounded.',
      pacing,
      agentPrompt: 'Conduct a balanced HR screen.',
      jdPrompt: 'Senior Frontend Engineer at VeloPay.',
      enableBeatSignal: false
    });
    assert.equal(built.systemPrompt.includes('beatDone'), false, 'Small prompt must not request beatDone');
    const approxTokens = Math.ceil((built.systemPrompt.length + 6 * 220) / 4);
    assert.ok(approxTokens <= smallTier.budgets.numCtx * 0.58, `Small token estimate ${approxTokens} exceeded 58% of 4096`);
  }
});
