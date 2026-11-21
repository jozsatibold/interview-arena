import { esc, fillSelectOptions } from '../components.js';
import { $, state, getCandidateIdentity, syncCandidateIdentity } from './state.js';
import { getActiveAgentMeta, rollAppearance, renderAvatarVisual } from './avatar.js';
import { populateZonosVoiceDropdowns, stopAllSpeech, speakEnglish, ensureMediaStream, toggleCamera, stopMicMeter, stopMediaStream } from './voice-media.js';

export function formatSimpleMdToHtml(mdText) {
  const lines = String(mdText || '').split('\n');
  let html = '';
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('### ')) {
      closeList();
      html += `<h5>${inline(line.slice(4))}</h5>`;
    } else if (line.startsWith('## ')) {
      closeList();
      html += `<h4>${inline(line.slice(3))}</h4>`;
    } else if (line.startsWith('# ')) {
      closeList();
      html += `<h4>${inline(line.slice(2))}</h4>`;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${inline(line.slice(2))}</li>`;
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return `<div class="lobby-jd-md">${html}</div>`;
}

export function buildJdBriefHtml({ jdObj = null, dayStep = null, customPack = null, customRound = null } = {}) {
  const parts = [];
  if (dayStep?.focus) {
    parts.push(`<div class="lobby-day-focus"><strong>🎯 Day ${esc(dayStep.day)} Drill Objective (${esc(dayStep.title)}):</strong> ${esc(dayStep.focus)}</div>`);
  }
  if (customPack) {
    const stackHtml = (customPack.fitSummary?.keyStack || []).map((s) => `<span class="stack-pill">${esc(s)}</span>`).join('');
    parts.push(`<div><strong>${esc(customPack.roleTitle)}</strong> @ <strong>${esc(customPack.company)}</strong></div>`);
    if (customRound?.focus) parts.push(`<div class="lobby-day-focus"><strong>🎯 Current Round (${esc(customRound.topic)}):</strong> ${esc(customRound.focus)}</div>`);
    if (stackHtml) parts.push(`<div class="stack-pills">${stackHtml}</div>`);
    parts.push(formatSimpleMdToHtml(customPack.jdText || ''));
    return parts.join('');
  }
  if (!jdObj) return '';
  if (jdObj.summary || jdObj.responsibilities?.length) {
    const stackHtml = (jdObj.stack || []).map((s) => `<span class="stack-pill">${esc(s)}</span>`).join('');
    const respHtml = (jdObj.responsibilities || []).map((r) => `<li>${esc(r)}</li>`).join('');
    const reqHtml = (jdObj.requirements || []).map((r) => `<li>${esc(r)}</li>`).join('');
    parts.push(`<div><strong>${esc(jdObj.roleTitle || jdObj.title)}</strong> @ <strong>${esc(jdObj.company || 'Target Company')}</strong> ${jdObj.compensation ? `· <span class="badge badge-green">${esc(jdObj.compensation)}</span>` : ''}</div>`);
    if (jdObj.summary) parts.push(`<p style="margin:0;">${esc(jdObj.summary)}</p>`);
    if (stackHtml) parts.push(`<div class="stack-pills">${stackHtml}</div>`);
    if (respHtml) parts.push(`<div><strong>Responsibilities:</strong><ul>${respHtml}</ul></div>`);
    if (reqHtml) parts.push(`<div><strong>Requirements:</strong><ul>${reqHtml}</ul></div>`);
  } else {
    parts.push(formatSimpleMdToHtml(jdObj.content || ''));
  }
  return parts.join('');
}

function renderLobbyJobDescription(cfg) {
  const bodyEl = $('#lobby-jd-body');
  const badgeEl = $('#lobby-jd-badge');
  if (!bodyEl) return;

  if (cfg?.customInterviewId) {
    const pack = (state.customInterviews || []).find((c) => c.id === cfg.customInterviewId);
    const round = (pack?.rounds || []).find((r) => r.id === cfg.customRoundId) || null;
    if (badgeEl) badgeEl.textContent = pack ? `${pack.company} · ${pack.roleTitle}` : 'Custom Target JD';
    bodyEl.innerHTML = buildJdBriefHtml({ customPack: pack, customRound: round }) || '<p class="muted">Custom job description attached.</p>';
    return;
  }

  const jds = state.catalog?.jobDescriptions || [];
  const jdObj = jds.find((j) => j.id === cfg?.jdFile) || jds[0] || null;
  const dayStep = cfg?.day ? (state.catalog?.morningPath || []).find((d) => Number(d.day) === Number(cfg.day)) : null;
  if (badgeEl) badgeEl.textContent = jdObj?.company ? `${jdObj.company} (${jdObj.compensation || 'Target Role'})` : (jdObj?.title || 'Target Role');
  bodyEl.innerHTML = buildJdBriefHtml({ jdObj, dayStep }) || '<p class="muted">No job description available.</p>';
}

export function stopLobbyMicTest() {
  if (state.lobbyTestRec && state.lobbyTestingMic) {
    try { state.lobbyTestRec.stop(); } catch {}
  }
  state.lobbyTestingMic = false;
  if ($('#btn-lobby-test-mic')) {
    $('#btn-lobby-test-mic').classList.remove('is-listening');
    $('#btn-lobby-test-mic').textContent = '🎙️ Test Mic (English STT)';
  }
}

export function getTopicPersonalities(topic = 'HR') {
  const byTopic = state.catalog?.personalitiesByTopic || {};
  return byTopic[topic] || byTopic.HR || [];
}

function synthesizePersonalityFromTraits(traitOverrides = null, meta = {}) {
  const dims = state.catalog?.personalityDimensions || [];
  if (!dims.length) return null;
  const traits = {};
  const traitDetails = [];
  let tipParts = [];

  for (const dim of dims) {
    const opts = dim.options || [];
    const wanted = traitOverrides?.[dim.key];
    const chosen = (wanted && opts.find((o) => o.id === wanted)) || opts[Math.floor(Math.random() * opts.length)];
    if (!chosen) continue;
    traits[dim.key] = chosen.id;
    traitDetails.push({ key: dim.key, category: dim.label, emoji: dim.emoji, id: chosen.id, label: chosen.label, hint: chosen.hint });
    if (dim.key === 'patience' || dim.key === 'focusLens') tipParts.push(chosen.tip || chosen.hint);
  }

  const warmthLabel = traitDetails.find((t) => t.key === 'warmth')?.label || 'Polite';
  const patienceLabel = traitDetails.find((t) => t.key === 'patience')?.label || 'Balanced';
  const vibe = /Warm|Friendly/.test(warmthLabel) ? 'warm' : 'creative';
  return {
    id: meta.id || 'rolled-10d',
    emoji: meta.emoji || '🎲',
    label: meta.label || `${warmthLabel} · ${patienceLabel}`,
    mood: meta.mood || `${warmthLabel}, ${patienceLabel.toLowerCase()} (10 randomized moderate traits)`,
    trapHint: meta.trapHint || tipParts.filter(Boolean).join(' '),
    vibe,
    traits,
    traitDetails
  };
}

export function pickRandomPersonality(topic = 'HR', excludeId = null) {
  const rolled = synthesizePersonalityFromTraits(null, { id: 'rolled-10d' });
  if (rolled) return rolled;
  const pool = getTopicPersonalities(topic);
  if (pool.length === 0) return null;
  const candidates = excludeId && pool.length > 1 ? pool.filter((p) => p.id !== excludeId) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function renderLobbyTraitGrid(personality) {
  const container = $('#lobby-personality-traits');
  if (!container) return;
  const dims = state.catalog?.personalityDimensions || [];
  const traits = personality?.traits || {};
  if (!dims.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = dims
    .map((dim) => {
      const opt = (dim.options || []).find((o) => o.id === traits[dim.key]) || dim.options?.[0];
      return `<button type="button" class="lobby-trait-chip" data-trait-key="${esc(dim.key)}" title="${esc(dim.label)}: ${esc(opt?.hint || '')} (Click to cycle)">
        <span class="lobby-trait-cat">${esc(dim.emoji)} ${esc(dim.label)}</span>
        <span class="lobby-trait-val">${esc(opt?.label || '')}</span>
      </button>`;
    })
    .join('');

  container.querySelectorAll('.lobby-trait-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.traitKey;
      const cur = state.lobbyCfg?.personality || state.activeSession?.personality;
      const dim = dims.find((d) => d.key === key);
      if (!dim?.options?.length) return;
      const curIdx = dim.options.findIndex((o) => o.id === cur?.traits?.[key]);
      const nextOpt = dim.options[(curIdx + 1) % dim.options.length];
      const nextPersonality = synthesizePersonalityFromTraits({ ...(cur?.traits || {}), [key]: nextOpt.id }, { id: 'rolled-10d' });
      if (nextPersonality) applyLobbyPersonality(nextPersonality);
    });
  });
}

export function applyLobbyPersonality(personality) {
  if (!personality) return;
  const meta = getActiveAgentMeta(state.lobbyCfg?.agentFile || state.activeSession?.agentFile);
  const voiceKey = state.lobbyCfg?.voice || meta.defaultVoice;
  const engine = state.user?.ttsEngine || $('#tts-engine-select')?.value || 'auto';
  const gender = engine !== 'browser' && /male/i.test(voiceKey) && !/female/i.test(voiceKey) ? 'male' : (meta.gender || 'female');
  const appearance = rollAppearance(meta, personality, gender);
  if (state.lobbyCfg) {
    state.lobbyCfg.personality = personality;
    state.lobbyCfg.appearance = appearance;
  }
  if (state.activeSession) {
    state.activeSession.personality = personality;
    state.activeSession.appearance = appearance;
  }
  if ($('#lobby-personality-select')) {
    $('#lobby-personality-select').value = personality.id || 'rolled-10d';
  }
  renderLobbyTraitGrid(personality);
  if ($('#lobby-personality-tip')) {
    $('#lobby-personality-tip').textContent = `${personality.emoji} ${personality.label} · Hair: ${appearance.hairStyle}, Eyes: ${appearance.eyeColor?.id}. Tip: ${personality.trapHint}`;
  }
  renderAvatarVisual(true);
}

export async function openLobby(cfg, switchToView) {
  stopAllSpeech();
  const meta = getActiveAgentMeta(cfg.agentFile);
  const presetVoice = meta.defaultVoice || 'AmericanFemale';
  const topic = cfg.topic || meta.topic || 'HR';
  const rolledPersonality = pickRandomPersonality(topic);

  state.lobbyCfg = { ...cfg, topic, voice: presetVoice, personality: rolledPersonality };
  state.activeSession = {
    mode: 'interview',
    guestMode: false,
    ...cfg,
    topic,
    voice: presetVoice,
    personality: rolledPersonality,
    messages: [],
    doubleXpActive: false
  };
  syncCandidateIdentity();
  if ($('#btn-finish-eval')) $('#btn-finish-eval').textContent = '📊 Score (1–10)';

  if ($('#lobby-voice-select')) {
    populateZonosVoiceDropdowns();
    $('#lobby-voice-select').value = presetVoice;
  }
  const personalityOptions = [
    { id: 'rolled-10d', emoji: '🎲', label: 'Random 10-Trait Roll', mood: 'Fresh moderate human blend' },
    ...getTopicPersonalities(topic)
  ];
  fillSelectOptions($('#lobby-personality-select'), personalityOptions, {
    selectedValue: rolledPersonality?.id || 'rolled-10d',
    getValue: (p) => p.id,
    getLabel: (p) => `${p.emoji} ${p.label} — ${p.mood}`
  });
  applyLobbyPersonality(rolledPersonality);

  if ($('#lobby-continuous-toggle')) {
    $('#lobby-continuous-toggle').checked = topic === 'HR' ? true : state.user?.defaultContinuousFlow !== false;
  }
  $('#lobby-role-badge').textContent = `${meta.code} · ${meta.topic}`;
  $('#lobby-voice-badge').textContent = `Voice: ${presetVoice}`;
  $('#lobby-avatar-name').textContent = `${meta.avatarName} · ${meta.title}`;
  $('#lobby-avatar-desc').textContent = `Unique persona & pre-assigned voice for "${cfg.title}"`;
  $('#lobby-stt-preview').textContent = 'Click Test Mic & say hello in English...';

  renderLobbyJobDescription(cfg);
  renderAvatarVisual(true);
  switchToView('view-lobby');

  fetch('/api/warmup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: state.user?.selectedModel || 'qwen3.5:9b' })
  }).catch(() => {});

  await ensureMediaStream();
}

export function wireLobbyEvents({ switchToView, onStartSession }) {
  $('#btn-lobby-back').addEventListener('click', () => {
    stopLobbyMicTest();
    stopMediaStream();
    state.lobbyCfg = null;
    switchToView('view-path');
  });

  $('#btn-lobby-toggle-cam').addEventListener('click', toggleCamera);

  $('#lobby-voice-select').addEventListener('change', (e) => {
    const v = e.target.value;
    if (state.lobbyCfg) state.lobbyCfg.voice = v;
    state.activeSession.voice = v;
    $('#lobby-voice-badge').textContent = `Voice: ${v}`;
    renderAvatarVisual(true);
  });

  $('#lobby-personality-select')?.addEventListener('change', (e) => {
    const topic = state.lobbyCfg?.topic || state.activeSession?.topic || 'HR';
    if (e.target.value === 'rolled-10d') {
      applyLobbyPersonality(pickRandomPersonality(topic));
      return;
    }
    const preset = getTopicPersonalities(topic).find((p) => p.id === e.target.value);
    if (preset) applyLobbyPersonality(preset);
  });

  $('#btn-reroll-personality')?.addEventListener('click', () => {
    const topic = state.lobbyCfg?.topic || state.activeSession?.topic || 'HR';
    applyLobbyPersonality(pickRandomPersonality(topic, state.lobbyCfg?.personality?.id || null));
  });

  $('#btn-lobby-test-voice').addEventListener('click', () => {
    const meta = getActiveAgentMeta(state.lobbyCfg?.agentFile);
    const { firstName } = getCandidateIdentity();
    state.activeSession.voice = $('#lobby-voice-select').value;
    speakEnglish(`Hi ${firstName}! I'm ${meta.avatarName}, looking forward to our chat today.`, { force: true });
  });

  $('#btn-lobby-test-mic').addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      $('#lobby-stt-preview').textContent = 'Browser STT unavailable — mic audio bar still works.';
      return;
    }
    if (state.lobbyTestingMic) {
      stopLobbyMicTest();
      return;
    }
    const testRec = new SR();
    testRec.lang = 'en-US';
    testRec.interimResults = true;
    testRec.continuous = true;
    state.lobbyTestRec = testRec;
    state.lobbyTestingMic = true;
    $('#btn-lobby-test-mic').classList.add('is-listening');
    $('#btn-lobby-test-mic').textContent = '⏹ Stop Mic Test';
    $('#lobby-stt-preview').textContent = 'Listening... speak a test sentence in English!';
    testRec.onresult = (ev) => {
      let txt = '';
      for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript + ' ';
      $('#lobby-stt-preview').textContent = txt.trim() || 'Listening...';
    };
    testRec.onend = () => stopLobbyMicTest();
    testRec.start();
  });

  $('#btn-join-call').addEventListener('click', async () => {
    stopLobbyMicTest();
    stopMicMeter();
    const cfg = state.lobbyCfg || state.activeSession;
    const chosenVoice = $('#lobby-voice-select')?.value || cfg.voice || 'AmericanFemale';
    const continuous = $('#lobby-continuous-toggle')?.checked ?? (cfg.topic === 'HR');
    state.lobbyCfg = null;
    await onStartSession({ ...cfg, voice: chosenVoice, continuous });
  });
}
