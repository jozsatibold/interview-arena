/**
 * Web Audio Call Immersion, Chimes, Room Tone & Backchannel Cache (`EXP-03`, `EXP-05`)
 */

import { $, state } from './state.js';

let fxCtx = null;
let roomToneNodes = null;
let roomToneWanted = false;
const backchannelCache = new Map();
let activeBackchannelPromise = Promise.resolve();
let activeBackchannelAudio = null;

function ensureFxContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!fxCtx) fxCtx = new Ctx();
  if (fxCtx.state === 'suspended') {
    fxCtx.resume().catch(() => {});
  }
  return fxCtx;
}

function playToneSequence(notes = [], { type = 'sine', peakGain = 0.06 } = {}) {
  try {
    const ctx = ensureFxContext();
    if (!ctx) return;
    let t = ctx.currentTime + 0.01;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(n.freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peakGain, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + n.dur + 0.02);
      t += n.step ?? n.dur * 0.65;
    }
  } catch {}
}

export function playCallJoinChime() {
  playToneSequence(
    [
      { freq: 659.25, dur: 0.18, step: 0.11 }, // E5
      { freq: 987.77, dur: 0.28, step: 0.22 }  // B5
    ],
    { type: 'sine', peakGain: 0.055 }
  );
}

export function playCallLeaveChime() {
  playToneSequence(
    [
      { freq: 440.0, dur: 0.14, step: 0.10 }, // A4
      { freq: 329.63, dur: 0.24, step: 0.20 } // E4
    ],
    { type: 'sine', peakGain: 0.05 }
  );
}

export function playMicCue(isStarting = true) {
  playToneSequence(
    [{ freq: isStarting ? 740 : 520, dur: 0.065, step: 0.065 }],
    { type: 'triangle', peakGain: 0.032 }
  );
}

export function setRoomToneEnabled(enabled) {
  roomToneWanted = Boolean(enabled);
  if (!roomToneWanted) {
    stopRoomTone();
    return;
  }
  if (roomToneNodes) return;
  try {
    const ctx = ensureFxContext();
    if (!ctx) return;
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      ch[i] = lastOut * 2.4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.007, ctx.currentTime + 0.4);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    roomToneNodes = { src, filter, gain };
  } catch {
    roomToneNodes = null;
  }
}

export function stopRoomTone() {
  if (!roomToneNodes) return;
  const nodes = roomToneNodes;
  roomToneNodes = null;
  try {
    nodes.src.stop();
    nodes.src.disconnect();
    nodes.filter.disconnect();
    nodes.gain.disconnect();
  } catch {}
}

const BACKCHANNEL_LINES = {
  warm: ['Mm-hmm, got it.', 'Right, interesting.'],
  curious: ['Mm-hmm, I see.', 'Right, go on.'],
  firm: ['Right.', 'Okay, noted.'],
  skeptical: ['Hmm, okay.', 'Right, let us see.']
};

export function prewarmBackchannels(voice = 'AmericanFemale', mood = 'warm') {
  const engine = state.user?.ttsEngine || $('#tts-engine-select')?.value || 'auto';
  if (engine === 'browser' || !state.setup?.zonosRunning) return;
  const lines = BACKCHANNEL_LINES[mood] || BACKCHANNEL_LINES.warm;
  for (const text of lines) {
    const key = `${voice}:${text}`;
    if (backchannelCache.has(key)) continue;
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice })
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob && blob.size > 0) {
          if (backchannelCache.size > 16) backchannelCache.clear();
          backchannelCache.set(key, blob);
        }
      })
      .catch(() => {});
  }
}

export function stopActiveBackchannel() {
  if (activeBackchannelAudio) {
    try {
      activeBackchannelAudio.pause();
      activeBackchannelAudio.currentTime = 0;
    } catch {}
    activeBackchannelAudio = null;
  }
}

export function awaitBackchannelDone() {
  return activeBackchannelPromise;
}

export function playBackchannelCue(voice = 'AmericanFemale', mood = 'warm') {
  if (!$('#auto-speak-toggle')?.checked) return false;
  const lines = BACKCHANNEL_LINES[mood] || BACKCHANNEL_LINES.warm;
  const cachedBlobs = lines.map((l) => backchannelCache.get(`${voice}:${l}`)).filter(Boolean);
  if (!cachedBlobs.length) return false;

  const blob = cachedBlobs[Math.floor(Math.random() * cachedBlobs.length)];
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = 0.68;
  activeBackchannelAudio = audio;

  activeBackchannelPromise = new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      if (activeBackchannelAudio === audio) activeBackchannelAudio = null;
      resolve();
    };
    audio.addEventListener('ended', done, { once: true });
    audio.addEventListener('error', done, { once: true });
    audio.play().catch(done);
    setTimeout(done, 1600);
  });
  return true;
}
