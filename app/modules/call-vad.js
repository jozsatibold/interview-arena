/**
 * Hands-Free Auto-VAD, Push-to-Talk (`Space`), & Barge-In Turn Controller (`EXP-04`)
 */

import { $, state } from './state.js';
import { playMicCue } from './call-audio.js';

let wired = false;
let spaceHeld = false;
let lastSpeechActivityAt = 0;
let hasSpokenContent = false;
let vadCheckTimer = null;
let autoRestartTimer = null;
let countdownTimer = null;
let countdownStartedAt = 0;
let handsFreePaused = false;
let stopSpeechCb = () => {};

const SILENCE_TRIGGER_MS = 1900;
const AUTO_SEND_GRACE_MS = 550;

export function getMicMode() {
  return ['manual', 'ptt', 'handsfree'].includes(state.user?.micMode) ? state.user.micMode : 'manual';
}

export function isHandsFreePaused() {
  return handsFreePaused;
}

export function setHandsFreePaused(paused) {
  handsFreePaused = Boolean(paused);
  syncMicModeUi();
}

export function syncMicModeUi() {
  const mode = getMicMode();
  const pill = $('#mic-mode-badge');
  if (pill) {
    if (mode === 'handsfree') {
      pill.textContent = handsFreePaused ? '⏸️ Auto-Mic Paused' : '🟢 Hands-Free Auto';
      pill.classList.toggle('is-handsfree', !handsFreePaused);
    } else if (mode === 'ptt') {
      pill.textContent = '⌨️ Hold Space (PTT)';
      pill.classList.remove('is-handsfree');
    } else {
      pill.textContent = '🎙️ Manual Mic';
      pill.classList.remove('is-handsfree');
    }
  }
  const sel = $('#call-mic-mode-select');
  if (sel && sel.value !== mode) sel.value = mode;
}

function clearVadTimers() {
  if (vadCheckTimer) {
    clearTimeout(vadCheckTimer);
    vadCheckTimer = null;
  }
  if (autoRestartTimer) {
    clearTimeout(autoRestartTimer);
    autoRestartTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdownStartedAt = 0;
  const bar = $('#vad-countdown-bar');
  if (bar) {
    bar.hidden = true;
    bar.style.setProperty('--vad-pct', '0%');
  }
}

export function resetVadSession() {
  clearVadTimers();
  spaceHeld = false;
  hasSpokenContent = false;
  handsFreePaused = false;
  lastSpeechActivityAt = 0;
  syncMicModeUi();
}

export function onMicListeningStarted() {
  clearVadTimers();
  hasSpokenContent = false;
  lastSpeechActivityAt = performance.now();
  playMicCue(true);
}

export function onMicListeningEnded() {
  clearVadTimers();
  hasSpokenContent = false;
  playMicCue(false);
}

function triggerAutoSendNow() {
  clearVadTimers();
  if (!state.isListening || !state.recognition) return;
  if (getMicMode() !== 'handsfree' || handsFreePaused) return;
  state.pendingSendOnMicStop = true;
  try {
    state.recognition.stop();
  } catch {}
}

function startCountdownGrace() {
  if (countdownTimer) return;
  countdownStartedAt = performance.now();
  const bar = $('#vad-countdown-bar');
  if (bar) bar.hidden = false;
  countdownTimer = setInterval(() => {
    if (!state.isListening || getMicMode() !== 'handsfree' || handsFreePaused) {
      clearVadTimers();
      return;
    }
    const elapsed = performance.now() - countdownStartedAt;
    const pct = Math.min(100, Math.round((elapsed / AUTO_SEND_GRACE_MS) * 100));
    if (bar) bar.style.setProperty('--vad-pct', `${pct}%`);
    if (elapsed >= AUTO_SEND_GRACE_MS) {
      triggerAutoSendNow();
    }
  }, 50);
}

function scheduleSilenceWatch() {
  if (vadCheckTimer) clearTimeout(vadCheckTimer);
  if (!state.isListening || getMicMode() !== 'handsfree' || handsFreePaused) return;
  vadCheckTimer = setTimeout(() => {
    vadCheckTimer = null;
    if (!state.isListening || !hasSpokenContent) return;
    if (performance.now() - lastSpeechActivityAt >= SILENCE_TRIGGER_MS - 40) {
      startCountdownGrace();
    } else {
      scheduleSilenceWatch();
    }
  }, SILENCE_TRIGGER_MS);
}

export function reportVadSpeechSignal({ peak = 0, transcriptText = null } = {}) {
  if (!state.isListening) return;
  const now = performance.now();
  const hasWords = typeof transcriptText === 'string' && transcriptText.trim().split(/\s+/).filter(Boolean).length >= 2;
  if (hasWords) hasSpokenContent = true;

  if (peak > 0.055 || typeof transcriptText === 'string') {
    lastSpeechActivityAt = now;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      const bar = $('#vad-countdown-bar');
      if (bar) {
        bar.hidden = true;
        bar.style.setProperty('--vad-pct', '0%');
      }
    }
    if (getMicMode() === 'handsfree' && hasSpokenContent && !handsFreePaused) {
      scheduleSilenceWatch();
    }
  }
}

/**
 * Called by drainTtsQueue when the interviewer finishes speaking a turn.
 */
export function notifyInterviewerSpeechFinished({ canAutoListen = true } = {}) {
  if (!canAutoListen || getMicMode() !== 'handsfree' || handsFreePaused) return;
  const arenaEl = $('#view-arena');
  if (!arenaEl || arenaEl.classList.contains('inactive')) return;
  if (state.isListening || !state.recognition) return;
  if (autoRestartTimer) clearTimeout(autoRestartTimer);
  autoRestartTimer = setTimeout(() => {
    autoRestartTimer = null;
    if (getMicMode() !== 'handsfree' || handsFreePaused || state.isListening) return;
    if ($('#view-arena')?.classList.contains('inactive')) return;
    $('#mic-btn')?.click();
  }, 380);
}

export function wireVadKeyboardControls({ onBargeIn = () => {} } = {}) {
  stopSpeechCb = onBargeIn;
  if (wired || typeof window === 'undefined') return;
  wired = true;

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    const arenaEl = $('#view-arena');
    if (!arenaEl || arenaEl.classList.contains('inactive')) return;
    if (e.target?.closest?.('input, textarea, select, button, [contenteditable]')) return;
    if (getMicMode() !== 'ptt') return;

    e.preventDefault();
    if (spaceHeld) return;
    spaceHeld = true;
    stopSpeechCb();
    if (!state.isListening) $('#mic-btn')?.click();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code !== 'Space' || !spaceHeld) return;
    spaceHeld = false;
    if (getMicMode() !== 'ptt') return;
    if (state.isListening && state.recognition) {
      e.preventDefault();
      state.pendingSendOnMicStop = true;
      try {
        state.recognition.stop();
      } catch {}
    }
  });
}
