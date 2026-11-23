/**
 * Interview Script Engine — Coherent Graph Generator, State Machine & Drip-Feeder (SCRIPT-02)
 * Invisible server-side director that rolls a cohesive, non-repeating beat sequence per call
 * and feeds ONLY the active beat (+ bridge hint) turn-by-turn scaled to LLM capability.
 */

import { getLeadershipTier } from './role-archetypes.mjs';
import { isScreenShareAllowedTopic } from './interview-artifacts.mjs';
import { SCRIPT_BEATS, SCRIPT_BEAT_MAP } from './script-beats.mjs';

const COMPLEXITY_RANK = { lean: 1, standard: 2, rich: 3 };

/**
 * Determine script engine complexity from model parameter count / context tier.
 * - 1B-8B (small): lean (4-6 beats, strict deterministic turn advancing, compact prompts)
 * - 9B-23B (medium lower): standard (6-7 beats, adaptive beatDone up to maxTurns)
 * - 24B+ / 36B+ (e.g. qwen3.6:27b, qwen3.6:35b, large): rich (7-8 beats + stress-test & live case)
 */
export function resolveScriptComplexity(tierInfo = null) {
  if (!tierInfo) return 'standard';
  const tierId = tierInfo.tier || tierInfo.id || '';
  if (tierId === 'small' || tierInfo.budgets?.compactPrompt) return 'lean';
  if (tierId === 'large') return 'rich';
  const paramB = Number(tierInfo.detected?.paramB ?? tierInfo.paramB);
  if (Number.isFinite(paramB) && paramB > 0) {
    if (paramB <= 8.5) return 'lean';
    if (paramB < 24) return 'standard';
    return 'rich';
  }
  return 'standard';
}

export function selectStageSpine({
  topic = 'HR',
  archKey = 'general',
  targetDurationSeconds = 720,
  complexity = 'standard'
} = {}) {
  const dur = Number(targetDurationSeconds) > 0 ? Number(targetDurationSeconds) : 720;
  const isExtended = dur > 780;
  const tier = getLeadershipTier(archKey);
  const supportsAppliedCase =
    topic === 'Negotiation' || isScreenShareAllowedTopic(topic, archKey);

  if (complexity === 'lean') {
    return isExtended
      ? ['arrival', 'framing', 'candidate_arc', 'core_anchor', 'reverse_qa', 'closing']
      : ['arrival', 'framing', 'core_anchor', 'reverse_qa', 'closing'];
  }

  if (complexity === 'standard') {
    if (!isExtended) {
      return ['arrival', 'framing', 'candidate_arc', 'core_anchor', 'reverse_qa', 'closing'];
    }
    const spine = ['arrival', 'framing', 'candidate_arc', 'core_anchor', 'probe_challenge'];
    if (topic === 'Negotiation') spine.push('applied_case');
    spine.push('reverse_qa', 'closing');
    return spine;
  }

  // rich (24B+ / large)
  if (!isExtended && tier !== 'executive') {
    return ['arrival', 'framing', 'candidate_arc', 'core_anchor', 'probe_challenge', 'reverse_qa', 'closing'];
  }
  const spine = ['arrival', 'framing', 'candidate_arc', 'core_anchor', 'probe_challenge'];
  if (supportsAppliedCase) spine.push('applied_case');
  spine.push('reverse_qa', 'closing');
  return spine;
}

function isBeatEligible({ beat, stage, tier, topic, complexity, hasScreenShare, providedTags, prevBeat }) {
  if (!beat || beat.stage !== stage) return false;
  if (!beat.tiers.includes(tier)) return false;
  if (!beat.topics.includes(topic)) return false;
  if (COMPLEXITY_RANK[beat.complexityMin] > COMPLEXITY_RANK[complexity]) return false;
  if (beat.requiresScreenShare && !hasScreenShare) return false;
  if (beat.excludes?.some((tag) => providedTags.has(tag))) return false;
  if (beat.requiresAny?.length && !beat.requiresAny.some((tag) => providedTags.has(tag))) return false;
  if (prevBeat?.forbiddenNext?.includes(beat.id)) return false;
  return true;
}

function scoreBeatCandidate({ beat, tier, prevBeat }) {
  let weight = 1;
  if (prevBeat?.preferredNext?.includes(beat.id)) weight *= 3.5;
  if (tier === 'executive' && !beat.tiers.includes('ic')) weight *= 2.0;
  else if (tier === 'manager' && !beat.tiers.includes('ic')) weight *= 1.4;
  return weight;
}

function weightedOrder(candidates, weights, rng) {
  const pool = candidates.map((beat, idx) => ({ beat, weight: weights[idx] }));
  const ordered = [];
  while (pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng() * total;
    let pickIdx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].weight;
      if (roll <= 0) {
        pickIdx = i;
        break;
      }
    }
    ordered.push(pool[pickIdx].beat);
    pool.splice(pickIdx, 1);
  }
  return ordered;
}

function createScriptId(rng) {
  const n = Math.floor(rng() * 0xffffff).toString(16).padStart(6, '0');
  return `scr_${Date.now().toString(36)}_${n}`;
}

export function generateInterviewScript({
  topic = 'HR',
  archKey = 'general',
  targetDurationSeconds = 720,
  complexity = 'standard',
  hasScreenShare = false,
  rng = Math.random
} = {}) {
  const tier = getLeadershipTier(archKey);
  const safeComplexity = COMPLEXITY_RANK[complexity] ? complexity : 'standard';
  const spine = selectStageSpine({ topic, archKey, targetDurationSeconds, complexity: safeComplexity });

  function solve(stageIdx, prevBeat, providedTags, acc) {
    if (stageIdx >= spine.length) return acc;
    const stage = spine[stageIdx];
    const eligible = SCRIPT_BEATS.filter((beat) =>
      isBeatEligible({
        beat,
        stage,
        tier,
        topic,
        complexity: safeComplexity,
        hasScreenShare,
        providedTags,
        prevBeat
      })
    );
    if (eligible.length === 0) return null;
    const weights = eligible.map((beat) => scoreBeatCandidate({ beat, tier, prevBeat }));
    const ordered = weightedOrder(eligible, weights, rng);
    for (const candidate of ordered) {
      const nextTags = new Set(providedTags);
      for (const tag of candidate.provides || []) nextTags.add(tag);
      const solved = solve(stageIdx + 1, candidate, nextTags, [...acc, candidate.id]);
      if (solved) return solved;
    }
    return null;
  }

  let beatIds = solve(0, null, new Set(), []);
  if (!beatIds) {
    // Graceful ultra-safe minimal spine fallback if an exotic filter occurred
    beatIds = ['arrival_warm_smalltalk', 'framing_interviewer_path', 'anchor_cv_deepdive', 'qa_classic_team', 'close_warm_takeaway'];
  }

  return {
    id: createScriptId(rng),
    complexity: safeComplexity,
    topic,
    archKey,
    hasScreenShare: Boolean(hasScreenShare),
    beatIds,
    currentIndex: 0,
    turnsOnBeat: 0,
    shortHoldUsedOnBeat: false,
    completedIds: [],
    lastBeatDone: null
  };
}

function stageToLegacyPhase(stage) {
  if (stage === 'arrival') return 'warmup';
  if (stage === 'framing') return 'intro';
  if (stage === 'reverse_qa') return 'reverse_qa';
  if (stage === 'closing') return 'closing';
  return 'explore';
}

function findBeatIndexByStage(beatIds, targetStage) {
  return beatIds.findIndex((id) => SCRIPT_BEAT_MAP[id]?.stage === targetStage);
}

export function advanceScriptState(plan, {
  action = 'turn',
  userTurns = 0,
  lastUserText = '',
  interrupted = false,
  retryOf = null,
  elapsedSeconds = null,
  targetDurationSeconds = null,
  archKey = 'general'
} = {}) {
  if (!plan || !Array.isArray(plan.beatIds) || plan.beatIds.length === 0) return plan;
  if (action === 'start' || userTurns === 0) {
    return { ...plan, currentIndex: 0, turnsOnBeat: 0, shortHoldUsedOnBeat: false, completedIds: [] };
  }

  // Never advance beat on candidate barge-in or "Say It Again" retry practice
  if (interrupted || retryOf?.better) {
    return { ...plan };
  }

  const totalBeats = plan.beatIds.length;
  const idx = Math.max(0, Math.min(totalBeats - 1, Number(plan.currentIndex || 0)));
  const currentBeat = SCRIPT_BEAT_MAP[plan.beatIds[idx]] || SCRIPT_BEATS[0];

  const durSec = Number(targetDurationSeconds);
  const hasClock = Number.isFinite(durSec) && durSec > 0 && Number.isFinite(Number(elapsedSeconds));
  const remainingSec = hasClock ? Math.max(0, durSec - Number(elapsedSeconds)) : null;
  const effectiveDuration = Number.isFinite(durSec) && durSec > 0 ? durSec : 720;
  const leadershipTier = getLeadershipTier(archKey || plan.archKey || 'general');
  const closingSec = Math.min(leadershipTier === 'executive' ? 90 : 50, Math.round(effectiveDuration * 0.12));
  const reverseQaSec = leadershipTier === 'executive'
    ? Math.round(effectiveDuration * 0.28)
    : leadershipTier === 'manager'
      ? Math.round(effectiveDuration * 0.22)
      : Math.min(180, Math.round(effectiveDuration * 0.20));
  const maxTurnsCap = Math.max(8, Math.round((effectiveDuration / 60) * 0.65));

  const closingIdx = Math.max(0, findBeatIndexByStage(plan.beatIds, 'closing'));
  const reverseQaIdx = findBeatIndexByStage(plan.beatIds, 'reverse_qa');

  const markCompletedUpTo = (toIdx) => {
    const done = new Set(plan.completedIds || []);
    for (let i = 0; i < toIdx; i++) done.add(plan.beatIds[i]);
    return [...done];
  };

  // Hard clock/turn safety compression so call always finishes gracefully
  if ((remainingSec !== null && remainingSec <= closingSec) || (!hasClock && userTurns >= maxTurnsCap)) {
    if (idx < closingIdx) {
      return {
        ...plan,
        currentIndex: closingIdx,
        turnsOnBeat: 0,
        shortHoldUsedOnBeat: false,
        completedIds: markCompletedUpTo(closingIdx),
        lastBeatDone: null
      };
    }
    return { ...plan, turnsOnBeat: (plan.turnsOnBeat || 0) + 1 };
  }

  if (reverseQaIdx !== -1 && idx < reverseQaIdx &&
      ((remainingSec !== null && remainingSec <= reverseQaSec) || (!hasClock && userTurns === maxTurnsCap - 1))) {
    return {
      ...plan,
      currentIndex: reverseQaIdx,
      turnsOnBeat: 0,
      shortHoldUsedOnBeat: false,
      completedIds: markCompletedUpTo(reverseQaIdx),
      lastBeatDone: null
    };
  }

  // Already at closing
  if (idx >= totalBeats - 1) {
    return { ...plan, turnsOnBeat: (plan.turnsOnBeat || 0) + 1 };
  }

  // Guard: short clarification/meta reply (<7 words) on substantive mid-interview beat holds once
  const wordCount = String(lastUserText || '').trim().split(/\s+/).filter(Boolean).length;
  const substantiveStage = ['core_anchor', 'probe_challenge', 'applied_case'].includes(currentBeat.stage);
  if (userTurns >= 2 && substantiveStage && wordCount > 0 && wordCount < 7 && !plan.shortHoldUsedOnBeat) {
    return {
      ...plan,
      turnsOnBeat: (plan.turnsOnBeat || 0) + 1,
      shortHoldUsedOnBeat: true
    };
  }

  const nextTurnsDone = Number(plan.turnsOnBeat || 0) + 1;

  if (plan.complexity === 'lean') {
    const remainingBeatsAfter = totalBeats - 1 - idx;
    const remainingTurns = maxTurnsCap - userTurns;
    if (currentBeat.stage === 'core_anchor' && nextTurnsDone < 2 && remainingTurns > remainingBeatsAfter + 1) {
      return { ...plan, turnsOnBeat: nextTurnsDone, lastBeatDone: null };
    }
    const nextIdx = Math.min(totalBeats - 1, idx + 1);
    return {
      ...plan,
      currentIndex: nextIdx,
      turnsOnBeat: 0,
      shortHoldUsedOnBeat: false,
      completedIds: markCompletedUpTo(nextIdx),
      lastBeatDone: null
    };
  }

  // Standard / Rich adaptive depth hold
  const minTurns = Number(currentBeat.minTurns || 1);
  const maxTurns = Number(currentBeat.maxTurns || 1);
  if (nextTurnsDone < minTurns || (plan.lastBeatDone === false && nextTurnsDone < maxTurns)) {
    return {
      ...plan,
      turnsOnBeat: nextTurnsDone,
      lastBeatDone: null
    };
  }

  const nextIdx = Math.min(totalBeats - 1, idx + 1);
  return {
    ...plan,
    currentIndex: nextIdx,
    turnsOnBeat: 0,
    shortHoldUsedOnBeat: false,
    completedIds: markCompletedUpTo(nextIdx),
    lastBeatDone: null
  };
}

function interpolateBeatText(template, vars) {
  return String(template || '')
    .replaceAll('{{firstName}}', vars.firstName)
    .replaceAll('{{speaker}}', vars.speakerIdentity)
    .replaceAll('{{companyLabel}}', vars.companyLabel)
    .replaceAll('{{topic}}', vars.topic)
    .replaceAll('{{durationLabel}}', vars.durationLabel);
}

export function renderScriptPacingDirectives(plan, {
  firstName = 'there',
  avatarName = 'the interviewer',
  companyName = '',
  personality = null,
  openerHint = null,
  topic = 'HR',
  targetDurationSeconds = 720,
  compactMode = false
} = {}) {
  const beatIds = plan?.beatIds || [];
  const total = beatIds.length || 1;
  const idx = Math.max(0, Math.min(total - 1, Number(plan?.currentIndex || 0)));
  const beat = SCRIPT_BEAT_MAP[beatIds[idx]] || SCRIPT_BEATS[0];
  const nextBeat = idx + 1 < total ? SCRIPT_BEAT_MAP[beatIds[idx + 1]] : null;
  const phase = stageToLegacyPhase(beat.stage);
  const speakerIdentity = companyName ? `${avatarName} from ${companyName}` : avatarName;
  const companyLabel = companyName || 'our team';
  const durMin = Math.max(5, Math.round((Number(targetDurationSeconds) > 0 ? Number(targetDurationSeconds) : 720) / 60));
  const durationLabel = `${durMin}-minute`;
  const moodDesc = personality?.mood ? ` (${personality.mood})` : '';
  const hintClean = String(openerHint || '').trim();
  const vars = { firstName, speakerIdentity, companyLabel, topic, durationLabel };

  const isLean = compactMode || plan?.complexity === 'lean';
  const basePrompt = interpolateBeatText(isLean ? beat.promptLean : beat.promptRich, vars);

  let startPrompt = '';
  if (idx === 0 && beat.stage === 'arrival') {
    startPrompt = isLean
      ? basePrompt
      : `${basePrompt}\nTone: ${speakerIdentity}${moodDesc}. Keep it 2-3 crisp human sentences.`;
  }

  if (isLean) {
    const holdCue = plan?.turnsOnBeat > 0
      ? ' Stay on this step for 1 quick follow-up.'
      : '';
    const pacingBlock = `STAGE ${idx + 1}/${total} (${beat.label} — ${topic} Scope): ${basePrompt}${holdCue}`;
    return { phase, pacingBlock, startPrompt };
  }

  const lines = [];
  if (Array.isArray(plan?.completedIds) && plan.completedIds.length > 0) {
    const doneLabels = plan.completedIds
      .map((id) => SCRIPT_BEAT_MAP[id]?.label)
      .filter(Boolean);
    if (doneLabels.length > 0) {
      lines.push(`COMPLETED STAGES (already covered — do NOT repeat greetings or intros): ${doneLabels.join(' -> ')}`);
    }
  }

  lines.push(`ACTIVE CONVERSATION BEAT (${idx + 1}/${total} — ${beat.label} · ${topic} Scope):`);
  lines.push(basePrompt);

  if (hintClean && (beat.stage === 'framing' || beat.stage === 'core_anchor')) {
    lines.push(`GENTLE TARGET FOCUS (connect organically inside ${topic} bounds; never ambush cold): "${hintClean}"`);
  }

  if (plan?.turnsOnBeat > 0) {
    lines.push('DEPTH HOLD ACTIVE: Stay on this active beat for one focused follow-up to unpack the missing concrete detail before moving on.');
  }

  if (nextBeat && beat.bridgeOut) {
    const bridgeText = interpolateBeatText(beat.bridgeOut, vars);
    lines.push(`UPCOMING TRANSITION HINT (set up smoothly after their reply -> next: ${nextBeat.label}): ${bridgeText}`);
  }

  return {
    phase,
    pacingBlock: lines.join('\n'),
    startPrompt
  };
}
