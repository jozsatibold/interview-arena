/**
 * Live 60fps Expression, Lip-Sync, Gaze, Listening-Nod, and Posture Driver
 * for Standard SVG interviewer avatars (powered by shared avatar-motion.js).
 */

import { createAvatarMotionState, ensurePointerTracker } from './avatar-motion.js';

const activeSvgLoops = new Map();

export function stopSvgAvatarLoopsExcept(keepSvgs = new Set()) {
  for (const [svg, handle] of activeSvgLoops.entries()) {
    if (!keepSvgs.has(svg)) handle.stop();
  }
}

export function startSvgAvatarLoop(svgEl, stateGetter) {
  if (!svgEl) return;
  ensurePointerTracker();
  const prev = activeSvgLoops.get(svgEl);
  if (prev) prev.stop();

  const headGroup = svgEl.querySelector('.avatar-head-group');
  const torsoGroup = svgEl.querySelector('.avatar-torso');
  const backHairGroup = svgEl.querySelector('.avatar-hair-back');
  const irisL = svgEl.querySelector('.avatar-iris-l');
  const irisR = svgEl.querySelector('.avatar-iris-r');
  const eyesBlink = svgEl.querySelector('.avatar-eyes-blink');
  const browL = svgEl.querySelector('.avatar-brow-l');
  const browR = svgEl.querySelector('.avatar-brow-r');
  const mouthCavity = svgEl.querySelector('.avatar-mouth-cavity');
  const mouthTeeth = svgEl.querySelector('.avatar-mouth-teeth');
  const mouthLip = svgEl.querySelector('.avatar-mouth-lip');
  if (!headGroup || !mouthLip) return;

  const stepMotion = createAvatarMotionState();
  const reducedMotionMq = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
  let cachedRect = null;
  let cachedRectAt = -Infinity;
  let lastTickNow = performance.now();
  let stopped = false;

  const handle = {
    rafId: 0,
    stop() {
      stopped = true;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      document.removeEventListener('visibilitychange', onVisibilityOrMotion);
      window.removeEventListener('resize', invalidateRect);
      reducedMotionMq?.removeEventListener?.('change', onVisibilityOrMotion);
      activeSvgLoops.delete(svgEl);
    }
  };

  function invalidateRect() {
    cachedRectAt = -Infinity;
  }

  function isViewHiddenOrOff() {
    if (document.hidden || !svgEl.isConnected) return true;
    if (svgEl.closest('.spa-view.inactive')) return true;
    if (svgEl.closest('.no-avatar-mode')) return true;
    return false;
  }

  function onVisibilityOrMotion() {
    if (stopped) return;
    if (!document.hidden && !handle.rafId) {
      lastTickNow = performance.now();
      handle.rafId = requestAnimationFrame(tick);
    }
  }

  document.addEventListener('visibilitychange', onVisibilityOrMotion);
  window.addEventListener('resize', invalidateRect, { passive: true });
  reducedMotionMq?.addEventListener?.('change', onVisibilityOrMotion);

  const tick = (now) => {
    handle.rafId = 0;
    if (stopped || !svgEl.isConnected) {
      handle.stop();
      return;
    }
    if (isViewHiddenOrOff()) return;

    const dt = Math.min(0.05, Math.max(0.004, (now - lastTickNow) / 1000));
    lastTickNow = now;
    const reducedMotion = Boolean(reducedMotionMq?.matches);
    const st = stateGetter();
    const mode = st.getMode ? st.getMode() : 'idle';
    const expression = st.getExpression ? st.getExpression() : 'warm';
    const targetViseme = st.getViseme ? st.getViseme(now) : { open: 0, width: 0, round: 0 };

    const m = stepMotion({
      now,
      dt,
      mode,
      expression,
      targetViseme,
      reducedMotion,
      getRect: () => {
        if (!cachedRect || now - cachedRectAt > 250) {
          cachedRect = svgEl.getBoundingClientRect();
          cachedRectAt = now;
        }
        return cachedRect;
      }
    });

    const t = m.timeSec;
    const breathY = Math.sin(t * 1.45) * 1.1;
    const speakRot = mode === 'speaking' ? Math.sin(t * 3.8) * 1.6 : 0;
    const thinkRot = mode === 'thinking' ? -2.2 : 0;
    const idleRot = Math.sin(t * 0.8) * 0.7;
    const totalRot = speakRot + thinkRot + idleRot + (m.exprState.headTiltBias || 0) * 42 + m.nodPitch * 90;
    const headX = m.leanX * 0.65 + m.lookX * 1.8;
    const headY = breathY * 0.7 + m.nodY + m.leanY * 0.55 + m.lookY * 1.2 + (mode === 'speaking' ? Math.sin(t * 5.2) * 0.8 : 0);

    headGroup.setAttribute('transform', `translate(${headX.toFixed(2)} ${headY.toFixed(2)}) rotate(${totalRot.toFixed(2)} 110 146)`);
    if (torsoGroup) {
      torsoGroup.setAttribute('transform', `translate(${(m.leanX * 0.4).toFixed(2)} ${(breathY + m.leanY * 0.45).toFixed(2)}) scale(${m.leanScale.toFixed(4)})`);
    }
    if (backHairGroup) {
      backHairGroup.setAttribute('transform', `translate(${(-m.lookX * 1.5).toFixed(2)} ${(headY - m.lookY * 0.9).toFixed(2)}) rotate(${totalRot.toFixed(2)} 110 146)`);
    }

    // Smooth VOR iris tracking within sclera bounds
    const gx = Math.max(-2.4, Math.min(2.4, m.eyeLookX * 2.3)).toFixed(2);
    const gy = Math.max(-1.6, Math.min(1.6, m.eyeLookY * 1.6)).toFixed(2);
    if (irisL) irisL.setAttribute('transform', `translate(${gx} ${gy})`);
    if (irisR) irisR.setAttribute('transform', `translate(${gx} ${gy})`);

    if (eyesBlink) {
      const sy = Math.max(0.08, 1 - m.blinkAmount * 0.92).toFixed(3);
      eyesBlink.setAttribute('transform', `translate(0 ${(95 * (1 - Number(sy))).toFixed(2)}) scale(1 ${sy})`);
    }

    // Dynamic brows (expression + speaking emphasis)
    if (browL && browR) {
      const es = m.exprState;
      const liftL = ((es.browRaiseL || 0) + m.prosodyBrowLift) * 0.48;
      const liftR = ((es.browRaiseR || 0) + m.prosodyBrowLift) * 0.48;
      const slant = (es.browSlant || 0) * 0.42;
      browL.setAttribute('d', `M79 ${(79 + liftL - slant * 0.4).toFixed(1)} Q89 ${(74.5 + liftL).toFixed(1)} 98 ${(79 + liftL + slant * 0.4).toFixed(1)}`);
      browR.setAttribute('d', `M122 ${(79 + liftR + slant * 0.4).toFixed(1)} Q131 ${(74.5 + liftR).toFixed(1)} 141 ${(79 + liftR - slant * 0.4).toFixed(1)}`);
    }

    // Dynamic 2-axis viseme + expression mouth
    const open = m.viseme.open;
    const width = m.viseme.width || 0;
    const round = m.viseme.round || 0;
    const smile = (st.baseSmile || 0.25) + (m.exprState.smileBias || 0);
    const halfW = Math.max(6.2, Math.min(13.8, (10.2 + smile * 1.8) * (1 + width * 0.24 - round * 0.28)));
    const openPx = open * 9.5;
    const cornerY = 124.5 - (smile * 2.2 + width * 1.6 - round * 0.9);
    const topMidY = 123.8 - open * 0.9;
    const botMidY = 125.2 + openPx;

    if (mouthCavity) {
      if (openPx > 1.2) {
        mouthCavity.setAttribute('d', `M${(110 - halfW * 0.88).toFixed(1)} ${cornerY.toFixed(1)} Q110 ${topMidY.toFixed(1)} ${(110 + halfW * 0.88).toFixed(1)} ${cornerY.toFixed(1)} Q110 ${(botMidY + 1.8).toFixed(1)} ${(110 - halfW * 0.88).toFixed(1)} ${cornerY.toFixed(1)} Z`);
        mouthCavity.style.opacity = '1';
        if (mouthTeeth) {
          mouthTeeth.setAttribute('x', (110 - halfW * 0.62).toFixed(1));
          mouthTeeth.setAttribute('y', (topMidY - 0.3).toFixed(1));
          mouthTeeth.setAttribute('width', (halfW * 1.24).toFixed(1));
          mouthTeeth.setAttribute('height', Math.min(2.6, openPx * 0.34).toFixed(1));
          mouthTeeth.style.opacity = openPx > 2.4 ? '0.95' : '0';
        }
      } else {
        mouthCavity.style.opacity = '0';
        if (mouthTeeth) mouthTeeth.style.opacity = '0';
      }
    }

    mouthLip.setAttribute(
      'd',
      openPx > 1.2
        ? `M${(110 - halfW).toFixed(1)} ${cornerY.toFixed(1)} Q110 ${(botMidY + 2.4).toFixed(1)} ${(110 + halfW).toFixed(1)} ${cornerY.toFixed(1)}`
        : `M${(110 - halfW).toFixed(1)} ${cornerY.toFixed(1)} Q110 ${(125.6 + smile * 3.8).toFixed(1)} ${(110 + halfW).toFixed(1)} ${cornerY.toFixed(1)}`
    );

    if (!reducedMotion && !stopped) {
      handle.rafId = requestAnimationFrame(tick);
    }
  };

  handle.rafId = requestAnimationFrame(tick);
  activeSvgLoops.set(svgEl, handle);
}
