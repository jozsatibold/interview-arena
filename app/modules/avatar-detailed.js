/**
 * Detailed Realistic 2.5D Studio Portrait Renderer (HTML5 Canvas)
 * Implements multi-pass subsurface skin shading, 2.5D pointer/focus head parallax,
 * live LLM-driven facial expressions, blinking, and hybrid audio/phoneme lip-sync.
 */

import { EXPRESSION_PRESETS, getExpressionTargets } from '../../shared/expression.mjs';
import {
  drawRoundedRectPath,
  hexToRgba,
  resolveHairStyle,
  drawHairBack,
  drawShouldersAndAttire,
  drawHairFrontAndAccessories
} from './avatar-detailed-layers.js';

export { getExpressionTargets };

const activeLoops = new WeakMap();

let pointerTrackerInstalled = false;
let pointerClientX = 0;
let pointerClientY = 0;
let pointerLastMovedMs = -Infinity;

function ensurePointerTracker() {
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

function pickRand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Roll fine-grained anatomical & realism traits for the Detailed character mode.
 */
export function rollDetailedDna(meta = {}, personality = null, gender = 'female') {
  const isMale = gender === 'male';
  const warmOrHumorous =
    /warm|friendly/.test(personality?.traits?.warmth || '') ||
    /witty|playful/.test(personality?.traits?.humor || '');
  return {
    faceWidthScale: 0.95 + Math.random() * 0.1,
    jawTaper: isMale ? 0.91 + Math.random() * 0.08 : 0.85 + Math.random() * 0.08,
    browHeight: -3 + Math.random() * 6,
    lipFullness: isMale ? 0.88 + Math.random() * 0.16 : 0.98 + Math.random() * 0.22,
    noseWidthScale: 0.92 + Math.random() * 0.16,
    facialHair: isMale ? pickRand(['none', 'none', 'stubble', 'trimmed-beard']) : 'none',
    freckles: Math.random() < 0.22,
    earrings: !isMale && Math.random() < 0.55,
    baseSmile: warmOrHumorous ? 0.55 : 0.28,
    hairSeed: Math.floor(Math.random() * 1000)
  };
}

function drawDetailedFaceAndFeatures(ctx, { appearance, palette, skin, dna, blinkAmount, viseme, exprState, lookX = 0, lookY = 0, eyeLookX = lookX, eyeLookY = lookY }) {
  const lipOpen = viseme?.open || 0;
  const lipWidth = viseme?.width || 0;
  const lipRound = viseme?.round || 0;
  const jawDrop = lipOpen * 6.5;
  const es = exprState || EXPRESSION_PRESETS.warm;

  const wScale = dna.faceWidthScale;
  const jawW = 104 * wScale * dna.jawTaper;
  const cheekW = 114 * wScale;

  // Sculpted ears + optional earrings (counter-shifted in 2.5D depth)
  const drawEar = (side) => {
    const ex = 280 + side * cheekW - lookX * 3.0;
    const ey = 246 - lookY * 1.4;
    ctx.fillStyle = side < 0 ? skin.mid : skin.shadow;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 19, 28, side * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(skin.earShadow, 0.65);
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(ex - side * 2, ey, 10, side < 0 ? 1.1 : 4.2, side < 0 ? 4.8 : 1.9);
    ctx.stroke();

    if (dna.earrings) {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(ex + side * 2, ey + 28, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };
  drawEar(-1);
  drawEar(1);

  const headOffX = lookX * 2.2;
  const headOffY = lookY * 1.4;

  // Anatomical skull -> cheekbones -> sculpted chin curve (chin drops subtly with jaw opening)
  const buildHeadPath = () => {
    ctx.beginPath();
    ctx.moveTo(280 + headOffX, 96 + headOffY);
    ctx.bezierCurveTo(280 + headOffX - cheekW * 1.02, 96 + headOffY, 280 + headOffX - cheekW * 1.08, 174 + headOffY, 280 + headOffX - cheekW, 240 + headOffY);
    ctx.bezierCurveTo(280 + headOffX - cheekW * 0.96, 294 + headOffY + jawDrop * 0.35, 280 + headOffX - jawW * 0.62, 344 + headOffY + jawDrop * 0.85, 280 + headOffX, 356 + headOffY + jawDrop);
    ctx.bezierCurveTo(280 + headOffX + jawW * 0.62, 344 + headOffY + jawDrop * 0.85, 280 + headOffX + cheekW * 0.96, 294 + headOffY + jawDrop * 0.35, 280 + headOffX + cheekW, 240 + headOffY);
    ctx.bezierCurveTo(280 + headOffX + cheekW * 1.08, 174 + headOffY, 280 + headOffX + cheekW * 1.02, 96 + headOffY, 280 + headOffX, 96 + headOffY);
    ctx.closePath();
  };

  const skinGrad = ctx.createRadialGradient(238 + headOffX, 176 + headOffY, 18, 284 + headOffX, 232 + headOffY, 185);
  skinGrad.addColorStop(0, skin.light);
  skinGrad.addColorStop(0.62, skin.mid);
  skinGrad.addColorStop(1, skin.shadow);
  ctx.fillStyle = skinGrad;
  buildHeadPath();
  ctx.fill();

  // Subtle warm chin definition stroke (replaces harsh drop shadow that looked like a cut-off neck)
  ctx.strokeStyle = hexToRgba(skin.earShadow, 0.24);
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(280 + headOffX - jawW * 0.44, 337 + headOffY + jawDrop * 0.65);
  ctx.quadraticCurveTo(280 + headOffX, 357 + headOffY + jawDrop, 280 + headOffX + jawW * 0.44, 337 + headOffY + jawDrop * 0.65);
  ctx.stroke();

  // Clip interior skin shading & 2.5D forward facial features inside head contour
  ctx.save();
  buildHeadPath();
  ctx.clip();
  ctx.translate(lookX * 4.8, lookY * 3.1);

  // Soft cool-shadow on far right cheek/jaw + forehead key highlight
  const shadowPass = ctx.createLinearGradient(255, 210, 410, 350);
  shadowPass.addColorStop(0, 'rgba(60, 25, 20, 0)');
  shadowPass.addColorStop(1, 'rgba(48, 22, 18, 0.22)');
  ctx.fillStyle = shadowPass;
  ctx.fillRect(150, 90, 260, 280);

  // Forehead studio highlight sheen
  const foreGrad = ctx.createRadialGradient(248, 152, 6, 248, 152, 58);
  foreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
  foreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = foreGrad;
  ctx.fillRect(180, 100, 150, 110);

  // Subsurface cheek warmth scatter (responds to amused/warm expressions)
  const blushAlpha = Math.max(0.18, Math.min(0.55, 0.32 + es.blushBoost));
  for (const cx of [214, 346]) {
    const blushGrad = ctx.createRadialGradient(cx, 268, 2, cx, 268, 38);
    blushGrad.addColorStop(0, hexToRgba(skin.blush, blushAlpha));
    blushGrad.addColorStop(1, hexToRgba(skin.blush, 0));
    ctx.fillStyle = blushGrad;
    ctx.fillRect(cx - 42, 228, 84, 84);
  }

  // Subtle realistic freckles when rolled
  if (dna.freckles) {
    ctx.fillStyle = hexToRgba(skin.earShadow, 0.38);
    for (const [fx, fy] of [[218, 262], [228, 258], [223, 268], [234, 266], [338, 262], [328, 259], [333, 268], [274, 256], [286, 258]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sculpted nose bridge + tip highlight + ambient nostril shadows
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(278, 224);
  ctx.quadraticCurveTo(276, 250, 278, 267);
  ctx.stroke();

  const nw = 16 * dna.noseWidthScale;
  ctx.fillStyle = hexToRgba(skin.earShadow, 0.36);
  ctx.beginPath();
  ctx.ellipse(280, 275, nw, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(skin.earShadow, 0.62);
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(280 - nw * 0.55, 275, 4.2, 0.2, Math.PI * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(280 + nw * 0.55, 275, 4.2, 0.15, Math.PI * 0.8);
  ctx.stroke();

  // Optional facial hair (stubble / trimmed beard) follows chin jaw drop
  if (dna.facialHair !== 'none') {
    const isFull = dna.facialHair === 'trimmed-beard';
    ctx.fillStyle = hexToRgba(palette.hairB || '#27272a', isFull ? 0.82 : 0.26);
    ctx.beginPath();
    ctx.moveTo(280 - cheekW * 0.94, 258);
    ctx.bezierCurveTo(280 - cheekW * 0.9, 316 + jawDrop * 0.5, 280 - jawW * 0.58, 355 + jawDrop, 280, 360 + jawDrop);
    ctx.bezierCurveTo(280 + jawW * 0.58, 355 + jawDrop, 280 + cheekW * 0.9, 316 + jawDrop * 0.5, 280 + cheekW * 0.94, 258);
    ctx.quadraticCurveTo(280 + cheekW * 0.52, 294, 280 + 38, 290);
    ctx.quadraticCurveTo(280, 284, 280 - 38, 290);
    ctx.quadraticCurveTo(280 - cheekW * 0.52, 294, 280 - cheekW * 0.94, 258);
    ctx.fill();
  }

  // 2-Axis Talking / Expressive Mouth (vertical openness + O-rounding + E-width spread + LLM expression bias)
  const effectiveSmile = dna.baseSmile + es.smileBias;
  const baseMouthW = 29 + effectiveSmile * 4.5;
  const mouthW = Math.max(17, Math.min(41, baseMouthW * (1 + lipWidth * 0.25 - lipRound * 0.30)));
  const openH = lipOpen * 21;
  const upperLift = lipOpen * 2.2;
  const cornerLift = effectiveSmile * 5.8 + lipWidth * 4.5 - lipRound * 2.5;
  const topY = 307 - upperLift;
  const botY = 307 + openH * 0.92;
  const cornerY = 307 - cornerLift * 0.45;
  const lipColor = hexToRgba(skin.blush, 0.78);

  if (openH > 1.5) {
    // Dark inner cavity + clean upper teeth + soft tongue
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(280 - mouthW * 0.94, cornerY);
    ctx.quadraticCurveTo(280, topY + cornerLift * 0.15, 280 + mouthW * 0.94, cornerY);
    ctx.quadraticCurveTo(280, botY + openH * 0.22 + cornerLift * 0.2, 280 - mouthW * 0.94, cornerY);
    ctx.closePath();
    ctx.fillStyle = '#381217';
    ctx.fill();
    ctx.clip();

    if (openH > 4.2) {
      ctx.fillStyle = '#f8fafc';
      drawRoundedRectPath(ctx, 280 - mouthW * 0.72, topY - 1, mouthW * 1.44, Math.min(7.5, openH * 0.42), 3);
      ctx.fill();
    }
    if (openH > 8.5) {
      ctx.fillStyle = '#a24651';
      ctx.beginPath();
      ctx.ellipse(280, botY + 2, mouthW * 0.48, openH * 0.34, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Sculpted Upper Lip (Cupid's bow follows topY)
  ctx.fillStyle = lipColor;
  ctx.beginPath();
  ctx.moveTo(280 - mouthW, cornerY);
  ctx.quadraticCurveTo(280 - mouthW * 0.4, topY - 6.2 * dna.lipFullness, 280, topY - 2.8 * dna.lipFullness);
  ctx.quadraticCurveTo(280 + mouthW * 0.4, topY - 6.2 * dna.lipFullness, 280 + mouthW, cornerY);
  ctx.quadraticCurveTo(280, topY + 2.2, 280 - mouthW, cornerY);
  ctx.fill();

  // Fuller Lower Lip rides flush under botY (bottom edge of mouth opening)
  const lowerThickness = 9.5 * dna.lipFullness + lipRound * 2.5;
  ctx.beginPath();
  ctx.moveTo(280 - mouthW * 0.94, cornerY);
  ctx.quadraticCurveTo(280, botY + lowerThickness + cornerLift * 0.35, 280 + mouthW * 0.94, cornerY);
  ctx.quadraticCurveTo(280, botY + cornerLift * 0.2, 280 - mouthW * 0.94, cornerY);
  ctx.fill();

  // Closed lip seam line draws ONLY when mouth is near-closed (never slices open teeth!)
  if (openH <= 2.4) {
    const seamAlpha = Math.max(0, 0.56 * (1 - openH / 2.4));
    ctx.strokeStyle = `rgba(72, 28, 28, ${seamAlpha.toFixed(2)})`;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(280 - mouthW, cornerY);
    ctx.quadraticCurveTo(280, topY + 3 + cornerLift * 0.45, 280 + mouthW, cornerY);
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba(skin.earShadow, 0.4);
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.arc(280, botY + lowerThickness + 2.5, 11, 0.35, Math.PI - 0.35);
  ctx.stroke();

  // Eyes with anatomical lids, iris fibre depth, & smooth realistic eye-leads-head gaze
  const gazeX = Math.max(-4.8, Math.min(4.8, eyeLookX * 4.6));
  const gazeY = Math.max(-3.0, Math.min(3.0, eyeLookY * 3.0));
  const eyeW = 24;
  const squintScale = Math.max(0.72, Math.min(1.12, 1 - (es.eyeSquint || 0)));
  const eyeH = Math.max(1.2, 16.5 * squintScale * (1 - blinkAmount));
  const irisHex = appearance?.eyeColor?.iris || '#334155';
  const irisRingHex = appearance?.eyeColor?.ring || '#1e293b';

  for (const side of [-1, 1]) {
    const ex = 280 + side * 49;
    const ey = 230;

    // Upper eyelid crease above eye
    ctx.strokeStyle = hexToRgba(skin.earShadow, 0.52);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.92, ey - 10);
    ctx.quadraticCurveTo(ex, ey - 24, ex + eyeW * 0.92, ey - 9);
    ctx.stroke();

    if (blinkAmount > 0.88) {
      ctx.strokeStyle = '#291d18';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW, ey + 2);
      ctx.quadraticCurveTo(ex, ey + 7, ex + eyeW, ey + 2);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ex - eyeW, ey);
      ctx.quadraticCurveTo(ex, ey - eyeH * 1.15, ex + eyeW, ey);
      ctx.quadraticCurveTo(ex, ey + eyeH * 0.98, ex - eyeW, ey);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.clip();

      // Subtle upper sclera lid shadow for 3D eyeball roundness
      const eyeShade = ctx.createLinearGradient(ex, ey - eyeH, ex, ey + eyeH);
      eyeShade.addColorStop(0, 'rgba(30, 41, 59, 0.22)');
      eyeShade.addColorStop(0.38, 'rgba(255, 255, 255, 0)');
      eyeShade.addColorStop(1, 'rgba(30, 41, 59, 0.08)');
      ctx.fillStyle = eyeShade;
      ctx.fillRect(ex - eyeW - 2, ey - eyeH - 2, eyeW * 2 + 4, eyeH * 2 + 4);

      // Detailed Iris + Ring + Pupil + Dual Catchlights
      const ix = ex + gazeX;
      const iy = ey + gazeY;
      const irisGrad = ctx.createRadialGradient(ix - 3, iy - 3, 2, ix, iy, 14.5);
      irisGrad.addColorStop(0, irisHex);
      irisGrad.addColorStop(0.76, irisHex);
      irisGrad.addColorStop(1, irisRingHex);
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(ix, iy, 14.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0b1120';
      ctx.beginPath();
      ctx.arc(ix, iy, 7.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(ix + 4.2, iy - 4.4, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
      ctx.beginPath();
      ctx.arc(ix - 3.8, iy + 3.8, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Natural upper lash line
      ctx.strokeStyle = '#1f1715';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - eyeW, ey);
      ctx.quadraticCurveTo(ex, ey - eyeH * 1.15, ex + eyeW, ey);
      ctx.stroke();
    }

    // Tapered sculptural eyebrow with asymmetric expression lift & tilt
    const baseBrowY = 194 + (dna.browHeight || 0);
    const sideRaise = side < 0 ? (es.browRaiseL || 0) : (es.browRaiseR || 0);
    const browY = baseBrowY + sideRaise;
    const baseTilt = appearance?.browMood === 'focused' ? side * 3.5 : appearance?.browMood === 'flat' ? 0 : -2.5;
    const browTilt = baseTilt + side * (es.browSlant || 0);
    ctx.strokeStyle = palette.hairB || '#2c1c14';
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 23, browY + (side < 0 ? 1 : -1) * (browTilt * 0.4));
    ctx.quadraticCurveTo(ex, browY - 7 + browTilt * 0.3, ex + 23, browY - (side < 0 ? 1 : -1) * (browTilt * 0.4));
    ctx.stroke();
  }

  ctx.restore();
}

export function renderDetailedAvatarFrame(canvas, opts) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const {
    meta,
    gender,
    appearance,
    mode = 'idle',
    viseme = { open: 0, width: 0, round: 0 },
    exprState = EXPRESSION_PRESETS.warm,
    lookX = 0,
    lookY = 0,
    eyeLookX = lookX,
    eyeLookY = lookY,
    blinkAmount = 0,
    timeSec = 0
  } = opts;

  const palette = { ...(meta?.palette || {}), ...(appearance || {}) };
  const skin = appearance?.skinTone || {
    light: '#fff2e8',
    mid: '#f8d5bd',
    shadow: '#dda684',
    earShadow: '#d1926d',
    blush: '#f98597'
  };
  const dna = appearance?.dna || {
    faceWidthScale: 1,
    jawTaper: 0.92,
    browHeight: 0,
    lipFullness: 1,
    noseWidthScale: 1,
    facialHair: 'none',
    freckles: false,
    earrings: false,
    baseSmile: 0.42
  };
  const hairStyle = resolveHairStyle(appearance?.hairStyle || meta?.hairStyle, gender);

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / 560;
  ctx.scale(scale, scale);

  const breathY = Math.sin(timeSec * 1.45) * 2.2;
  const speakTilt = mode === 'speaking' ? Math.sin(timeSec * 3.8) * 0.022 : 0;
  const thinkTilt = mode === 'thinking' ? -0.045 : 0;
  const idleTilt = Math.sin(timeSec * 0.8) * 0.012;
  const headAngle = speakTilt + thinkTilt + idleTilt + (exprState?.headTiltBias || 0);
  const headBobY = breathY * 0.65 + (mode === 'speaking' ? Math.sin(timeSec * 5.2) * 1.8 : 0);

  const hairGrad = ctx.createLinearGradient(170, 68, 390, 260);
  hairGrad.addColorStop(0, palette.hairA || '#4b3123');
  hairGrad.addColorStop(1, palette.hairB || '#22140c');

  // LAYER 1: Hanging back hair counter-shifts in 2.5D depth behind shoulders/neck
  ctx.save();
  ctx.translate(280 - lookX * 5.5, 326 + headBobY - lookY * 3.5);
  ctx.rotate(headAngle);
  ctx.translate(-280, -326);
  drawHairBack(ctx, hairStyle, hairGrad, palette.hairB || '#22140c');
  ctx.restore();

  // LAYER 2: Torso, collar, and neck sit cleanly IN FRONT OF long hanging back hair
  ctx.save();
  ctx.translate(lookX * 1.2, lookY * 0.6);
  drawShouldersAndAttire(ctx, { meta, palette, skin, dna, breathY });
  ctx.restore();

  // LAYER 3: Sculpted face (2.5D parallax), 2-axis mouth, eyes, and front hair / accessories
  ctx.save();
  ctx.translate(280, 326 + headBobY);
  ctx.rotate(headAngle);
  ctx.translate(-280, -326);

  drawDetailedFaceAndFeatures(ctx, { appearance, palette, skin, dna, blinkAmount, viseme, exprState, lookX, lookY, eyeLookX, eyeLookY });
  ctx.save();
  ctx.translate(lookX * 3.8, lookY * 2.5);
  drawHairFrontAndAccessories(ctx, { meta, appearance, palette, style: hairStyle });
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

export function stopDetailedAvatarLoopsExcept(keepContainers = new Set()) {
  // Handled per-canvas via mount checks in active animation ticks
  return keepContainers;
}

/**
 * Attach & drive a 60fps Detailed Studio Avatar Canvas inside a mount container.
 */
export function startDetailedAvatarLoop(canvas, stateGetter) {
  if (!canvas) return;
  ensurePointerTracker();
  const prev = activeLoops.get(canvas);
  if (prev) cancelAnimationFrame(prev.rafId);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.round(560 * dpr);
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }

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
  let lastTickNow = performance.now();
  const curExpr = { ...EXPRESSION_PRESETS.warm };
  let nextBlinkAt = performance.now() + 1800 + Math.random() * 2500;
  const handle = { rafId: 0 };

  const tick = (now) => {
    if (!canvas.isConnected) {
      activeLoops.delete(canvas);
      return;
    }
    const dt = Math.min(0.05, Math.max(0.004, (now - lastTickNow) / 1000));
    lastTickNow = now;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const st = stateGetter();
    const mode = st.getMode ? st.getMode() : 'idle';
    const targetViseme = st.getViseme ? st.getViseme(now) : { open: st.getLipLevel ? st.getLipLevel(now) : 0, width: 0, round: 0 };
    const openAlpha = targetViseme.open > smoothedOpen ? 0.56 : 0.48;
    smoothedOpen += (targetViseme.open - smoothedOpen) * openAlpha;
    smoothedWidth += ((targetViseme.width || 0) - smoothedWidth) * 0.42;
    smoothedRound += ((targetViseme.round || 0) - smoothedRound) * 0.42;

    // Interpolate live LLM facial expression smoothly
    const targetExpr = getExpressionTargets(st.getExpression ? st.getExpression() : 'warm');
    for (const k of Object.keys(curExpr)) {
      curExpr[k] += (targetExpr[k] - curExpr[k]) * (reducedMotion ? 1 : 0.08);
    }

    // Natural eye fixation + VOR eye-leads-head spring dynamics (smooth real gaze, zero abrupt snaps)
    let rawTargetX = 0;
    let rawTargetY = 0;
    if (!reducedMotion) {
      if (now - pointerLastMovedMs < 3200) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const nx = (pointerClientX - (rect.left + rect.width * 0.5)) / Math.max(200, rect.width * 0.95);
          const ny = (pointerClientY - (rect.top + rect.height * 0.42)) / Math.max(180, rect.height * 0.95);
          rawTargetX = Math.tanh(nx) * 0.85;
          rawTargetY = Math.tanh(ny) * 0.85;
        }
      } else {
        if (now >= nextFixAt) {
          if (mode === 'thinking') {
            fixTargetX = (Math.random() < 0.7 ? 1 : -1) * (0.28 + Math.random() * 0.24);
            fixTargetY = -(0.22 + Math.random() * 0.22);
            nextFixAt = now + 1100 + Math.random() * 1400;
          } else if (Math.abs(fixTargetX) > 0.1 || Math.abs(fixTargetY) > 0.1) {
            // Return smoothly to calm direct eye contact with tiny natural fixation offset
            fixTargetX = (Math.random() - 0.5) * 0.08;
            fixTargetY = (Math.random() - 0.5) * 0.06;
            nextFixAt = now + 2200 + Math.random() * 2400;
          } else {
            // Occasional brief natural glance (e.g. caller camera tile bottom-right or slight think glance)
            const towardCam = mode === 'listening' && Math.random() < 0.55;
            fixTargetX = towardCam ? 0.26 + Math.random() * 0.12 : (Math.random() - 0.5) * 0.34;
            fixTargetY = towardCam ? 0.16 + Math.random() * 0.08 : (Math.random() - 0.5) * 0.2;
            nextFixAt = now + 900 + Math.random() * 1100;
          }
        }
        // Subtle biological micro-drift during fixation so irises stay alive without sine swaying
        const microDriftX = Math.sin(now * 0.0019) * 0.025 + Math.cos(now * 0.0031) * 0.015;
        const microDriftY = Math.cos(now * 0.0017) * 0.02;
        rawTargetX = fixTargetX + microDriftX;
        rawTargetY = fixTargetY + microDriftY;
      }
    }

    // Critically damped spring for eyes (leads smoothly) + slower gentle follow for 2.5D head parallax
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

    let blinkAmount = 0;
    if (!reducedMotion) {
      const elapsed = now - nextBlinkAt;
      if (elapsed >= 0 && elapsed < 170) {
        blinkAmount = Math.sin((elapsed / 170) * Math.PI);
      } else if (elapsed >= 170) {
        nextBlinkAt = now + 2600 + Math.random() * 3400;
      }
    }

    renderDetailedAvatarFrame(canvas, {
      meta: st.meta,
      gender: st.gender,
      appearance: st.appearance,
      mode,
      viseme: { open: smoothedOpen, width: smoothedWidth, round: smoothedRound },
      exprState: curExpr,
      lookX: smoothedLookX,
      lookY: smoothedLookY,
      eyeLookX: smoothedEyeX,
      eyeLookY: smoothedEyeY,
      blinkAmount,
      timeSec: reducedMotion ? 0 : now * 0.001
    });
    handle.rafId = requestAnimationFrame(tick);
  };

  handle.rafId = requestAnimationFrame(tick);
  activeLoops.set(canvas, handle);
}
