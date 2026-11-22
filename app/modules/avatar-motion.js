/**
 * Shared Biological Motion, Gaze, Posture, and Listening Reactivity Engine
 * Drives both Standard SVG and Detailed HD Canvas avatars uniformly (zero duplication).
 */

import { EXPRESSION_PRESETS, getExpressionTargets } from '../../shared/expression.mjs';

let pointerTrackerInstalled = false;
let pointerClientX = 0;
let pointerClientY = 0;
let pointerLastMovedMs = -Infinity;

let userMicLevel = 0;
let lastSpeechEnergyMs = -Infinity;
let nextListeningNodAt = 0;
let nodImpulseAt = -Infinity;
let nodAmplitude = 0;

export function ensurePointerTracker() {
  if (pointerTrackerInstalled || typeof window === 'undefined') return;
  pointerTrackerInstalled = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      pointerClientX = e.clientX;
      pointerClientY = e.clientY;
      pointerLastMovedMs = performance.now();
    },
    { passive: true }
  );
}

/**
 * Report live microphone peak (0..1) so both SVG & HD avatars react while the candidate speaks.
 */
export function reportUserMicLevel(peak = 0) {
  const level = Math.max(0, Math.min(1, Number(peak || 0)));
  userMicLevel = userMicLevel * 0.7 + level * 0.3;
  const now = performance.now();
  if (level > 0.065) {
    lastSpeechEnergyMs = now;
    if (now >= nextListeningNodAt) {
      nodImpulseAt = now;
      nodAmplitude = 0.65 + Math.random() * 0.35;
      nextListeningNodAt = now + 2200 + Math.random() * 2000;
    }
  }
}

/**
 * Fallback pulse from WebSpeech interim results when audio analyser is unavailable.
 */
export function pulseUserSpeechActivity() {
  const now = performance.now();
  lastSpeechEnergyMs = now;
  userMicLevel = Math.max(userMicLevel, 0.25);
  if (now >= nextListeningNodAt) {
    nodImpulseAt = now;
    nodAmplitude = 0.75 + Math.random() * 0.25;
    nextListeningNodAt = now + 2400 + Math.random() * 1800;
  }
}

/**
 * Lightweight early expression cue from opening streamed words; overridden by final LLM expression.
 */
export function inferEarlyExpression(spokenSoFar = '', current = 'warm') {
  const txt = String(spokenSoFar || '').trim();
  if (txt.length < 18) return current;
  if (/^(?:ha|haha|love that|oh nice|awesome|that'?s great|glad to hear)/i.test(txt)) return 'amused';
  if (/^(?:wait|hold on|really\?|are you sure|hmm,|interesting claim|let'?s pause)/i.test(txt)) return 'skeptical';
  if (/^(?:actually|to be direct|let'?s stay|let'?s focus|i need to be honest|that'?s outside)/i.test(txt)) return 'firm';
  if (/^(?:why|how did|walk me through|tell me more|curious|what made you)/i.test(txt)) return 'curious';
  return current;
}

export function createAvatarMotionState() {
  let smoothedOpen = 0;
  let smoothedWidth = 0;
  let smoothedRound = 0;
  let smoothedLookX = 0;
  let smoothedLookY = 0;
  let smoothedEyeX = 0;
  let smoothedEyeY = 0;
  let eyeVelX = 0;
  let eyeVelY = 0;
  let fixTargetX = 0;
  let fixTargetY = 0;
  let nextFixAt = performance.now() + 1800;
  let nextBlinkAt = performance.now() + 1800 + Math.random() * 2500;
  let prevMode = 'idle';
  let listeningStartedAt = 0;
  let noteTakingUntilMs = 0;
  let nextNoteEligibleAt = 0;
  let prosodyEnv = 0;
  let leanX = 0;
  let leanY = 0;
  let leanScale = 1;
  const curExpr = { ...EXPRESSION_PRESETS.warm };

  return function stepMotion({ now, dt, mode = 'idle', expression = 'warm', targetViseme = { open: 0, width: 0, round: 0 }, reducedMotion = false, getRect = null }) {
    const openAlpha = targetViseme.open > smoothedOpen ? 0.56 : 0.48;
    smoothedOpen += (targetViseme.open - smoothedOpen) * openAlpha;
    smoothedWidth += ((targetViseme.width || 0) - smoothedWidth) * 0.42;
    smoothedRound += ((targetViseme.round || 0) - smoothedRound) * 0.42;

    // Subtle speaking eyebrow prosody envelope following syllable energy peaks
    const targetProsody = mode === 'speaking' ? Math.max(0, smoothedOpen - 0.18) * 1.15 : 0;
    prosodyEnv += (targetProsody - prosodyEnv) * (reducedMotion ? 1 : 1 - Math.exp(-9 * dt));

    const targetExpr = getExpressionTargets(expression);
    for (const k of Object.keys(curExpr)) {
      curExpr[k] += (targetExpr[k] - curExpr[k]) * (reducedMotion ? 1 : 0.09);
    }

    // Mode transition natural saccade + soft blink
    if (mode !== prevMode) {
      if (mode === 'thinking' && !reducedMotion) {
        noteTakingUntilMs = 0;
        fixTargetX = (Math.random() < 0.7 ? 1 : -1) * (0.28 + Math.random() * 0.22);
        fixTargetY = -(0.2 + Math.random() * 0.18);
        nextFixAt = now + 1100 + Math.random() * 1200;
        nextBlinkAt = Math.min(nextBlinkAt, now + 90);
      } else if (mode === 'listening' && !reducedMotion) {
        listeningStartedAt = now;
        nextNoteEligibleAt = now + 4500 + Math.random() * 3500;
        noteTakingUntilMs = 0;
        fixTargetX = 0.08;
        fixTargetY = 0.04;
        nextFixAt = now + 1400;
      } else {
        noteTakingUntilMs = 0;
      }
      prevMode = mode;
    }

    // Realistic note-taking glance during longer candidate answers (`EXP-05`)
    const isNoteTaking = !reducedMotion && mode === 'listening' && now < noteTakingUntilMs;
    if (!reducedMotion && mode === 'listening' && now - lastSpeechEnergyMs < 1500 && now >= nextNoteEligibleAt && now - listeningStartedAt > 4200) {
      noteTakingUntilMs = now + 1500 + Math.random() * 700;
      nextNoteEligibleAt = noteTakingUntilMs + 6500 + Math.random() * 4500;
      fixTargetX = (Math.random() < 0.5 ? 1 : -1) * (0.20 + Math.random() * 0.08);
      fixTargetY = 0.42 + Math.random() * 0.08;
      nextFixAt = noteTakingUntilMs + 150;
    }

    // Listening nod spring (fired on user speech bursts/pauses during listening)
    let nodY = isNoteTaking ? 2.2 : 0;
    let nodPitch = isNoteTaking ? 0.022 : 0;
    if (!reducedMotion && mode === 'listening') {
      const nodAge = now - nodImpulseAt;
      if (nodAge >= 0 && nodAge < 620) {
        const env = Math.sin((nodAge / 620) * Math.PI);
        const doubleWave = Math.sin((nodAge / 620) * Math.PI * 2.1);
        nodY += env * (2.6 + doubleWave * 0.8) * nodAmplitude;
        nodPitch += env * 0.028 * nodAmplitude;
      }
    }

    // Natural eye fixation + pointer tracking
    let rawTargetX = 0;
    let rawTargetY = 0;
    if (!reducedMotion) {
      if (now - pointerLastMovedMs < 3200 && getRect) {
        const rect = getRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          const nx = (pointerClientX - (rect.left + rect.width * 0.5)) / Math.max(200, rect.width * 0.95);
          const ny = (pointerClientY - (rect.top + rect.height * 0.42)) / Math.max(180, rect.height * 0.95);
          rawTargetX = Math.tanh(nx) * 0.85;
          rawTargetY = Math.tanh(ny) * 0.85;
        }
      } else {
        if (now >= nextFixAt) {
          if (mode === 'thinking') {
            fixTargetX = (Math.random() < 0.7 ? 1 : -1) * (0.26 + Math.random() * 0.24);
            fixTargetY = -(0.2 + Math.random() * 0.2);
            nextFixAt = now + 1100 + Math.random() * 1300;
          } else if (Math.abs(fixTargetX) > 0.1 || Math.abs(fixTargetY) > 0.1) {
            fixTargetX = (Math.random() - 0.5) * 0.08;
            fixTargetY = (Math.random() - 0.5) * 0.06;
            nextFixAt = now + 2100 + Math.random() * 2300;
          } else {
            const recentlySpoke = now - lastSpeechEnergyMs < 2000;
            const towardCam = mode === 'listening' && (recentlySpoke || Math.random() < 0.6);
            fixTargetX = towardCam ? 0.22 + Math.random() * 0.12 : (Math.random() - 0.5) * 0.34;
            fixTargetY = towardCam ? 0.14 + Math.random() * 0.08 : (Math.random() - 0.5) * 0.2;
            nextFixAt = now + 900 + Math.random() * 1100;
          }
        }
        const microDriftX = Math.sin(now * 0.0019) * 0.025 + Math.cos(now * 0.0031) * 0.015;
        const microDriftY = Math.cos(now * 0.0017) * 0.02;
        rawTargetX = fixTargetX + microDriftX;
        rawTargetY = fixTargetY + microDriftY;
      }
    }

    // Critically damped VOR eye spring + slower gentle 2.5D head follow
    const omega = 13.5;
    const damp = Math.exp(-omega * dt);
    const fx = smoothedEyeX - rawTargetX;
    const fy = smoothedEyeY - rawTargetY;
    const tx = (eyeVelX + omega * fx) * dt;
    const ty = (eyeVelY + omega * fy) * dt;
    eyeVelX = (eyeVelX - omega * tx) * damp;
    eyeVelY = (eyeVelY - omega * ty) * damp;
    smoothedEyeX = rawTargetX + (fx + tx) * damp;
    smoothedEyeY = rawTargetY + (fy + ty) * damp;

    const headFollow = 1 - Math.exp(-3.4 * dt);
    smoothedLookX += (smoothedEyeX * 0.72 - smoothedLookX) * headFollow;
    smoothedLookY += (smoothedEyeY * 0.72 - smoothedLookY) * headFollow;

    // Posture lean from live expression & mode
    const exprKey = String(expression || 'warm').toLowerCase();
    const tgtScale = exprKey === 'curious' ? 1.016 : exprKey === 'warm' || exprKey === 'amused' ? 1.008 : exprKey === 'skeptical' || exprKey === 'firm' ? 0.986 : 1;
    const tgtLeanY = mode === 'listening' ? 1.5 : exprKey === 'curious' ? -1.4 : exprKey === 'skeptical' || exprKey === 'firm' ? 1.8 : 0;
    const tgtLeanX = exprKey === 'curious' ? 1.8 : exprKey === 'skeptical' ? -1.6 : 0;
    const leanAlpha = reducedMotion ? 1 : 1 - Math.exp(-3.2 * dt);
    leanScale += (tgtScale - leanScale) * leanAlpha;
    leanX += (tgtLeanX - leanX) * leanAlpha;
    leanY += (tgtLeanY - leanY) * leanAlpha;

    let blinkAmount = 0;
    if (!reducedMotion) {
      const elapsed = now - nextBlinkAt;
      if (elapsed >= 0 && elapsed < 170) {
        blinkAmount = Math.sin((elapsed / 170) * Math.PI);
      } else if (elapsed >= 170) {
        nextBlinkAt = now + 2600 + Math.random() * 3400;
      }
    }

    return {
      viseme: { open: smoothedOpen, width: smoothedWidth, round: smoothedRound },
      exprState: curExpr,
      lookX: smoothedLookX,
      lookY: smoothedLookY,
      eyeLookX: smoothedEyeX,
      eyeLookY: smoothedEyeY,
      blinkAmount,
      nodY,
      nodPitch,
      prosodyBrowLift: prosodyEnv * -2.2,
      leanX,
      leanY,
      leanScale,
      isNoteTaking,
      timeSec: reducedMotion ? 0 : now * 0.001
    };
  };
}
