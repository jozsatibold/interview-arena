/**
 * Authentic Meet/Zoom Call UI Controller (`EXP-01`, `EXP-02`, `EXP-06`, `EXP-08`)
 * Manages live call timer, nameplate equalizer, live captions (`CC`), Exam Mode, and Split View.
 */

import { esc } from '../components.js';
import { $, state } from './state.js';
import { formatMmSs } from './scratchpad.js';
import { getAvatarMode } from './avatar.js';

let callTimerInterval = null;
let callStartedAtMs = 0;
let targetDurationSecs = 720;
let captionFadeTimer = null;
let eqRaf = 0;

export function getCallDurationState() {
  const elapsedSeconds = callStartedAtMs > 0 ? Math.max(0, Math.floor((Date.now() - callStartedAtMs) / 1000)) : 0;
  return { elapsedSeconds, targetDurationSeconds: targetDurationSecs };
}

export function startCallElapsedTimer(durationMinutes = 12) {
  stopCallElapsedTimer();
  targetDurationSecs = Math.max(120, Number(durationMinutes || 12) * 60);
  callStartedAtMs = Date.now();
  const render = () => {
    const el = $('#call-elapsed-timer');
    if (!el) return;
    const elapsed = Math.floor((Date.now() - callStartedAtMs) / 1000);
    el.textContent = formatMmSs(elapsed);
    const remaining = targetDurationSecs - elapsed;
    el.classList.toggle('is-wrapping', remaining <= 120);
  };
  render();
  callTimerInterval = setInterval(render, 1000);
}

export function stopCallElapsedTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
  callStartedAtMs = 0;
  const el = $('#call-elapsed-timer');
  if (el) {
    el.textContent = '00:00';
    el.classList.remove('is-wrapping');
  }
}

export function showConnectingOverlay(label = 'Connecting to interviewer...') {
  const el = $('#call-connecting-overlay');
  const txt = $('#call-connecting-label');
  if (txt) txt.textContent = label;
  if (el) {
    el.hidden = false;
    el.classList.remove('is-fading');
  }
}

export function hideConnectingOverlay() {
  const el = $('#call-connecting-overlay');
  if (!el || el.hidden) return;
  el.classList.add('is-fading');
  setTimeout(() => {
    el.hidden = true;
    el.classList.remove('is-fading');
  }, 260);
}

export function updateLiveCaption(speakerLabel, text) {
  const bar = $('#call-cc-bar');
  const enabled = state.user?.showCaptions !== false;
  if (!bar) return;
  if (!enabled || !text) {
    bar.hidden = true;
    return;
  }
  const clean = String(text || '').trim();
  const clipped = clean.length > 165 ? `…${clean.slice(-162)}` : clean;
  bar.innerHTML = `<strong>${esc(speakerLabel)}:</strong> <span>${esc(clipped)}</span>`;
  bar.hidden = false;
  bar.classList.remove('is-fading');
  if (captionFadeTimer) clearTimeout(captionFadeTimer);
  captionFadeTimer = setTimeout(() => {
    bar.classList.add('is-fading');
  }, 4500);
}

export function clearLiveCaption() {
  if (captionFadeTimer) {
    clearTimeout(captionFadeTimer);
    captionFadeTimer = null;
  }
  const bar = $('#call-cc-bar');
  if (bar) {
    bar.hidden = true;
    bar.innerHTML = '';
  }
}

export function syncCaptionsToggleUi() {
  const on = state.user?.showCaptions !== false;
  const btn = $('#btn-toggle-cc');
  if (btn) {
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', String(on));
  }
  if (!on) clearLiveCaption();
}

export function applyExamModeUi(enabled) {
  const isExam = Boolean(enabled);
  if (state.activeSession) state.activeSession.examMode = isExam;
  const overlay = $('#video-tips-overlay');
  if (overlay) overlay.hidden = isExam;
  const pill = $('#exam-mode-pill');
  if (pill) pill.hidden = !isExam;
  const callChk = $('#call-exam-toggle');
  if (callChk) callChk.checked = isExam;
}

export function applyCallLayoutUi(layout = 'spotlight') {
  const resolved = layout === 'split' ? 'split' : 'spotlight';
  const stage = $('#interviewer-stage');
  const btn = $('#btn-toggle-layout');
  if (stage) stage.classList.toggle('is-split-view', resolved === 'split');
  if (btn) {
    btn.classList.toggle('is-active', resolved === 'split');
    btn.setAttribute('aria-pressed', String(resolved === 'split'));
  }
}

export function startNameplateEqualizer(getLipLevel) {
  stopNameplateEqualizer();
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const tick = (now) => {
    const arena = $('#view-arena');
    if (!arena || arena.classList.contains('inactive')) {
      eqRaf = 0;
      return;
    }
    const eqEl = $('#interviewer-eq-bars');
    if (eqEl) {
      const speaking = getAvatarMode() === 'speaking';
      const lvl = speaking ? Math.max(0.18, Math.min(1, getLipLevel(now) || 0.28)) : 0;
      eqEl.classList.toggle('is-active', speaking);
      eqEl.style.setProperty('--eq-level', reducedMotion ? (speaking ? '0.6' : '0') : lvl.toFixed(2));
    }
    const selfEq = $('#self-mic-indicator');
    if (selfEq) {
      selfEq.classList.toggle('is-live', Boolean(state.isListening));
    }
    if (!reducedMotion) eqRaf = requestAnimationFrame(tick);
  };
  eqRaf = requestAnimationFrame(tick);
}

export function stopNameplateEqualizer() {
  if (eqRaf) {
    cancelAnimationFrame(eqRaf);
    eqRaf = 0;
  }
}
