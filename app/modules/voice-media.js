import { esc, fillSelectOptions } from '../components.js';
import { normalizeInterviewTranscript } from '../../shared/transcript.mjs';
import { buildVisemeTimeline, sampleVisemeTimeline } from '../../shared/viseme.mjs';
import { $, state } from './state.js';
import { getAvatarMode, setAvatarState } from './avatar.js';

let currentAudio = null;
let speakSeqId = 0;
const ttsAbortControllers = new Set();
let ttsQueue = [];
let ttsPlaying = false;
let lipCtx = null;
let lipAnalyser = null;
let lipData = null;
let lipTimeData = null;
let lipAnalyserReadyForEl = false;

let activeSpokenText = '';
let activeTimeline = [];
let activeSpeechStartMs = 0;
let activeEstDurationMs = 2000;
let activeBoundaryChar = 0;
let activeBoundaryMs = 0;
let rmsSlowAvg = 0.045;

function beginUtteranceVisemeTrack(text) {
  activeSpokenText = String(text || '');
  activeTimeline = buildVisemeTimeline(activeSpokenText);
  activeSpeechStartMs = performance.now();
  const wordCount = Math.max(1, activeSpokenText.trim().split(/\s+/).length);
  activeEstDurationMs = Math.max(900, wordCount * 380);
  activeBoundaryChar = 0;
  activeBoundaryMs = activeSpeechStartMs;
  rmsSlowAvg = 0.045;
}

export function getSpeechViseme(timeMs = performance.now()) {
  if (getAvatarMode() !== 'speaking') return { open: 0, width: 0, round: 0 };

  let textProgress = Math.min(0.98, Math.max(0, (timeMs - activeSpeechStartMs) / Math.max(600, activeEstDurationMs)));
  if (currentAudio && !currentAudio.paused) {
    const dur = Number.isFinite(currentAudio.duration) && currentAudio.duration > 0.15
      ? currentAudio.duration
      : activeEstDurationMs / 1000;
    const speechSpan = Math.max(0.25, dur - 0.10);
    textProgress = Math.max(0, Math.min(0.995, (currentAudio.currentTime - 0.04) / speechSpan));
  } else if (activeSpokenText.length > 0 && activeBoundaryChar > 0) {
    const elapsedSinceBoundary = Math.max(0, timeMs - activeBoundaryMs) * 0.014;
    textProgress = Math.max(0, Math.min(0.995, (activeBoundaryChar + elapsedSinceBoundary) / activeSpokenText.length));
  }
  const textV = sampleVisemeTimeline(activeTimeline, textProgress);

  if (lipAnalyser && lipData && lipTimeData && lipAnalyserReadyForEl && currentAudio && !currentAudio.paused) {
    try {
      lipAnalyser.getByteTimeDomainData(lipTimeData);
      let sqSum = 0;
      for (let i = 0; i < lipTimeData.length; i++) {
        const centered = (lipTimeData[i] - 128) / 128;
        sqSum += centered * centered;
      }
      const rms = Math.sqrt(sqSum / lipTimeData.length);
      rmsSlowAvg = rmsSlowAvg * 0.94 + Math.max(0.02, rms) * 0.06;

      // Real silence noise gate + syllable peak contrast ratio
      if (rms < 0.013) return { open: 0, width: 0, round: 0 };
      const audioDrive = Math.max(0, Math.min(1, (rms - 0.013) * 5.6));
      const syllBeat = Math.max(0.45, Math.min(1.45, rms / Math.max(0.022, rmsSlowAvg)));

      lipAnalyser.getByteFrequencyData(lipData);
      let lowSum = 0;
      let highSum = 0;
      for (let i = 1; i <= 7 && i < lipData.length; i++) lowSum += lipData[i];
      for (let i = 8; i <= 22 && i < lipData.length; i++) highSum += lipData[i];
      const lowAvg = lowSum / 7;
      const highAvg = highSum / 15;
      const ratio = (lowAvg + 6) / (highAvg + 10);

      const audioRound = Math.max(0, Math.min(1, (ratio - 1.15) * 0.75));
      const audioWidth = Math.max(-0.5, Math.min(1, (1.15 - ratio) * 0.85));

      // Hybrid blend: real audio gates silence & loudness, while text phoneme forces bilabial M/B/P closures and distinct vowel shapes
      const hybridOpen = textV.close
        ? Math.min(0.04, audioDrive * 0.08)
        : Math.max(0, Math.min(1, (audioDrive * 0.42 + textV.open * audioDrive * 0.78) * syllBeat));
      const shapeAmp = Math.min(1, hybridOpen * 1.35 + 0.1);
      const hybridRound = Math.max(0, Math.min(1, (textV.round * 0.68 + audioRound * 0.32) * shapeAmp));
      const hybridWidth = Math.max(-0.5, Math.min(1, (textV.width * 0.68 + audioWidth * 0.32) * shapeAmp));
      return { open: hybridOpen, width: hybridWidth, round: hybridRound };
    } catch {}
  }

  // Hybrid fallback (Browser SpeechSynthesis / unanalysed audio): word-boundary phoneme timeline * syllable modulation
  const t = timeMs * 0.001;
  const syllMod = 0.68 + 0.32 * Math.max(-0.4, Math.sin(t * 16.5));
  const open = textV.close ? 0 : Math.max(0, Math.min(0.96, textV.open * syllMod));
  return {
    open,
    width: textV.width * Math.min(1, open * 1.25),
    round: textV.round * Math.min(1, open * 1.25)
  };
}

export function getSpeechLipLevel(timeMs = performance.now()) {
  return getSpeechViseme(timeMs).open;
}

function attachLipAnalyser(audioEl) {
  lipAnalyserReadyForEl = false;
  if ((state.user?.avatarQuality || 'standard') !== 'detailed') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!lipCtx) {
      lipCtx = new AudioCtx();
      lipAnalyser = lipCtx.createAnalyser();
      lipAnalyser.fftSize = 256;
      lipAnalyser.smoothingTimeConstant = 0.20;
      lipData = new Uint8Array(lipAnalyser.frequencyBinCount);
      lipTimeData = new Uint8Array(lipAnalyser.fftSize);
      lipAnalyser.connect(lipCtx.destination);
    }
    if (lipCtx.state === 'suspended') lipCtx.resume().catch(() => {});
    const src = lipCtx.createMediaElementSource(audioEl);
    src.connect(lipAnalyser);
    lipAnalyserReadyForEl = true;
  } catch {
    lipAnalyserReadyForEl = false;
  }
}

export function getEnglishVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
}

export function populateVoiceSelect() {
  fillSelectOptions($('#voice-select'), getEnglishVoices(), {
    selectedValue: state.user?.preferredVoice || '',
    getValue: (v) => v.name,
    getLabel: (v) => `${v.name} (${v.lang})`,
    emptyLabel: 'macOS System / Default English Voice'
  });
}

export function populateZonosVoiceDropdowns() {
  const presets = Array.isArray(state.setup?.zonosPresets) && state.setup.zonosPresets.length
    ? state.setup.zonosPresets
    : [
        { key: 'AmericanFemale', label: '♀ American Female (Maya)', gender: 'female' },
        { key: 'BritishFemale', label: '♀ British Female (Elena / Claire)', gender: 'female' },
        { key: 'AmericanMale', label: '♂ American Male (Marcus / Lucas)', gender: 'male' },
        { key: 'BritishMale', label: '♂ British Male (Rupert / Victor)', gender: 'male' }
      ];
  const current = state.activeSession?.voice || state.user?.zonosVoice || 'AmericanFemale';
  for (const sel of [$('#zonos-voice-select'), $('#arena-voice-select'), $('#lobby-voice-select')]) {
    fillSelectOptions(sel, presets, { selectedValue: current, getValue: (p) => p.key, getLabel: (p) => p.label });
  }
}

export function stopAllSpeech() {
  speakSeqId += 1;
  ttsQueue = [];
  ttsPlaying = false;
  activeSpokenText = '';
  activeTimeline = [];
  activeBoundaryChar = 0;
  for (const ac of ttsAbortControllers) {
    try { ac.abort(); } catch {}
  }
  ttsAbortControllers.clear();
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (getAvatarMode() === 'speaking') setAvatarState(state.isListening ? 'listening' : 'idle');
}

function getActiveProsodyMood() {
  if (state.activeSession?.mode === 'tutor' || state.activeSession?.mode === 'logic') return 'warm';
  const vibe = state.activeSession?.personality?.vibe;
  if (vibe === 'bored' || vibe === 'skeptical') return 'calm';
  if (vibe === 'impatient') return 'brisk';
  return 'warm';
}

function fetchTtsAudioPromise(text, voice, mySeq) {
  const engine = state.user?.ttsEngine || $('#tts-engine-select')?.value || 'auto';
  if (engine === 'browser') return Promise.resolve({ fallback: true });

  const ac = new AbortController();
  ttsAbortControllers.add(ac);
  return fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, engine, prosody: getActiveProsodyMood() }),
    signal: ac.signal
  })
    .then(async (res) => {
      ttsAbortControllers.delete(ac);
      if (mySeq !== speakSeqId) return { cancelled: true };
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.startsWith('audio/')) return { blob: await res.blob(), zonos: true };
      return { fallback: true };
    })
    .catch(() => {
      ttsAbortControllers.delete(ac);
      return { fallback: true };
    });
}

function playSingleUtteranceFallback(text, mySeq) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || mySeq !== speakSeqId) return resolve();
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const wanted = state.user?.preferredVoice || $('#voice-select')?.value;
    const picked = getEnglishVoices().find((v) => v.name === wanted) || getEnglishVoices()[0];
    if (picked) utt.voice = picked;
    utt.lang = 'en-US';
    utt.rate = 1.0;
    utt.onstart = () => {
      if (mySeq === speakSeqId) {
        beginUtteranceVisemeTrack(text);
        setAvatarState('speaking', 'browser');
      }
    };
    utt.onboundary = (e) => {
      if (typeof e?.charIndex === 'number') {
        activeBoundaryChar = e.charIndex;
        activeBoundaryMs = performance.now();
      }
    };
    utt.onend = resolve;
    utt.onerror = resolve;
    window.speechSynthesis.speak(utt);
  });
}

async function drainTtsQueue() {
  if (ttsPlaying) return;
  ttsPlaying = true;
  const mySeq = speakSeqId;

  while (ttsQueue.length > 0 && mySeq === speakSeqId) {
    const item = ttsQueue.shift();
    const res = await item.audioPromise;
    if (mySeq !== speakSeqId || res.cancelled) break;

    if (res.blob) {
      await new Promise((resolve) => {
        const url = URL.createObjectURL(res.blob);
        const audio = new Audio(url);
        currentAudio = audio;
        beginUtteranceVisemeTrack(item.text);
        attachLipAnalyser(audio);
        const cleanup = () => {
          URL.revokeObjectURL(url);
          if (currentAudio === audio) currentAudio = null;
          resolve();
        };
        audio.addEventListener('playing', () => {
          if (mySeq === speakSeqId) {
            activeSpeechStartMs = performance.now();
            setAvatarState('speaking', 'zonos');
          }
        }, { once: true });
        audio.addEventListener('ended', cleanup, { once: true });
        audio.addEventListener('error', cleanup, { once: true });
        setAvatarState('speaking', 'zonos');
        audio.play().catch(cleanup);
      });
    } else if (res.fallback) {
      await playSingleUtteranceFallback(item.text, mySeq);
    }
  }

  ttsPlaying = false;
  if (mySeq === speakSeqId && ttsQueue.length === 0) {
    setAvatarState(state.isListening ? 'listening' : 'idle');
  }
}

export function enqueueSpeakSentence(sentence, { reset = false, force = false } = {}) {
  const clean = String(sentence || '').trim();
  if (!clean || (!force && !$('#auto-speak-toggle')?.checked)) return;
  if (state.isListening && state.recognition) {
    state.pendingSendOnMicStop = false;
    try { state.recognition.stop(); } catch {}
  }
  if (reset) stopAllSpeech();
  const mySeq = speakSeqId;
  const voice = state.activeSession?.voice || $('#arena-voice-select')?.value || state.user?.zonosVoice || 'AmericanFemale';
  ttsQueue.push({ text: clean, audioPromise: fetchTtsAudioPromise(clean, voice, mySeq) });
  drainTtsQueue();
}

export async function speakEnglish(text, { force = false } = {}) {
  enqueueSpeakSentence(text, { reset: true, force });
}

export function syncVideoStreams() {
  const hasVideo = Boolean(state.mediaStream && state.camEnabled && state.mediaStream.getVideoTracks().some((t) => t.enabled));
  for (const [vidSel, fbSel] of [['#lobby-video', '#lobby-video-fallback'], ['#call-video', '#call-video-fallback']]) {
    const vid = $(vidSel);
    const fb = $(fbSel);
    if (!vid) continue;
    vid.srcObject = hasVideo ? state.mediaStream : null;
    if (fb) fb.hidden = hasVideo;
  }
  if ($('#btn-toggle-cam')) $('#btn-toggle-cam').textContent = hasVideo ? '📷 Cam Off' : '📷 Cam On';
  if ($('#btn-lobby-toggle-cam')) $('#btn-lobby-toggle-cam').textContent = hasVideo ? '📷 Cam On' : '📷 Cam Off';
}

export function stopMicMeter() {
  if (state.micMeterRaf) {
    cancelAnimationFrame(state.micMeterRaf);
    state.micMeterRaf = null;
  }
  if ($('#lobby-mic-meter')) $('#lobby-mic-meter').style.setProperty('--mic-pct', '0%');
}

export function startMicMeter() {
  stopMicMeter();
  if (!state.mediaStream || !state.mediaStream.getAudioTracks().length) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!state.audioCtx) state.audioCtx = new Ctx();
    const src = state.audioCtx.createMediaStreamSource(state.mediaStream);
    const analyser = state.audioCtx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const track = $('#lobby-mic-meter');

    const loop = () => {
      if (!state.mediaStream || !track) return;
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i] - 128) / 128;
        if (v > peak) peak = v;
      }
      track.style.setProperty('--mic-pct', `${Math.min(100, Math.round(peak * 220))}%`);
      state.micMeterRaf = requestAnimationFrame(loop);
    };
    loop();
  } catch {}
}

export async function ensureMediaStream() {
  if (state.mediaStream) {
    syncVideoStreams();
    startMicMeter();
    return state.mediaStream;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    if ($('#lobby-media-status')) $('#lobby-media-status').textContent = 'Browser media blocked / HTTP fallback';
    syncVideoStreams();
    return null;
  }
  try {
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true
    });
    state.camEnabled = true;
    if ($('#lobby-media-status')) {
      $('#lobby-media-status').textContent = 'Camera & Mic Ready ✅';
      $('#lobby-media-status').className = 'badge badge-green';
    }
    syncVideoStreams();
    startMicMeter();
    return state.mediaStream;
  } catch {
    state.camEnabled = false;
    if ($('#lobby-media-status')) {
      $('#lobby-media-status').textContent = 'Camera off (voice/text ready)';
      $('#lobby-media-status').className = 'badge';
    }
    syncVideoStreams();
    return null;
  }
}

export function toggleCamera() {
  if (!state.mediaStream) {
    ensureMediaStream();
    return;
  }
  state.camEnabled = !state.camEnabled;
  for (const track of state.mediaStream.getVideoTracks()) track.enabled = state.camEnabled;
  syncVideoStreams();
}

export function stopMediaStream() {
  stopMicMeter();
  if (state.mediaStream) {
    for (const t of state.mediaStream.getTracks()) {
      try { t.stop(); } catch {}
    }
    state.mediaStream = null;
  }
  syncVideoStreams();
}

export function upsertLiveDraftBubble(text) {
  const log = $('#chat-log');
  if (!log) return;
  let draft = $('#live-user-draft');
  if (!text) {
    if (draft) draft.remove();
    return;
  }
  if (!draft) {
    draft = document.createElement('div');
    draft.id = 'live-user-draft';
    draft.className = 'msg msg-user msg-draft';
    log.appendChild(draft);
  }
  draft.innerHTML = `<span class="msg-role">You (Speaking Live...)</span><div>${esc(text)}</div>`;
  log.scrollTop = log.scrollHeight;
}

export function initSpeechRecognition(onSubmitTurn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = $('#mic-btn');
  if (!SR || !micBtn) {
    if (micBtn) micBtn.disabled = true;
    if ($('#mic-status')) $('#mic-status').textContent = 'Browser mic STT unavailable here — type in English or use Chrome/Safari.';
    return;
  }
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = true;

  let committed = '';
  let mediaRec = null;
  let audioChunks = [];
  let audioStopPromise = null;

  const startLocalAudioRecorder = () => {
    audioChunks = [];
    audioStopPromise = null;
    if (!state.mediaStream || typeof MediaRecorder === 'undefined') return;
    const audioTracks = state.mediaStream.getAudioTracks();
    if (!audioTracks.length) return;
    try {
      const mr = new MediaRecorder(new MediaStream(audioTracks));
      mr.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) audioChunks.push(ev.data); };
      audioStopPromise = new Promise((resolve) => {
        mr.onstop = () => resolve(new Blob(audioChunks, { type: mr.mimeType || 'audio/webm' }));
      });
      mr.start(250);
      mediaRec = mr;
    } catch {
      mediaRec = null;
    }
  };

  const stopLocalAudioRecorder = async () => {
    if (!mediaRec || mediaRec.state === 'inactive') return null;
    try {
      mediaRec.stop();
      return await audioStopPromise;
    } catch {
      return null;
    } finally {
      mediaRec = null;
    }
  };

  rec.onstart = () => {
    stopAllSpeech();
    state.isListening = true;
    state.pendingSendOnMicStop = false;
    committed = $('#answer-input').value ? $('#answer-input').value + ' ' : '';
    micBtn.classList.add('is-listening');
    micBtn.textContent = '⏹ Done & Send';
    $('#mic-status').textContent = state.setup?.whisperServerRunning
      ? 'Live preview + Whisper Large-v3-Turbo recording — click Done & Send when finished.'
      : 'Speaking live — click "Done & Send" when finished.';
    if ($('#live-stt-bar')) $('#live-stt-bar').hidden = false;
    if ($('#live-stt-text')) $('#live-stt-text').textContent = committed.trim() || 'Listening to your English...';
    setAvatarState('listening');
    startLocalAudioRecorder();

    fetch('/api/warmup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: state.user?.selectedModel || 'qwen3.5:9b' })
    }).catch(() => {});
  };

  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) committed += t + ' ';
      else interim += t;
    }
    const combined = normalizeInterviewTranscript((committed + interim).trim());
    $('#answer-input').value = combined;
    if ($('#live-stt-text')) $('#live-stt-text').textContent = combined || 'Listening...';
    upsertLiveDraftBubble(combined);
  };

  rec.onerror = (ev) => {
    state.pendingSendOnMicStop = false;
    $('#mic-status').textContent = `Mic error: ${ev.error}`;
  };

  rec.onend = async () => {
    state.isListening = false;
    micBtn.classList.remove('is-listening');
    micBtn.textContent = '🎙️ Speak English';
    if ($('#live-stt-bar')) $('#live-stt-bar').hidden = true;
    upsertLiveDraftBubble('');

    const fallbackText = normalizeInterviewTranscript($('#answer-input').value.trim());
    const shouldSend = state.pendingSendOnMicStop;
    state.pendingSendOnMicStop = false;

    const refineRecordingWithWhisper = async (blob, fastTurnRef = null) => {
      if (!blob || blob.size <= 800) return '';
      try {
        const sttRes = await fetch('/api/stt', { method: 'POST', headers: { 'Content-Type': blob.type || 'audio/webm' }, body: blob });
        if (!sttRes.ok) return '';
        const sttData = await sttRes.json();
        const refined = String(sttData.text || '').trim();
        if (refined && fastTurnRef) {
          if (fastTurnRef.msgObj) fastTurnRef.msgObj.content = refined;
          if (fastTurnRef.bubbleBody) fastTurnRef.bubbleBody.textContent = refined;
        }
        return refined;
      } catch {
        return '';
      }
    };

    const wordCount = fallbackText ? fallbackText.split(/\s+/).filter(Boolean).length : 0;
    if (shouldSend && fallbackText && wordCount >= 2) {
      $('#answer-input').value = '';
      $('#mic-status').textContent = '⚡ Responding immediately (Whisper refining in background)...';
      const fastTurnRef = {};
      onSubmitTurn('turn', fallbackText, fastTurnRef);
      stopLocalAudioRecorder().then((blob) => refineRecordingWithWhisper(blob, fastTurnRef));
      return;
    }

    const blob = await stopLocalAudioRecorder();
    let finalText = fallbackText;
    if (shouldSend && blob && blob.size > 800) {
      $('#mic-status').textContent = 'Refining speech with Whisper Large-v3-Turbo...';
      const refined = await refineRecordingWithWhisper(blob);
      if (refined) finalText = refined;
    }

    if (shouldSend && finalText) {
      $('#answer-input').value = '';
      $('#mic-status').textContent = 'Sending your English answer...';
      onSubmitTurn('turn', finalText);
      return;
    }
    if (finalText) $('#answer-input').value = finalText;
    $('#mic-status').textContent = 'Ready — click Speak or type in English.';
    if (getAvatarMode() === 'listening') setAvatarState('idle');
  };

  state.recognition = rec;
  micBtn.addEventListener('click', async () => {
    if (state.isListening) {
      state.pendingSendOnMicStop = true;
      rec.stop();
    } else {
      if (!state.mediaStream?.getAudioTracks()?.length && navigator.mediaDevices?.getUserMedia) {
        try { state.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
      }
      rec.start();
    }
  });
}
