import { esc, consumeNdjsonStream, saveUserState } from '../components.js';
import { pickRandomCompanyName } from '../../shared/company.mjs';
import { computeCallSpeechMetrics } from '../../shared/speech-metrics.mjs';
import { $, state, getCandidateIdentity, syncCandidateIdentity } from './state.js';
import { getActiveAgentMeta, rollAppearance, rollOfficeBackdrop, inferVoiceGender, renderAvatarVisual, updateAvatarStage, setAvatarState } from './avatar.js';
import { rollDetailedDna } from './avatar-detailed.js';
import { inferEarlyExpression } from './avatar-motion.js';
import { populateZonosVoiceDropdowns, stopAllSpeech, enqueueSpeakSentence, speakEnglish, syncVideoStreams, toggleCamera, stopMediaStream, upsertLiveDraftBubble, getSpeechLipLevel } from './voice-media.js';
import { playCallJoinChime, playCallLeaveChime, setRoomToneEnabled, stopRoomTone, prewarmBackchannels, playBackchannelCue } from './call-audio.js';
import { resetVadSession, syncMicModeUi, getMicMode, isHandsFreePaused, setHandsFreePaused } from './call-vad.js';
import {
  startCallElapsedTimer,
  stopCallElapsedTimer,
  getCallDurationState,
  showConnectingOverlay,
  hideConnectingOverlay,
  syncCaptionsToggleUi,
  applyExamModeUi,
  applyCallLayoutUi,
  startNameplateEqualizer,
  stopNameplateEqualizer,
  clearLiveCaption
} from './call-ui.js';
import { renderScreenShareForTopic, setScreenShareOpen, getActiveScreenSharePayload, wireScreenShareEvents } from './screen-share.js';
import { setScratchpadOpen, stopLogicTimer, startLogicTimer, renderTutorPin, updateScratchpadSyncPill, renderScratchpadForPuzzle, wireScratchpadEvents } from './scratchpad.js';
import { renderHud, showScorecardDialog, renderStats, renderMistakes } from './stats-shop.js';
import { pickRandomPersonality } from './lobby.js';

let onRefreshViews = () => {};
let onNavigate = () => {};
let activeSessionSeq = 0;
let activeTurnAbortController = null;
let isTurnInFlight = false;

function clearShieldState() {
  if (state.shieldInterval) {
    clearInterval(state.shieldInterval);
    state.shieldInterval = null;
  }
  if ($('#shield-timer')) $('#shield-timer').hidden = true;
  if ($('#hint-drawer')) $('#hint-drawer').hidden = true;
}

export function endCallCleanup({ withChime = false } = {}) {
  const wasInArena = activeSessionSeq > 0 && !$('#view-arena')?.classList.contains('inactive');
  activeSessionSeq += 1;
  if (activeTurnAbortController) {
    try { activeTurnAbortController.abort(); } catch {}
    activeTurnAbortController = null;
  }
  isTurnInFlight = false;
  stopAllSpeech();
  stopRoomTone();
  if (withChime && wasInArena) playCallLeaveChime();
  stopLogicTimer();
  stopCallElapsedTimer();
  stopNameplateEqualizer();
  clearShieldState();
  clearLiveCaption();
  hideConnectingOverlay();
  resetVadSession();
  setScreenShareOpen(false);
  if (state.isListening && state.recognition) {
    state.pendingSendOnMicStop = false;
    try { state.recognition.stop(); } catch {}
  }
  stopMediaStream();
}

export function setChatDrawerOpen(open) {
  state.chatOpen = Boolean(open);
  const drawer = $('#call-chat-drawer');
  const layout = $('#arena-layout');
  const toggleBtn = $('#btn-toggle-chat');
  const badge = $('#chat-unread-badge');

  if (drawer) drawer.hidden = !state.chatOpen;
  if (layout) layout.classList.toggle('chat-open', state.chatOpen);
  if (toggleBtn) {
    toggleBtn.classList.toggle('is-active', state.chatOpen);
    toggleBtn.setAttribute('aria-expanded', String(state.chatOpen));
  }
  if (state.chatOpen) {
    state.unreadChatCount = 0;
    if (badge) badge.hidden = true;
    const log = $('#chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  }
}

export function appendChatBubble(role, text, extraClass = '') {
  const log = $('#chat-log');
  const div = document.createElement('div');
  div.className = `msg ${role === 'ai' ? 'msg-ai' : 'msg-user'} ${extraClass}`.trim();
  const meta = getActiveAgentMeta();
  const { firstName } = getCandidateIdentity();
  const roleLabel = role === 'ai' ? `${meta.avatarName} (English)` : `You (${firstName})`;
  div.innerHTML = `<span class="msg-role">${esc(roleLabel)}</span><div class="msg-body">${esc(text)}</div>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;

  if (!state.chatOpen && extraClass !== 'msg-draft') {
    state.unreadChatCount += 1;
    const badge = $('#chat-unread-badge');
    if (badge) {
      badge.textContent = String(state.unreadChatCount);
      badge.hidden = false;
    }
  }
  return div;
}

export function clearRetryPractice() {
  state.pendingRetry = null;
  if ($('#live-retry-banner')) $('#live-retry-banner').hidden = true;
  if ($('#live-retry-text')) $('#live-retry-text').textContent = '';
}

function triggerRetryPractice({ said = '', better = '', card = null }) {
  const target = String(better || '').trim();
  if (!target) return;
  stopAllSpeech();
  state.pendingRetry = { said: String(said || ''), better: target, card };
  if ($('#live-retry-text')) $('#live-retry-text').textContent = `"${target}"`;
  if ($('#live-retry-banner')) $('#live-retry-banner').hidden = false;
  if ($('#mic-status')) $('#mic-status').textContent = `🔄 Say it again aloud (+25 XP): "${target}"`;

  if (state.recognition) {
    if (!state.isListening) {
      if ($('#answer-input')) $('#answer-input').value = '';
      $('#mic-btn')?.click();
    }
  } else {
    setChatDrawerOpen(true);
    $('#answer-input')?.focus();
  }
}

function wireCardSpeechActions(card, { said = '', better = '' }) {
  if (!card || !better) return;
  card.querySelector('.btn-hear-fix')?.addEventListener('click', () => speakEnglish(better, { force: true }));
  card.querySelector('.btn-retry-fix')?.addEventListener('click', () => triggerRetryPractice({ said, better, card }));
}

export function renderCoachFeedback(reply) {
  if (state.activeSession?.examMode && reply) {
    const deferred = state.activeSession.deferredCoachItems || (state.activeSession.deferredCoachItems = []);
    if (reply.coachPause) deferred.push({ kind: 'pause', data: reply.coachPause });
    if (Array.isArray(reply.grammarFixes)) {
      for (const fix of reply.grammarFixes) {
        if (fix?.said && fix?.better) deferred.push({ kind: 'fix', data: fix });
      }
    }
    if (reply.microTip || reply.microTipHu) {
      deferred.push({ kind: 'tip', data: reply.microTip || reply.microTipHu });
    }
    return;
  }
  const box = $('#coach-box');
  const overlay = $('#video-tips-overlay');
  if (!box) return;

  const prependCoachCard = (card) => {
    const emptyEl = box.querySelector('.coach-empty');
    if (emptyEl) emptyEl.remove();
    box.prepend(card);
    box.scrollTop = 0;
    if (overlay) {
      overlay.classList.remove('is-minimized');
      if ($('#btn-toggle-tips')) {
        $('#btn-toggle-tips').textContent = '−';
        $('#btn-toggle-tips').setAttribute('aria-expanded', 'true');
      }
    }
  };

  if (reply.coachPause) {
    const p = reply.coachPause;
    const reasonText = p.reason || p.reasonHu || '';
    const firstUpgrade = p.seniorUpgrades?.[0] || '';
    const card = document.createElement('div');
    card.className = 'coach-pause-card coach-popup-enter';
    card.innerHTML = `
      <div class="coach-pause-head">
        <h4>🛑 COACH PAUSE — ${esc(p.category || 'Senior Upgrade')}</h4>
        ${firstUpgrade ? `<div class="coach-pause-actions">
          <button type="button" class="mini-pu-btn btn-hear-fix" title="Hear Senior phrasing" aria-label="Hear Senior phrasing">🔊</button>
          <button type="button" class="mini-pu-btn btn-retry-fix" title="Practice saying this phrasing again (+25 XP)">🔄 Say It Again</button>
        </div>` : ''}
      </div>
      <p><strong>You said:</strong> "${esc(p.original)}"</p>
      <p><strong>Why upgrade:</strong> ${esc(reasonText)}</p>
      <div><strong>Rephrase with C1 Senior impact:</strong></div>
      ${(p.seniorUpgrades || []).map((u, idx) => `<div class="upgrade-option">${idx + 1}. "${esc(u)}"</div>`).join('')}
    `;
    wireCardSpeechActions(card, { said: p.original || '', better: firstUpgrade });
    prependCoachCard(card);
  }

  if (Array.isArray(reply.grammarFixes)) {
    for (const fix of [...reply.grammarFixes].reverse()) {
      if (!fix?.said || !fix?.better) continue;
      const card = document.createElement('div');
      card.className = 'coach-grammar-card coach-popup-enter';
      card.innerHTML = `
        <div class="grammar-card-head">
          <span class="grammar-badge">✏️ ${esc(fix.type || 'Grammar Fix')}</span>
          <div class="grammar-card-actions">
            <button type="button" class="mini-pu-btn btn-hear-fix" title="Hear corrected phrasing" aria-label="Hear corrected phrasing">🔊</button>
            <button type="button" class="mini-pu-btn btn-retry-fix" title="Practice saying this phrasing again (+25 XP)">🔄 Say It Again</button>
          </div>
        </div>
        <p class="grammar-said">❌ "${esc(fix.said)}"</p>
        <p class="grammar-better">✅ "${esc(fix.better)}"</p>
        ${fix.why ? `<small class="grammar-why">${esc(fix.why)}</small>` : ''}
      `;
      wireCardSpeechActions(card, { said: fix.said, better: fix.better });
      prependCoachCard(card);
    }
  }

  if (reply.microTip || reply.microTipHu) {
    const tipText = reply.microTip || reply.microTipHu;
    const card = document.createElement('div');
    card.className = 'coach-tip-card coach-popup-enter';
    card.innerHTML = `<strong>💡 Senior English Tip:</strong><p>${esc(tipText)}</p>`;
    prependCoachCard(card);
  }
}

export async function startSession(cfg) {
  activeSessionSeq += 1;
  if (activeTurnAbortController) {
    try { activeTurnAbortController.abort(); } catch {}
    activeTurnAbortController = null;
  }
  isTurnInFlight = false;
  state.lobbyCfg = null;
  stopAllSpeech();
  stopLogicTimer();
  clearShieldState();
  const isTutor = cfg.mode === 'tutor';
  const isLogic = cfg.mode === 'logic';
  const isPractice = isTutor || isLogic;
  const meta = isPractice ? null : getActiveAgentMeta(cfg.agentFile);
  const voice = cfg.voice || cfg.tutorTeacher?.voice || meta?.defaultVoice || 'AmericanFemale';
  const fixedTutor = state.catalog?.fixedPersonas?.tutor || null;
  const fixedLogic = state.catalog?.fixedPersonas?.logic || null;
  const personality = isLogic
    ? fixedLogic
    : isTutor
      ? fixedTutor
      : (cfg.personality || pickRandomPersonality(cfg.topic || meta?.topic || 'HR'));
  const appearance = cfg.appearance || (isPractice
    ? {
        id: cfg.tutorTeacher?.hairStyle || 'layered',
        hairStyle: cfg.tutorTeacher?.hairStyle || 'layered',
        glasses: cfg.tutorTeacher?.glasses || 'none',
        headset: cfg.tutorTeacher?.headset || 'none',
        tie: false,
        smileMood: 'smile',
        hairColor: { hairA: cfg.tutorTeacher?.palette?.hairA, hairB: cfg.tutorTeacher?.palette?.hairB },
        eyeColor: { id: 'warm', iris: cfg.tutorTeacher?.palette?.iris || '#4d6b43', ring: cfg.tutorTeacher?.palette?.ring || '#2d4226' },
        ...(cfg.tutorTeacher?.palette || {}),
        dna: rollDetailedDna(cfg.tutorTeacher, null, 'female'),
        ...rollOfficeBackdrop(),
        sig: cfg.tutorTeacher?.id || 'tutor'
      }
    : rollAppearance(meta, personality, inferVoiceGender(voice)));

  const interviewerCompany = (!isPractice && !cfg.customInterviewId)
    ? (cfg.interviewerCompany || pickRandomCompanyName(`${state.activeCv?.rawText || ''} ${state.activeCv?.profile?.profilePrompt || ''}`))
    : '';

  const examMode = cfg.examMode !== undefined ? Boolean(cfg.examMode) : Boolean(state.user?.defaultExamMode);
  const durationMinutes = Number(cfg.durationMinutes || state.user?.defaultDurationMinutes || 12);

  state.activeSession = {
    mode: isLogic ? 'logic' : isTutor ? 'tutor' : 'interview',
    guestMode: Boolean(cfg.guestMode && isPractice),
    ...cfg,
    interviewerCompany,
    examMode,
    targetDurationMinutes: durationMinutes,
    liveExpression: 'warm',
    voice,
    personality,
    appearance,
    messages: [],
    deferredCoachItems: [],
    lastTurnInterrupted: false,
    metrics: { userSpeakMs: 0, aiSpeakMs: 0, turnDurationsMs: [] },
    doubleXpActive: false
  };
  syncCandidateIdentity();
  if ($('#btn-finish-eval')) $('#btn-finish-eval').textContent = isPractice ? '📊 Session Wrap-Up' : '📊 Score (1–10)';
  if ($('#continuous-flow-toggle')) {
    $('#continuous-flow-toggle').checked = (isPractice || examMode) ? true : (cfg.continuous !== undefined ? Boolean(cfg.continuous) : cfg.topic === 'HR');
  }
  populateZonosVoiceDropdowns();
  if ($('#arena-voice-select')) $('#arena-voice-select').value = voice;

  state.unreadChatCount = 0;
  clearRetryPractice();
  setChatDrawerOpen(false);
  applyExamModeUi(examMode);
  applyCallLayoutUi(state.user?.defaultLayout || 'spotlight');
  syncCaptionsToggleUi();
  resetVadSession();
  syncMicModeUi();
  if ($('#btn-toggle-scratchpad')) $('#btn-toggle-scratchpad').hidden = !isLogic;
  if (isLogic && cfg.logicPuzzle) {
    renderScratchpadForPuzzle(cfg.logicPuzzle);
    setScratchpadOpen(true);
    setScreenShareOpen(false);
    startLogicTimer(Number(cfg.logicPuzzle.durationMinutes || 10) * 60);
  } else {
    setScratchpadOpen(false);
    renderTutorPin(null);
    renderScreenShareForTopic(cfg.topic);
  }

  $('#arena-subtitle').textContent = `${cfg.title}${interviewerCompany ? ` · ${interviewerCompany}` : ''} • Model: ${state.user.selectedModel}`;
  $('#chat-log').innerHTML = '';
  $('#coach-box').innerHTML = isLogic
    ? (cfg.guestMode
        ? `<div class="coach-empty">🧑 Guest Logic Session with ${esc(cfg.tutorTeacher?.name || 'your partner')}! Write steps on the shared Scratchpad — nothing is read from or saved to the owner account.</div>`
        : `<div class="coach-empty">🧩 Logic Puzzle active with ${esc(cfg.tutorTeacher?.name || 'your partner')}! Use the live Scratchpad on the right — she sees everything you write as you collaborate.</div>`)
    : isTutor
      ? (cfg.guestMode
          ? `<div class="coach-empty">🧑 Guest Practice active with ${esc(cfg.tutorTeacher?.name || 'your tutor')}! Zero personal profile or memory is read or saved.</div>`
          : `<div class="coach-empty">Practice started with ${esc(cfg.tutorTeacher?.name || 'your tutor')}! Grammar corrections + clear "why" explanations appear here while you chat.</div>`)
      : '<div class="coach-empty">Connected! Tips &amp; Senior English upgrades appear here silently.</div>';

  renderAvatarVisual(true);
  setAvatarState('thinking');
  syncVideoStreams();
  const targetPerson = cfg.tutorTeacher?.name || meta?.avatarName || 'Interviewer';
  showConnectingOverlay(`Connecting to ${targetPerson}${interviewerCompany ? ` · ${interviewerCompany}` : ''}...`);
  onNavigate('view-arena');
  startCallElapsedTimer(durationMinutes);
  startNameplateEqualizer(getSpeechLipLevel);
  playCallJoinChime();
  setRoomToneEnabled(Boolean(state.user?.callAmbientAudio));
  prewarmBackchannels(voice, personality?.vibe || 'warm');

  try {
    await sendChatTurn('start');
  } finally {
    hideConnectingOverlay();
  }
}

function buildChatRequestPayload({ model, action, continuousFlow, currentPad, padChanged, boardCheckOnly }) {
  const s = state.activeSession;
  const isLogic = s?.mode === 'logic';
  const dur = getCallDurationState();
  const ss = getActiveScreenSharePayload();
  const interrupted = Boolean(s.lastTurnInterrupted);
  s.lastTurnInterrupted = false;
  return {
    model,
    modelContextTier: state.user?.modelContextTier || 'auto',
    mode: s.mode || 'interview',
    guestMode: Boolean(s.guestMode),
    tutorTeacherId: s.tutorTeacherId || null,
    tutorTopic: s.tutorTopic || '',
    tutorLevel: s.tutorLevel || 'B2-C1',
    logicPuzzleId: s.logicPuzzle?.id || null,
    scratchpadText: currentPad,
    scratchpadChanged: padChanged,
    remainingSeconds: isLogic ? state.logicTimerSeconds : null,
    boardCheckOnly: Boolean(boardCheckOnly),
    agentFile: s.agentFile,
    jdFile: s.jdFile,
    interviewerCompany: s.interviewerCompany || '',
    customInterviewId: s.customInterviewId || null,
    customRoundId: s.customRoundId || null,
    personalityId: s.personality?.id || null,
    personalityTraits: s.mode === 'interview' ? (s.personality?.traits || null) : null,
    topic: s.topic,
    day: s.day,
    targetRoleTrack: state.user?.targetRoleTrack || 'auto',
    messages: s.messages,
    action,
    continuousFlow,
    elapsedSeconds: dur.elapsedSeconds,
    targetDurationSeconds: dur.targetDurationSeconds,
    interrupted,
    screenShareId: ss?.screenShareId || null,
    highlightedLines: ss?.highlightedLines || [],
    artifactNotes: ss?.artifactNotes || '',
    speechMetrics: action === 'finish' ? computeCallSpeechMetrics({ messages: s.messages, ...(s.metrics || {}) }) : null,
    doubleXpActive: Boolean(s.doubleXpActive)
  };
}

export async function sendChatTurn(action, userText = null, userEntryRef = null, opts = {}) {
  if (isTurnInFlight) return;
  const turnSeq = activeSessionSeq;
  const ac = new AbortController();
  activeTurnAbortController = ac;
  isTurnInFlight = true;

  const model = state.user?.selectedModel || 'qwen2.5:7b';
  const isLogic = state.activeSession?.mode === 'logic';
  const currentPad = isLogic ? ($('#scratchpad-editor')?.value || '') : '';
  const padChanged = isLogic ? currentPad !== state.lastSentScratchpadText : false;
  const activeRetry = action === 'turn' && userText ? state.pendingRetry : null;

  if (userText) {
    upsertLiveDraftBubble('');
    clearRetryPractice();
    const bubble = appendChatBubble('user', userText);
    const msgObj = { role: 'user', content: userText };
    state.activeSession.messages.push(msgObj);
    if (userEntryRef) {
      userEntryRef.msgObj = msgObj;
      userEntryRef.bubbleBody = bubble?.querySelector('.msg-body') || null;
    }
  }

  const sendBtn = $('#send-btn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Thinking...';
  }
  if ($('#btn-finish-eval')) $('#btn-finish-eval').disabled = true;
  if (!opts?.silent) setAvatarState('thinking');

  const continuousFlow = $('#continuous-flow-toggle') ? $('#continuous-flow-toggle').checked : state.activeSession.topic === 'HR';
  const payload = buildChatRequestPayload({ model, action, continuousFlow, currentPad, padChanged, boardCheckOnly: opts?.boardCheckOnly });

  if (action === 'finish') {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ac.signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      if (turnSeq !== activeSessionSeq) return;
      state.user = data.state;
      renderHud();
      const reply = data.reply;
      if (reply.spokenEnglish && !opts?.silent) {
        appendChatBubble('ai', reply.spokenEnglish);
        state.activeSession.messages.push({ role: 'assistant', content: reply.spokenEnglish });
        speakEnglish(reply.spokenEnglish);
      } else {
        setAvatarState('idle');
      }
      renderCoachFeedback(reply);
      if (reply.scorecard) {
        showScorecardDialog(reply.scorecard, data.xpEarned, {
          speechMetrics: payload.speechMetrics,
          deferredCoachItems: state.activeSession?.deferredCoachItems || []
        });
        renderStats();
        renderMistakes();
        onRefreshViews();
      }
    } catch (err) {
      if (err?.name === 'AbortError' || turnSeq !== activeSessionSeq) return;
      setAvatarState('idle');
      const box = $('#coach-box');
      const errDiv = document.createElement('div');
      errDiv.className = 'coach-pause-card';
      errDiv.innerHTML = `<h4>⚠️ Connection Issue</h4><p>${esc(err.message)}</p>`;
      box.prepend(errDiv);
    } finally {
      if (activeTurnAbortController === ac) activeTurnAbortController = null;
      isTurnInFlight = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send ▶';
      }
      if ($('#btn-finish-eval')) $('#btn-finish-eval').disabled = false;
    }
    return;
  }

  let streamBubble = null;
  let streamBodyEl = null;
  let spokenQueuedUpTo = 0;
  let streamedAccum = '';
  let receivedFirstToken = false;
  const thinkingCueTimer = setTimeout(() => {
    if (!receivedFirstToken && turnSeq === activeSessionSeq) {
      if ($('#avatar-status-pill')) $('#avatar-status-pill').textContent = '💭 Considering your point...';
      if (action === 'turn' && String(userText || '').trim().split(/\s+/).filter(Boolean).length >= 6) {
        playBackchannelCue(state.activeSession?.voice, state.activeSession?.liveExpression || 'warm');
      }
    }
  }, 1350);

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        retryOf: activeRetry ? { said: activeRetry.said, better: activeRetry.better } : null
      }),
      signal: ac.signal
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    let finalDone = null;
    let firstSpeechStarted = false;

    const flushReadySentences = (spokenSoFar, isFinal = false) => {
      if (turnSeq !== activeSessionSeq) return;
      if (!$('#auto-speak-toggle').checked) return;
      const unseen = spokenSoFar.slice(spokenQueuedUpTo);
      if (!unseen.trim()) return;
      if (isFinal) {
        spokenQueuedUpTo = spokenSoFar.length;
        enqueueSpeakSentence(unseen, { reset: !firstSpeechStarted });
        firstSpeechStarted = true;
        return;
      }
      const sentenceRe = /([\s\S]+?(?<!\b(?:Ms|Mr|Mrs|Dr|vs|e\.g|i\.e))(?<!\d)[.!?])\s+/g;
      let match;
      let consumed = 0;
      let buffered = '';
      while ((match = sentenceRe.exec(unseen)) !== null) {
        const chunkText = match[1].trim();
        const combined = buffered ? `${buffered} ${chunkText}` : chunkText;
        if (combined.length >= 6) {
          consumed = match.index + match[0].length;
          buffered = '';
          enqueueSpeakSentence(combined, { reset: !firstSpeechStarted });
          firstSpeechStarted = true;
        } else {
          buffered = combined;
          consumed = match.index + match[0].length;
        }
      }
      if (consumed > 0 && !buffered) spokenQueuedUpTo += consumed;
    };

    await consumeNdjsonStream(res, (evt) => {
      if (turnSeq !== activeSessionSeq) return;
      if (evt.type === 'error') throw new Error(evt.error || 'Stream error');
      if (evt.type === 'thinking') setAvatarState('thinking');
      else if (evt.type === 'token') {
        if (!receivedFirstToken) {
          receivedFirstToken = true;
          clearTimeout(thinkingCueTimer);
        }
        streamedAccum = evt.spokenSoFar || '';
        if (state.activeSession && streamedAccum.length >= 18) {
          state.activeSession.liveExpression = inferEarlyExpression(streamedAccum, state.activeSession.liveExpression);
        }
        if (!streamBubble) {
          streamBubble = appendChatBubble('ai', streamedAccum, 'msg-streaming');
          streamBodyEl = streamBubble.querySelector('.msg-body');
        } else {
          streamBodyEl.textContent = streamedAccum;
          const log = $('#chat-log');
          log.scrollTop = log.scrollHeight;
        }
        flushReadySentences(streamedAccum, false);
      } else if (evt.type === 'done') {
        clearTimeout(thinkingCueTimer);
        finalDone = evt;
      }
    });

    if (turnSeq !== activeSessionSeq) return;
    if (finalDone) {
      state.user = finalDone.state;
      renderHud();
      if (isLogic) {
        state.lastSentScratchpadText = currentPad;
        updateScratchpadSyncPill();
      }
      if (finalDone.tutorAngle && state.activeSession?.mode === 'tutor') {
        $('#arena-subtitle').textContent = `${state.activeSession?.tutorTeacher?.name || 'Tutor'} · Fresh Topic: ${finalDone.tutorAngle} • Model: ${model}`;
      } else if (finalDone.interviewerCompany && state.activeSession?.mode === 'interview' && !state.activeSession?.customInterviewId) {
        state.activeSession.interviewerCompany = finalDone.interviewerCompany;
        $('#arena-subtitle').textContent = `${state.activeSession.title || state.activeSession.topic} · ${finalDone.interviewerCompany} • Model: ${model}`;
      }
      if (activeRetry?.card?.isConnected) {
        activeRetry.card.classList.add('is-practiced');
        const retryBtn = activeRetry.card.querySelector('.btn-retry-fix');
        if (retryBtn) retryBtn.textContent = '✅ Re-Spoken (+25 XP)';
      }
      const reply = finalDone.reply;
      if (reply?.expression && state.activeSession) {
        state.activeSession.liveExpression = reply.expression;
      }
      if (isLogic && reply.scratchpadPin) renderTutorPin(reply.scratchpadPin);
      if (reply.spokenEnglish) {
        if (!streamBubble) streamBubble = appendChatBubble('ai', reply.spokenEnglish);
        else {
          streamBubble.classList.remove('msg-streaming');
          streamBodyEl.textContent = reply.spokenEnglish;
        }
        state.activeSession.messages.push({ role: 'assistant', content: reply.spokenEnglish });
        if (streamedAccum && reply.spokenEnglish.slice(0, spokenQueuedUpTo) !== streamedAccum.slice(0, spokenQueuedUpTo)) {
          spokenQueuedUpTo = 0;
        }
        flushReadySentences(reply.spokenEnglish, true);
        if (!$('#auto-speak-toggle').checked) setAvatarState('idle');
      } else {
        setAvatarState('idle');
      }
      renderCoachFeedback(reply);
    } else {
      setAvatarState('idle');
    }
  } catch (err) {
    if (err?.name === 'AbortError' || turnSeq !== activeSessionSeq) return;
    setAvatarState('idle');
    const box = $('#coach-box');
    const errDiv = document.createElement('div');
    errDiv.className = 'coach-pause-card';
    errDiv.innerHTML = `<h4>⚠️ Ollama Connection Issue</h4><p>${esc(err.message)}</p><p>Click <strong>Setup</strong> in the top bar to start Ollama or pull <code>${esc(model)}</code>.</p>`;
    box.prepend(errDiv);
  } finally {
    clearTimeout(thinkingCueTimer);
    if (activeTurnAbortController === ac) activeTurnAbortController = null;
    isTurnInFlight = false;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send ▶';
    }
    if ($('#btn-finish-eval')) $('#btn-finish-eval').disabled = false;
  }
}

export async function shareScratchpadWithTutor() {
  if (state.activeSession?.mode !== 'logic') return;
  if ($('#send-btn')?.disabled) return;
  if (!($('#scratchpad-editor')?.value || '').trim()) return;
  await sendChatTurn('turn', '[Shared updated Scratchpad notes with tutor]', null, { boardCheckOnly: true });
}

export function wireArenaEvents({ switchToView, refreshHome }) {
  onNavigate = switchToView;
  onRefreshViews = refreshHome;

  wireScratchpadEvents(shareScratchpadWithTutor);
  wireScreenShareEvents();

  $('#btn-toggle-cam').addEventListener('click', toggleCamera);
  $('#btn-toggle-chat').addEventListener('click', () => setChatDrawerOpen(!state.chatOpen));
  $('#btn-close-chat').addEventListener('click', () => setChatDrawerOpen(false));
  $('#btn-cancel-retry')?.addEventListener('click', clearRetryPractice);

  $('#btn-toggle-cc')?.addEventListener('click', () => {
    if (!state.user) return;
    state.user.showCaptions = state.user.showCaptions === false;
    syncCaptionsToggleUi();
    saveUserState({ showCaptions: state.user.showCaptions }).catch(() => {});
  });

  $('#btn-toggle-layout')?.addEventListener('click', () => {
    if (!state.user) return;
    const nextLayout = state.user.defaultLayout === 'split' ? 'spotlight' : 'split';
    state.user.defaultLayout = nextLayout;
    applyCallLayoutUi(nextLayout);
    saveUserState({ defaultLayout: nextLayout }).catch(() => {});
  });

  $('#call-exam-toggle')?.addEventListener('change', (e) => {
    applyExamModeUi(Boolean(e.target.checked));
    $('#call-more-popover')?.hidePopover?.();
  });

  $('#call-ambient-toggle')?.addEventListener('change', (e) => {
    const enabled = Boolean(e.target.checked);
    if (state.user) state.user.callAmbientAudio = enabled;
    setRoomToneEnabled(enabled);
    saveUserState({ callAmbientAudio: enabled }).catch(() => {});
  });

  $('#call-mic-mode-select')?.addEventListener('change', (e) => {
    const nextMode = e.target.value;
    if (state.user) state.user.micMode = nextMode;
    syncMicModeUi();
    saveUserState({ micMode: nextMode }).catch(() => {});
  });

  $('#mic-mode-badge')?.addEventListener('click', () => {
    if (getMicMode() === 'handsfree') {
      setHandsFreePaused(!isHandsFreePaused());
    }
  });

  $('#btn-toggle-tips').addEventListener('click', () => {
    const overlay = $('#video-tips-overlay');
    if (!overlay) return;
    const collapsed = overlay.classList.toggle('is-minimized');
    $('#btn-toggle-tips').textContent = collapsed ? '+' : '−';
    $('#btn-toggle-tips').setAttribute('aria-expanded', String(!collapsed));
  });

  $('#btn-call-back').addEventListener('click', () => {
    $('#call-more-popover')?.hidePopover?.();
    endCallCleanup();
    switchToView('view-path');
  });

  $('#btn-hangup').addEventListener('click', async () => {
    const hadUserTurns = Boolean(state.activeSession?.messages?.some((m) => m.role === 'user'));
    const btn = $('#btn-hangup');
    if (btn) btn.disabled = true;
    try {
      endCallCleanup({ withChime: true });
      if (hadUserTurns) await sendChatTurn('finish', null, null, { silent: true });
      switchToView('view-path');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  $('#auto-speak-toggle').addEventListener('change', () => {
    if (!$('#auto-speak-toggle').checked) stopAllSpeech();
    updateAvatarStage();
  });

  $('#continuous-flow-toggle').addEventListener('change', updateAvatarStage);

  $('#arena-voice-select').addEventListener('change', (e) => {
    const zonosVoice = e.target.value;
    const prevGender = inferVoiceGender(state.activeSession?.voice);
    const nextGender = inferVoiceGender(zonosVoice);
    if (state.activeSession) {
      state.activeSession.voice = zonosVoice;
      if (prevGender !== nextGender && state.activeSession.appearance) {
        const meta = getActiveAgentMeta(state.activeSession.agentFile);
        state.activeSession.appearance.dna = rollDetailedDna(meta, state.activeSession.personality, nextGender);
      }
    }
    if (state.user) state.user.zonosVoice = zonosVoice;
    if ($('#zonos-voice-select')) $('#zonos-voice-select').value = zonosVoice;
    updateAvatarStage();
    saveUserState({ zonosVoice }).catch(() => {});
  });

  $('#send-btn').addEventListener('click', () => {
    const text = $('#answer-input').value.trim();
    if (!text) return;
    $('#answer-input').value = '';
    sendChatTurn('turn', text);
  });

  $('#answer-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      $('#send-btn').click();
    }
  });

  $('#btn-finish-eval').addEventListener('click', () => sendChatTurn('finish'));
}
