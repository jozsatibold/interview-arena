import { esc, consumeNdjsonStream, saveUserState } from '../components.js';
import { $, state, getCandidateIdentity, syncCandidateIdentity } from './state.js';
import { getActiveAgentMeta, rollAppearance, inferVoiceGender, renderAvatarVisual, updateAvatarStage, setAvatarState } from './avatar.js';
import { populateZonosVoiceDropdowns, stopAllSpeech, enqueueSpeakSentence, speakEnglish, syncVideoStreams, toggleCamera, stopMediaStream, upsertLiveDraftBubble } from './voice-media.js';
import { setScratchpadOpen, stopLogicTimer, startLogicTimer, renderTutorPin, updateScratchpadSyncPill, renderScratchpadForPuzzle, wireScratchpadEvents } from './scratchpad.js';
import { renderHud, showScorecardDialog, renderStats, renderMistakes } from './stats-shop.js';
import { pickRandomPersonality } from './lobby.js';

let onRefreshViews = () => {};
let onNavigate = () => {};

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
          <button type="button" class="mini-pu-btn btn-hear-fix" title="Hear Senior phrasing">🔊</button>
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
            <button type="button" class="mini-pu-btn btn-hear-fix" title="Hear corrected phrasing">🔊</button>
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
  stopAllSpeech();
  stopLogicTimer();
  const isTutor = cfg.mode === 'tutor';
  const isLogic = cfg.mode === 'logic';
  const isPractice = isTutor || isLogic;
  const meta = isPractice ? null : getActiveAgentMeta(cfg.agentFile);
  const voice = cfg.voice || cfg.tutorTeacher?.voice || meta?.defaultVoice || 'AmericanFemale';
  const personality = isPractice ? null : (cfg.personality || pickRandomPersonality(cfg.topic || meta?.topic || 'HR'));
  const appearance = cfg.appearance || (isPractice
    ? {
        id: cfg.tutorTeacher?.hairStyle || 'layered',
        hairStyle: cfg.tutorTeacher?.hairStyle || 'layered',
        glasses: cfg.tutorTeacher?.glasses || 'none',
        headset: cfg.tutorTeacher?.headset || 'none',
        tie: false,
        hairColor: { hairA: cfg.tutorTeacher?.palette?.hairA, hairB: cfg.tutorTeacher?.palette?.hairB },
        eyeColor: { id: 'warm', iris: cfg.tutorTeacher?.palette?.iris || '#4d6b43', ring: cfg.tutorTeacher?.palette?.ring || '#2d4226' },
        ...(cfg.tutorTeacher?.palette || {}),
        sig: cfg.tutorTeacher?.id || 'tutor'
      }
    : rollAppearance(meta, personality, inferVoiceGender(voice)));

  state.activeSession = {
    mode: isLogic ? 'logic' : isTutor ? 'tutor' : 'interview',
    guestMode: Boolean(cfg.guestMode && isPractice),
    ...cfg,
    voice,
    personality,
    appearance,
    messages: [],
    doubleXpActive: false
  };
  syncCandidateIdentity();
  if ($('#btn-finish-eval')) $('#btn-finish-eval').textContent = isPractice ? '📊 Session Wrap-Up' : '📊 Score (1–10)';
  if ($('#continuous-flow-toggle')) {
    $('#continuous-flow-toggle').checked = isPractice ? true : (cfg.continuous !== undefined ? Boolean(cfg.continuous) : cfg.topic === 'HR');
  }
  populateZonosVoiceDropdowns();
  if ($('#arena-voice-select')) $('#arena-voice-select').value = voice;

  state.unreadChatCount = 0;
  clearRetryPractice();
  setChatDrawerOpen(false);
  if ($('#btn-toggle-scratchpad')) $('#btn-toggle-scratchpad').hidden = !isLogic;
  if (isLogic && cfg.logicPuzzle) {
    renderScratchpadForPuzzle(cfg.logicPuzzle);
    setScratchpadOpen(true);
    startLogicTimer(Number(cfg.logicPuzzle.durationMinutes || 10) * 60);
  } else {
    setScratchpadOpen(false);
    renderTutorPin(null);
  }

  $('#arena-subtitle').textContent = `${cfg.title} • Model: ${state.user.selectedModel}`;
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
  onNavigate('view-arena');

  await sendChatTurn('start');
}

function buildChatRequestPayload({ model, action, continuousFlow, currentPad, padChanged, boardCheckOnly }) {
  const s = state.activeSession;
  const isLogic = s?.mode === 'logic';
  return {
    model,
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
    customInterviewId: s.customInterviewId || null,
    customRoundId: s.customRoundId || null,
    personalityId: s.personality?.id || null,
    topic: s.topic,
    day: s.day,
    messages: s.messages,
    action,
    continuousFlow,
    doubleXpActive: Boolean(s.doubleXpActive)
  };
}

export async function sendChatTurn(action, userText = null, userEntryRef = null, opts = {}) {
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
  sendBtn.disabled = true;
  sendBtn.textContent = 'Thinking...';
  setAvatarState('thinking');

  const continuousFlow = $('#continuous-flow-toggle') ? $('#continuous-flow-toggle').checked : state.activeSession.topic === 'HR';
  const payload = buildChatRequestPayload({ model, action, continuousFlow, currentPad, padChanged, boardCheckOnly: opts?.boardCheckOnly });

  if (action === 'finish') {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      state.user = data.state;
      renderHud();
      const reply = data.reply;
      if (reply.spokenEnglish) {
        appendChatBubble('ai', reply.spokenEnglish);
        state.activeSession.messages.push({ role: 'assistant', content: reply.spokenEnglish });
        speakEnglish(reply.spokenEnglish);
      } else {
        setAvatarState('idle');
      }
      renderCoachFeedback(reply);
      if (reply.scorecard) {
        showScorecardDialog(reply.scorecard, data.xpEarned);
        renderStats();
        renderMistakes();
        onRefreshViews();
      }
    } catch (err) {
      setAvatarState('idle');
      const box = $('#coach-box');
      const errDiv = document.createElement('div');
      errDiv.className = 'coach-pause-card';
      errDiv.innerHTML = `<h4>⚠️ Connection Issue</h4><p>${esc(err.message)}</p>`;
      box.prepend(errDiv);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send ▶';
    }
    return;
  }

  let streamBubble = null;
  let streamBodyEl = null;
  let spokenQueuedUpTo = 0;

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        retryOf: activeRetry ? { said: activeRetry.said, better: activeRetry.better } : null
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    if (action === 'start') $('#coach-box').innerHTML = '';

    let finalDone = null;
    let firstSpeechStarted = false;

    const flushReadySentences = (spokenSoFar, isFinal = false) => {
      if (!$('#auto-speak-toggle').checked) return;
      const unseen = spokenSoFar.slice(spokenQueuedUpTo);
      if (!unseen.trim()) return;
      if (isFinal) {
        spokenQueuedUpTo = spokenSoFar.length;
        enqueueSpeakSentence(unseen, { reset: !firstSpeechStarted });
        firstSpeechStarted = true;
        return;
      }
      const sentenceRe = /([\s\S]+?(?<!\b(?:Ms|Mr|Mrs|Dr|vs|e\.g|i\.e))(?<!\d)[.!?])(?:\s+|$)/g;
      let match;
      let consumed = 0;
      while ((match = sentenceRe.exec(unseen)) !== null) {
        const sentence = match[1].trim();
        consumed = match.index + match[0].length;
        if (sentence.length >= 6) {
          enqueueSpeakSentence(sentence, { reset: !firstSpeechStarted });
          firstSpeechStarted = true;
        }
      }
      if (consumed > 0) spokenQueuedUpTo += consumed;
    };

    await consumeNdjsonStream(res, (evt) => {
      if (evt.type === 'thinking') setAvatarState('thinking');
      else if (evt.type === 'token') {
        if (!streamBubble) {
          streamBubble = appendChatBubble('ai', evt.spokenSoFar || '', 'msg-streaming');
          streamBodyEl = streamBubble.querySelector('.msg-body');
        } else {
          streamBodyEl.textContent = evt.spokenSoFar || '';
          const log = $('#chat-log');
          log.scrollTop = log.scrollHeight;
        }
        flushReadySentences(evt.spokenSoFar || '', false);
      } else if (evt.type === 'done') {
        finalDone = evt;
      }
    });

    if (finalDone) {
      state.user = finalDone.state;
      renderHud();
      if (isLogic) {
        state.lastSentScratchpadText = currentPad;
        updateScratchpadSyncPill();
      }
      if (finalDone.tutorAngle && state.activeSession?.mode === 'tutor') {
        $('#arena-subtitle').textContent = `${state.activeSession?.tutorTeacher?.name || 'Tutor'} · Fresh Topic: ${finalDone.tutorAngle} • Model: ${model}`;
      }
      if (activeRetry?.card?.isConnected) {
        activeRetry.card.classList.add('is-practiced');
        const retryBtn = activeRetry.card.querySelector('.btn-retry-fix');
        if (retryBtn) retryBtn.textContent = '✅ Re-Spoken (+25 XP)';
      }
      const reply = finalDone.reply;
      if (isLogic && reply.scratchpadPin) renderTutorPin(reply.scratchpadPin);
      if (reply.spokenEnglish) {
        if (!streamBubble) streamBubble = appendChatBubble('ai', reply.spokenEnglish);
        else {
          streamBubble.classList.remove('msg-streaming');
          streamBodyEl.textContent = reply.spokenEnglish;
        }
        state.activeSession.messages.push({ role: 'assistant', content: reply.spokenEnglish });
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
    setAvatarState('idle');
    const box = $('#coach-box');
    const errDiv = document.createElement('div');
    errDiv.className = 'coach-pause-card';
    errDiv.innerHTML = `<h4>⚠️ Ollama Connection Issue</h4><p>${esc(err.message)}</p><p>Click <strong>Setup</strong> in the top bar to start Ollama or pull <code>${esc(model)}</code>.</p>`;
    box.prepend(errDiv);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send ▶';
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

  $('#btn-toggle-cam').addEventListener('click', toggleCamera);
  $('#btn-toggle-chat').addEventListener('click', () => setChatDrawerOpen(!state.chatOpen));
  $('#btn-close-chat').addEventListener('click', () => setChatDrawerOpen(false));
  $('#btn-cancel-retry')?.addEventListener('click', clearRetryPractice);

  $('#btn-toggle-tips').addEventListener('click', () => {
    const overlay = $('#video-tips-overlay');
    if (!overlay) return;
    const collapsed = overlay.classList.toggle('is-minimized');
    $('#btn-toggle-tips').textContent = collapsed ? '+' : '−';
    $('#btn-toggle-tips').setAttribute('aria-expanded', String(!collapsed));
  });

  const endCallCleanup = () => {
    stopAllSpeech();
    stopLogicTimer();
    if (state.isListening && state.recognition) {
      state.pendingSendOnMicStop = false;
      try { state.recognition.stop(); } catch {}
    }
    stopMediaStream();
  };

  $('#btn-call-back').addEventListener('click', () => {
    endCallCleanup();
    switchToView('view-path');
  });

  $('#btn-hangup').addEventListener('click', async () => {
    endCallCleanup();
    if (state.activeSession.messages.some((m) => m.role === 'user')) await sendChatTurn('finish');
    switchToView('view-path');
  });

  $('#auto-speak-toggle').addEventListener('change', () => {
    if (!$('#auto-speak-toggle').checked) stopAllSpeech();
    updateAvatarStage();
  });

  $('#continuous-flow-toggle').addEventListener('change', updateAvatarStage);

  $('#arena-voice-select').addEventListener('change', (e) => {
    const zonosVoice = e.target.value;
    state.activeSession.voice = zonosVoice;
    state.user.zonosVoice = zonosVoice;
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
