import { esc, fillSelectOptions } from '../components.js';
import { normalizeInterviewTranscript } from '../../shared/transcript.mjs';
import { buildVisemeTimeline, sampleVisemeTimeline } from '../../shared/viseme.mjs';
import { $, state } from './state.js';
import { getAvatarMode, getActiveAgentMeta, setAvatarState } from './avatar.js';
import { reportUserMicLevel, pulseUserSpeechActivity } from './avatar-motion.js';
import { awaitBackchannelDone, stopActiveBackchannel } from './call-audio.js';
import { onMicListeningStarted, onMicListeningEnded, reportVadSpeechSignal, notifyInterviewerSpeechFinished, wireVadKeyboardControls } from './call-vad.js';
import { updateLiveCaption } from './call-ui.js';

let currentAudio = null;
let activeAudioCancel = null;
let activeUtterance = null;
let speakSeqId = 0;
let activeDrainSeq = 0;
const ttsAbortControllers = new Set();
let ttsQueue = [];
let lipCtx = null;
let lipAnalyser = null;
let lipData = null;
let lipTimeData = null;
let lipAnalyserReadyForEl = false;
let micMeterSrc = null;
let micMeterAnalyser = null;

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

async function attachLipAnalyser(audioEl) {
  lipAnalyserReadyForEl = false;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!lipCtx) {
      lipCtx = new AudioCtx();
      lipAnalyser = lipCtx.createAnalyser();
      lipAnalyser.fftSize = 256;
      lipAnalyser.smoothingTimeConstant = 0.20;
      lipData = new Uint8Array(lipAnalyser.frequencyBinCount);
      lipTimeData = new Uint8Array(lipAnalyser.fftSize);
      lipAnalyser.connect(lipCtx.destination);
    }
    if (lipCtx.state === 'suspended') {
      await lipCtx.resume().catch(() => {});
    }
    if (lipCtx.state !== 'running') return null;
    const src = lipCtx.createMediaElementSource(audioEl);
    src.connect(lipAnalyser);
    lipAnalyserReadyForEl = true;
    return src;
  } catch {
    lipAnalyserReadyForEl = false;
    return null;
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
  activeDrainSeq = 0;
  stopActiveBackchannel();
  activeSpokenText = '';
  activeTimeline = [];
  activeBoundaryChar = 0;
  activeUtterance = null;
  for (const ac of ttsAbortControllers) {
    try { ac.abort(); } catch {}
  }
  ttsAbortControllers.clear();
  if (activeAudioCancel) {
    const cancel = activeAudioCancel;
    activeAudioCancel = null;
    cancel();
  } else if (currentAudio) {
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
    .catch((err) => {
      ttsAbortControllers.delete(ac);
      if (err?.name === 'AbortError' || mySeq !== speakSeqId) return { cancelled: true };
      return { fallback: true };
    });
}

function playSingleUtteranceFallback(text, mySeq) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || mySeq !== speakSeqId) return resolve();
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    activeUtterance = utt;
    const wanted = state.user?.preferredVoice || $('#voice-select')?.value;
    const picked = getEnglishVoices().find((v) => v.name === wanted) || getEnglishVoices()[0];
    if (picked) utt.voice = picked;
    utt.lang = 'en-US';
    utt.rate = 1.0;
    let settled = false;
    let startedAt = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      if (startedAt && state.activeSession?.metrics) {
        state.activeSession.metrics.aiSpeakMs += Math.max(0, performance.now() - startedAt);
      }
      if (activeUtterance === utt) activeUtterance = null;
      resolve();
    };
    const safetyTimer = setTimeout(finish, Math.max(8000, text.length * 140));
    utt.onstart = () => {
      if (mySeq === speakSeqId) {
        startedAt = performance.now();
        beginUtteranceVisemeTrack(text);
        setAvatarState('speaking', 'browser');
        const speakerName = state.activeSession?.tutorTeacher?.name || getActiveAgentMeta(state.activeSession?.agentFile)?.avatarName || 'Interviewer';
        updateLiveCaption(speakerName, text);
      }
    };
    utt.onboundary = (e) => {
      if (typeof e?.charIndex === 'number') {
        activeBoundaryChar = e.charIndex;
        activeBoundaryMs = performance.now();
      }
    };
    utt.onend = finish;
    utt.onerror = finish;
    window.speechSynthesis.speak(utt);
  });
}

async function drainTtsQueue() {
  const mySeq = speakSeqId;
  if (activeDrainSeq === mySeq) return;
  activeDrainSeq = mySeq;

  await awaitBackchannelDone();
  let spokeInQueue = false;
  while (ttsQueue.length > 0 && mySeq === speakSeqId) {
    const item = ttsQueue.shift();
    const res = await item.audioPromise;
    if (mySeq !== speakSeqId || res.cancelled) break;

    if (res.blob) {
      spokeInQueue = true;
      await new Promise((resolve) => {
        const url = URL.createObjectURL(res.blob);
        const audio = new Audio(url);
        currentAudio = audio;
        beginUtteranceVisemeTrack(item.text);
        let sourceNode = null;
        let done = false;
        let playStartedAt = 0;
        const cleanup = () => {
          if (done) return;
          done = true;
          if (playStartedAt && state.activeSession?.metrics) {
            state.activeSession.metrics.aiSpeakMs += Math.max(0, performance.now() - playStartedAt);
          }
          if (activeAudioCancel === cleanup) activeAudioCancel = null;
          try { audio.pause(); audio.currentTime = 0; } catch {}
          try { sourceNode?.disconnect(); } catch {}
          URL.revokeObjectURL(url);
          if (currentAudio === audio) currentAudio = null;
          lipAnalyserReadyForEl = false;
          resolve();
        };
        activeAudioCancel = cleanup;
        audio.addEventListener('playing', () => {
          if (mySeq === speakSeqId) {
            playStartedAt = performance.now();
            activeSpeechStartMs = playStartedAt;
            setAvatarState('speaking', 'zonos');
            const speakerName = state.activeSession?.tutorTeacher?.name || getActiveAgentMeta(state.activeSession?.agentFile)?.avatarName || 'Interviewer';
            updateLiveCaption(speakerName, item.text);
          }
        }, { once: true });
        audio.addEventListener('ended', cleanup, { once: true });
        audio.addEventListener('error', cleanup, { once: true });
        attachLipAnalyser(audio).then((src) => {
          if (done) {
            try { src?.disconnect(); } catch {}
            return;
          }
          sourceNode = src;
          setAvatarState('speaking', 'zonos');
          audio.play().catch(cleanup);
        });
      });
    } else if (res.fallback) {
      spokeInQueue = true;
      await playSingleUtteranceFallback(item.text, mySeq);
    }
  }

  if (activeDrainSeq === mySeq) activeDrainSeq = 0;
  if (mySeq === speakSeqId && ttsQueue.length === 0) {
    setAvatarState(state.isListening ? 'listening' : 'idle');
    if (spokeInQueue) {
      notifyInterviewerSpeechFinished({ canAutoListen: Boolean(state.activeSession && $('#auto-speak-toggle')?.checked) });
    }
  }
}

export function enqueueSpeakSentence(sentence, { reset = false, force = false, voice = '' } = {}) {
  const clean = String(sentence || '').trim();
  if (!clean || (!force && !$('#auto-speak-toggle')?.checked)) return;
  if (state.isListening && state.recognition) {
    state.pendingSendOnMicStop = false;
    try { state.recognition.stop(); } catch {}
  }
  if (reset) stopAllSpeech();
  const mySeq = speakSeqId;
  const chosenVoice = voice || state.activeSession?.voice || $('#arena-voice-select')?.value || state.user?.zonosVoice || 'AmericanFemale';
  ttsQueue.push({ text: clean, audioPromise: fetchTtsAudioPromise(clean, chosenVoice, mySeq) });
  drainTtsQueue();
}

export async function speakEnglish(text, { force = false, voice = '' } = {}) {
  enqueueSpeakSentence(text, { reset: true, force, voice });
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
  const label = hasVideo ? '📷 Turn Cam Off' : '📷 Turn Cam On';
  for (const id of ['#btn-toggle-cam', '#btn-lobby-toggle-cam']) {
    const el = $(id);
    if (el) {
      el.textContent = label;
      el.setAttribute('aria-pressed', String(hasVideo));
    }
  }
}

export function stopMicMeter() {
  if (state.micMeterRaf) {
    cancelAnimationFrame(state.micMeterRaf);
    state.micMeterRaf = null;
  }
  try { micMeterSrc?.disconnect(); } catch {}
  try { micMeterAnalyser?.disconnect(); } catch {}
  micMeterSrc = null;
  micMeterAnalyser = null;
  const meter = $('#lobby-mic-meter');
  if (meter) {
    meter.style.setProperty('--mic-pct', '0%');
    meter.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', '0');
  }
}

export function startMicMeter() {
  stopMicMeter();
  if (!state.mediaStream || !state.mediaStream.getAudioTracks().some((t) => t.readyState === 'live')) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!state.audioCtx) state.audioCtx = new Ctx();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(() => {});
    const src = state.audioCtx.createMediaStreamSource(state.mediaStream);
    const analyser = state.audioCtx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    micMeterSrc = src;
    micMeterAnalyser = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const track = $('#lobby-mic-meter');
    const bar = track?.closest('[role="progressbar"]');

    const loop = () => {
      if (!state.mediaStream || !track) return;
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i] - 128) / 128;
        if (v > peak) peak = v;
      }
      reportUserMicLevel(peak);
      reportVadSpeechSignal({ peak });
      const pct = Math.min(100, Math.round(peak * 220));
      track.style.setProperty('--mic-pct', `${pct}%`);
      if (bar) bar.setAttribute('aria-valuenow', String(pct));
      state.micMeterRaf = requestAnimationFrame(loop);
    };
    loop();
  } catch {}
}

export async function ensureMediaStream() {
  const hasLiveAudio = state.mediaStream?.getAudioTracks?.().some((t) => t.readyState === 'live');
  if (state.mediaStream && hasLiveAudio) {
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
    try {
      state.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.camEnabled = false;
      if ($('#lobby-media-status')) {
        $('#lobby-media-status').textContent = 'Mic Ready (Camera off)';
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
  let micStarting = false;
  let lastMicError = '';
  let micTurnStartedAt = 0;

  const startLocalAudioRecorder = () => {
    if (mediaRec && mediaRec.state !== 'inactive') {
      try { mediaRec.stop(); } catch {}
    }
    mediaRec = null;
    audioChunks = [];
    audioStopPromise = null;
    if (!state.mediaStream || typeof MediaRecorder === 'undefined') return;
    const audioTracks = state.mediaStream.getAudioTracks().filter((t) => t.readyState === 'live');
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
    const interruptedSpeaker = getAvatarMode() === 'speaking';
    if (interruptedSpeaker && state.activeSession) {
      state.activeSession.lastTurnInterrupted = true;
    }
    stopAllSpeech();
    micStarting = false;
    micTurnStartedAt = performance.now();
    lastMicError = '';
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
    onMicListeningStarted();
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
    const mode = state.activeSession?.mode || 'interview';
    const combined = normalizeInterviewTranscript((committed + interim).trim(), { mode });
    pulseUserSpeechActivity();
    reportVadSpeechSignal({ transcriptText: combined });
    updateLiveCaption('You', combined);
    $('#answer-input').value = combined;
    if ($('#live-stt-text')) $('#live-stt-text').textContent = combined || 'Listening...';
    upsertLiveDraftBubble(combined);
  };

  rec.onerror = (ev) => {
    micStarting = false;
    state.pendingSendOnMicStop = false;
    onMicListeningEnded();
    lastMicError = `Mic error: ${ev.error}`;
    $('#mic-status').textContent = lastMicError;
  };

  rec.onend = async () => {
    micStarting = false;
    state.isListening = false;
    onMicListeningEnded();
    if (micTurnStartedAt > 0 && state.activeSession?.metrics) {
      const dur = Math.max(0, performance.now() - micTurnStartedAt);
      state.activeSession.metrics.userSpeakMs += dur;
      if (dur >= 800) state.activeSession.metrics.turnDurationsMs.push(dur);
    }
    micTurnStartedAt = 0;
    micBtn.classList.remove('is-listening');
    micBtn.textContent = '🎙️ Speak English';
    if ($('#live-stt-bar')) $('#live-stt-bar').hidden = true;
    upsertLiveDraftBubble('');

    const mode = state.activeSession?.mode || 'interview';
    const fallbackText = normalizeInterviewTranscript($('#answer-input').value.trim(), { mode });
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
      Promise.resolve(onSubmitTurn('turn', fallbackText, fastTurnRef)).finally(() => {
        if (!state.isListening) $('#mic-status').textContent = 'Ready — click Speak or type in English.';
      });
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
      Promise.resolve(onSubmitTurn('turn', finalText)).finally(() => {
        if (!state.isListening) $('#mic-status').textContent = 'Ready — click Speak or type in English.';
      });
      return;
    }
    if (finalText) $('#answer-input').value = finalText;
    $('#mic-status').textContent = lastMicError || 'Ready — click Speak or type in English.';
    if (getAvatarMode() === 'listening') setAvatarState('idle');
  };

  state.recognition = rec;
  wireVadKeyboardControls({
    onBargeIn: () => {
      if (getAvatarMode() === 'speaking') {
        if (state.activeSession) state.activeSession.lastTurnInterrupted = true;
        stopAllSpeech();
      }
    }
  });
  micBtn.addEventListener('click', async () => {
    if (state.isListening) {
      state.pendingSendOnMicStop = true;
      try { rec.stop(); } catch {}
    } else if (!micStarting) {
      micStarting = true;
      lastMicError = '';
      if (!state.mediaStream?.getAudioTracks()?.some((t) => t.readyState === 'live') && navigator.mediaDevices?.getUserMedia) {
        try { state.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
      }
      try {
        rec.start();
      } catch (err) {
        micStarting = false;
        $('#mic-status').textContent = `Mic error: ${err?.message || 'busy'}`;
      }
    }
  });
}
