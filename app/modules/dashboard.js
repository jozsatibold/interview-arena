import { apiJson, esc, fillSelectOptions, saveUserState, consumeNdjsonStream } from '../components.js';
import { resolveEffectiveContextTier, LLM_CONTEXT_TIERS } from '/shared/model-tiers.mjs';
import { ROLE_TRACK_GROUPS, getTopicUiLabels } from '/shared/role-archetypes.mjs';
import { $, $$, state, getCandidateIdentity, syncLinkedSelectGroup } from './state.js';
import { updateAvatarStage, renderAvatarVisual } from './avatar.js';
import { populateZonosVoiceDropdowns, speakEnglish } from './voice-media.js';
import { renderHud } from './stats-shop.js';
import { buildJdBriefHtml, stopLobbyMicTest, openLobby } from './lobby.js';
import { wireRolePlaybookEvents } from './role-playbook.js';

let onSwitchView = () => {};
let onCvBundleApplied = () => {};

export function renderActiveFakeJobPreview() {
  const jds = state.catalog?.jobDescriptions || [];
  const selectedId = $('#global-jd-select')?.value || jds[0]?.id;
  const activeJd = jds.find((j) => j.id === selectedId) || jds[0];
  const summaryEl = $('#active-fake-job-summary');
  const bodyEl = $('#active-fake-job-body');
  if (!summaryEl || !bodyEl) return;

  if (!activeJd) {
    summaryEl.textContent = '📄 No Fake Job loaded';
    bodyEl.innerHTML = '';
    return;
  }
  summaryEl.textContent = `📄 Active Fake Job: ${activeJd.title}`;
  bodyEl.innerHTML = buildJdBriefHtml({ jdObj: activeJd });
}

export function renderTargetModelSelectors() {
  const recFallback = (state.setup?.recommendedModels || []).map((r) => ({ name: r.id, sizeGB: r.sizeHint || '?' }));
  const installedNonEmbed = (state.setup?.installedModels || []).filter((m) => !/embed|flux/i.test(m.name));
  const models = state.plannerModels.length
    ? state.plannerModels
    : installedNonEmbed.length
      ? installedNonEmbed
      : recFallback;
  const vModels = state.visionModels.length
    ? state.visionModels
    : installedNonEmbed.length
      ? installedNonEmbed
      : [{ name: 'qwen3-vl:8b', sizeGB: '~6.1 GB (Pull Recommended)' }];
  const plannerPref = $('#onb-planner-model')?.value || $('#planner-model-select')?.value || state.user?.plannerModel || models[0]?.name || '';
  const visionPref = $('#vision-model-select')?.value || $('#settings-vision-model')?.value || state.user?.visionModel || vModels[0]?.name || '';

  for (const sel of [$('#planner-model-select'), $('#settings-planner-model'), $('#cv-planner-model'), $('#onb-planner-model')]) {
    fillSelectOptions(sel, models, { selectedValue: plannerPref, getValue: (m) => m.name, getLabel: (m) => `${m.name} (${m.sizeGB}${String(m.sizeGB).includes('GB') ? '' : ' GB'})` });
  }
  for (const sel of [$('#vision-model-select'), $('#settings-vision-model')]) {
    fillSelectOptions(sel, vModels, { selectedValue: visionPref, getValue: (m) => m.name, getLabel: (m) => `${m.name} (${m.sizeGB}${String(m.sizeGB).includes('GB') ? '' : ' GB'})` });
  }
}

function renderRoleTrackSelector() {
  const sel = $('#role-track-select');
  if (!sel) return;
  const activeTrack = state.user?.targetRoleTrack || state.catalog?.activeRoleTrack || 'auto';
  if (sel.options.length === 0) {
    const groupsHtml = ROLE_TRACK_GROUPS.map(
      (g) => `<optgroup label="${esc(g.group)}">${g.roles.map((r) => `<option value="${esc(r.id)}">${esc(r.label)}</option>`).join('')}</optgroup>`
    ).join('');
    sel.innerHTML = `<option value="auto">Auto (From Active CV)</option>${groupsHtml}`;
  }
  sel.value = activeTrack;
}

export function renderHome() {
  const cat = state.catalog;
  if (!cat) return;

  renderRoleTrackSelector();
  const effArchKey = cat.effectiveArchKey || 'general';
  const topicLabels = getTopicUiLabels(effArchKey);

  for (const chip of $$('#view-path .chip')) {
    const t = chip.dataset.topic;
    if (t && t !== 'ALL' && topicLabels[t]) chip.textContent = topicLabels[t];
  }

  const jdSel = $('#global-jd-select');
  if (jdSel) {
    const prevVal = jdSel.value;
    const jds = cat.jobDescriptions || [];
    fillSelectOptions(jdSel, jds, {
      selectedValue: jds.some((j) => j.id === prevVal) ? prevVal : (jds[0]?.id || ''),
      getValue: (jd) => jd.id,
      getLabel: (jd) => jd.title
    });
  }
  renderActiveFakeJobPreview();

  const completed = new Set(state.user.completedDays || []);
  $('#path-progress-label').textContent = `${completed.size} / ${cat.morningPath.length} Completed`;

  const nextNode = cat.morningPath.find((n) => !completed.has(n.day)) || cat.morningPath[0] || null;
  const nextDay = nextNode?.day ?? 1;
  const heroBtn = $('#btn-hero-continue');
  if (heroBtn) {
    if (nextNode) {
      heroBtn.hidden = false;
      heroBtn.textContent = completed.has(nextNode.day)
        ? `↺ Replay Day ${nextNode.day}: ${nextNode.title}`
        : `▶ Start Day ${nextNode.day}: ${nextNode.title}`;
      heroBtn.onclick = () => openLobby({
        agentFile: nextNode.agent,
        jdFile: nextNode.jd,
        topic: nextNode.topic,
        title: `Day ${nextNode.day}: ${nextNode.title}`,
        day: nextNode.day
      }, onSwitchView);
    } else {
      heroBtn.hidden = true;
    }
  }

  const pathGrid = $('#morning-path-grid');
  pathGrid.innerHTML = '';

  for (const node of cat.morningPath) {
    if (state.activeTopic !== 'ALL' && node.topic !== state.activeTopic) continue;
    const isDone = completed.has(node.day);
    const isNext = node.day === nextDay && !isDone;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `path-node ${isDone ? 'is-done' : isNext ? 'is-next' : ''}`;
    if (node.focus) btn.title = node.focus;
    btn.innerHTML = `
      <span class="path-node-head">
        <span class="path-node-badge" aria-hidden="true">${isDone ? '✓' : isNext ? '★' : String(node.day).padStart(2, '0')}</span>
        <span class="path-day">Day ${node.day}${isNext ? ' · Next' : ''}</span>
      </span>
      <strong class="path-title">${esc(node.title)}</strong>
      <span class="path-topic">${esc(topicLabels[node.topic] || node.topic)}</span>
    `;
    btn.addEventListener('click', () => openLobby({
      agentFile: node.agent,
      jdFile: node.jd,
      topic: node.topic,
      title: `Day ${node.day}: ${node.title}`,
      day: node.day
    }, onSwitchView));
    pathGrid.appendChild(btn);
  }

  const agentsGrid = $('#agents-grid');
  agentsGrid.innerHTML = '';
  for (const ag of cat.agents) {
    if (state.activeTopic !== 'ALL' && ag.topic !== state.activeTopic) continue;
    const card = document.createElement('article');
    card.className = 'agent-card';
    card.dataset.topic = ag.topic || 'General';
    card.innerHTML = `
      <div class="agent-top">
        <span class="agent-code">${esc(ag.code)}</span>
        <span class="agent-topic">${esc(ag.avatarName || ag.topic)} · ${esc(topicLabels[ag.topic] || ag.topic)}</span>
      </div>
      <h4 class="agent-title">${esc(ag.title)}</h4>
      <button type="button" class="btn btn-primary btn-agent-launch">Enter Lobby ▶</button>
    `;
    card.querySelector('button').addEventListener('click', () => openLobby({
      agentFile: ag.id,
      jdFile: $('#global-jd-select').value || ag.defaultJd,
      topic: ag.topic,
      title: `${ag.code} — ${ag.title}`,
      day: null
    }, onSwitchView));
    agentsGrid.appendChild(card);
  }
}

function findSetupModelMeta(modelName = '') {
  const s = state.setup;
  if (!s || !modelName) return null;
  return (
    (s.installedModels || []).find((m) => m.name === modelName) ||
    (s.recommendedModels || []).find((r) => r.id === modelName) ||
    null
  );
}

export function syncContextTierPickers(modelOverride = '') {
  const pref = state.user?.modelContextTier || 'auto';
  const activeModel =
    String(modelOverride || '').trim() ||
    $('#custom-model-input')?.value.trim() ||
    $('#model-select')?.value ||
    $('#onb-setup-model-select')?.value ||
    state.user?.selectedModel ||
    '';
  const resolved = resolveEffectiveContextTier({
    preference: pref,
    modelName: activeModel,
    modelMeta: findSetupModelMeta(activeModel)
  });
  const detectedSpec = LLM_CONTEXT_TIERS[resolved.detected?.tier || 'medium'] || resolved.spec;
  const paramSuffix = resolved.detected?.paramB ? ` (${resolved.detected.paramB}B)` : '';
  const autoTargetLabel = `→ ${detectedSpec.title.replace(' LLMs', '')}${paramSuffix}`;

  for (const box of $$('[data-context-tier-picker]')) {
    const badge = box.querySelector('.tier-resolved-badge');
    if (badge) {
      badge.textContent =
        resolved.mode === 'auto'
          ? `Auto → ${resolved.spec.title} (${resolved.spec.rangeLabel})`
          : `${resolved.spec.title} (${resolved.spec.rangeLabel})`;
      badge.className = `badge tier-resolved-badge ${resolved.tier === 'small' ? '' : 'badge-green'}`;
    }
    const autoHint = box.querySelector('.tier-auto-hint');
    if (autoHint) autoHint.textContent = autoTargetLabel;

    for (const btn of box.querySelectorAll('.tier-seg-btn')) {
      const isSelected = btn.dataset.tierValue === resolved.preference;
      btn.classList.toggle('is-active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    }
  }
}

function syncOnboardingModelButton(modelName) {
  const pullBtn = $('#btn-onb-pull-model');
  if (!pullBtn) return;
  const installed = new Set((state.setup?.installedModels || []).map((m) => m.name));
  const isInstalled = installed.has(String(modelName || '').trim());
  pullBtn.disabled = isInstalled;
  pullBtn.textContent = isInstalled ? '✅ Installed' : '⬇ Pull Model';
}

function renderOnboardingSetupState(s, ollamaTiles, chatModelOptions, isReady) {
  const onbChecklist = $('#onb-setup-checklist');
  if (onbChecklist) {
    onbChecklist.innerHTML = ollamaTiles
      .slice(0, 3)
      .map((t) => `<div class="check-tile ${t.cls}"><strong>${esc(t.title)}</strong><br><span>${esc(t.desc)}</span></div>`)
      .join('');
  }
  if ($('#onb-ollama-badge')) {
    $('#onb-ollama-badge').textContent = isReady ? 'Ready ✅' : s.ollamaInstalled ? 'Setup Needed ⚠️' : 'Install Ollama';
    $('#onb-ollama-badge').className = `badge ${isReady ? 'badge-green' : ''}`;
  }
  if ($('#btn-onb-start-ollama')) {
    $('#btn-onb-start-ollama').hidden = Boolean(s.ollamaRunning || !s.ollamaInstalled);
  }
  const activeSelModel = state.user?.selectedModel || s.recommendedModels?.[0]?.id || '';
  fillSelectOptions($('#onb-setup-model-select'), chatModelOptions, {
    selectedValue: activeSelModel
  });
  syncOnboardingModelButton(activeSelModel);

  if ($('#onb-zonos-badge')) {
    $('#onb-zonos-badge').textContent = s.zonosRunning ? 'Running ✅' : s.zonosBuilt ? 'Installed · Stopped' : 'Optional';
    $('#onb-zonos-badge').className = `badge ${s.zonosRunning ? 'badge-green' : ''}`;
  }
  if ($('#onb-zonos-status')) {
    $('#onb-zonos-status').textContent = s.zonosRunning
      ? '✅ ZONOS3-Mini Natural 44.1 kHz Voice is active on :1919!'
      : s.zonosBuilt
        ? '✅ ZONOS3-Mini is already installed locally — click below to start the server on :1919 (or use Browser Voice).'
        : 'Not installed yet — click below to download & build ZONOS3-Mini locally, or continue with built-in Browser Voice.';
  }
  if ($('#btn-onb-start-zonos')) {
    $('#btn-onb-start-zonos').hidden = Boolean(s.zonosRunning);
    $('#btn-onb-start-zonos').textContent = s.zonosBuilt ? '▶ Start ZONOS3 (:1919)' : '▶ Install & Start ZONOS3 (:1919)';
  }

  const banner = $('#onb-setup-status-banner');
  if (banner) {
    if (isReady && s.zonosRunning) {
      banner.textContent = '✅ Both Ollama and ZONOS3-Mini Voice are ready! Continue to Step 2 to upload your CV.';
      banner.className = 'shop-status-msg is-success';
    } else if (isReady) {
      banner.textContent = s.zonosBuilt
        ? '✅ Ollama is ready and ZONOS3-Mini is installed! Click Start above or continue straight to Step 2 (Browser Voice works automatically).'
        : '✅ Ollama is ready! Optionally install ZONOS3-Mini above, or continue straight to Step 2 (Browser Voice works automatically).';
      banner.className = 'shop-status-msg is-success';
    } else if (!s.ollamaInstalled) {
      banner.textContent = '⚠️ Ollama CLI was not detected yet. Download & start Ollama first, then click "↻ Re-check" before uploading your CV.';
      banner.className = 'shop-status-msg is-error';
    } else if (!s.ollamaRunning) {
      banner.textContent = '⚠️ Ollama is installed but not running. Click "▶ Start Ollama Daemon" above before continuing to Step 2.';
      banner.className = 'shop-status-msg is-error';
    } else {
      banner.textContent = '⚠️ Ollama is running, but no local LLM model is pulled yet. Click "⬇ Pull Model" above first.';
      banner.className = 'shop-status-msg is-error';
    }
  }
}

export function syncAvatarQualityPicker() {
  const quality = state.user?.avatarQuality === 'detailed' ? 'detailed' : 'standard';
  const badge = $('#avatar-quality-badge');
  if (badge) {
    badge.textContent = quality === 'detailed' ? 'Detailed Realistic' : 'Standard (Fast)';
    badge.className = `badge ${quality === 'detailed' ? 'badge-green' : ''}`;
  }
  for (const btn of $$('[data-avatar-quality]')) {
    const active = btn.dataset.avatarQuality === quality;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
}

export function renderSettingsPage() {
  const s = state.setup;
  if (!s) return;

  const hasModels = s.installedModels.length > 0;
  const isReady = s.ollamaRunning && hasModels;
  const dot = $('#setup-dot');
  if (dot) dot.className = `status-dot ${isReady ? 'is-ok' : s.ollamaInstalled ? 'is-warn' : 'is-err'}`;
  if ($('#setup-label')) $('#setup-label').textContent = isReady ? state.user.selectedModel : 'Settings Required';

  const tiles = [
    { cls: s.ollamaInstalled ? 'is-ok' : 'is-err', title: '1. Ollama CLI', desc: s.ollamaInstalled ? 'Installed ✅' : 'Not installed ❌ (Download below)' },
    { cls: s.ollamaRunning ? 'is-ok' : 'is-err', title: '2. Ollama Daemon', desc: s.ollamaRunning ? 'Running on :11434 ✅' : 'Stopped ⚠️ (Click Start)' },
    { cls: hasModels ? 'is-ok' : 'is-err', title: '3. Local LLM Models', desc: hasModels ? `${s.installedModels.length} model(s) ready ✅` : 'No model pulled yet ⚠️' },
    {
      cls: s.zonosRunning ? 'is-ok' : s.zonosBuilt ? 'is-warn' : 'is-err',
      title: '4. ZONOS3-Mini TTS (:1919)',
      desc: s.zonosRunning
        ? 'Natural 44.1kHz Voice ✅'
        : s.zonosBuilt
          ? 'Installed locally ✅ (Stopped — Click Start)'
          : 'Not installed (Browser TTS fallback)'
    },
    { cls: s.whisperServerRunning ? 'is-ok' : 'is-warn', title: '5. Whisper Large-v3-Turbo (:1818)', desc: s.whisperServerRunning ? 'Tech Vocabulary STT Active ✅' : 'Stopped (Browser WebSpeech fallback)' }
  ];
  $('#setup-checklist').innerHTML = tiles.map((t) => `<div class="check-tile ${t.cls}"><strong>${esc(t.title)}</strong><br><span>${esc(t.desc)}</span></div>`).join('');

  if ($('#btn-start-zonos')) {
    $('#btn-start-zonos').hidden = Boolean(s.zonosRunning);
    $('#btn-start-zonos').textContent = s.zonosBuilt ? '▶ Start ZONOS3 (:1919)' : '▶ Install & Start ZONOS3 (:1919)';
  }

  populateZonosVoiceDropdowns();
  if ($('#tts-engine-select') && state.user?.ttsEngine) $('#tts-engine-select').value = state.user.ttsEngine;
  if ($('#zonos-voice-select') && state.user?.zonosVoice) $('#zonos-voice-select').value = state.user.zonosVoice;
  if ($('#arena-voice-select') && state.user?.zonosVoice) $('#arena-voice-select').value = state.user.zonosVoice;
  if ($('#setting-default-voice')) {
    const defVoice = state.user?.defaultAutoSpeak !== false;
    $('#setting-default-voice').checked = defVoice;
    $('#setting-default-voice').dispatchEvent(new Event('change'));
    if ($('#auto-speak-toggle')) $('#auto-speak-toggle').checked = defVoice;
  }
  if ($('#setting-default-continuous')) {
    const defCont = state.user?.defaultContinuousFlow !== false;
    $('#setting-default-continuous').checked = defCont;
    $('#setting-default-continuous').dispatchEvent(new Event('change'));
    if ($('#continuous-flow-toggle')) $('#continuous-flow-toggle').checked = defCont;
  }
  if ($('#setting-mic-mode') && state.user?.micMode) $('#setting-mic-mode').value = state.user.micMode;
  if ($('#setting-default-duration') && state.user?.defaultDurationMinutes) $('#setting-default-duration').value = String(state.user.defaultDurationMinutes);
  if ($('#setting-default-exam')) {
    $('#setting-default-exam').checked = Boolean(state.user?.defaultExamMode);
    $('#setting-default-exam').dispatchEvent(new Event('change'));
  }
  if ($('#setting-ambient-audio')) {
    $('#setting-ambient-audio').checked = Boolean(state.user?.callAmbientAudio);
    $('#setting-ambient-audio').dispatchEvent(new Event('change'));
  }
  if ($('#call-ambient-toggle')) $('#call-ambient-toggle').checked = Boolean(state.user?.callAmbientAudio);
  updateAvatarStage();

  const installedNames = new Set(s.installedModels.map((m) => m.name));
  if (s.installedModels.length > 0 && !installedNames.has(state.user.selectedModel)) {
    const preferred = ['hf.co/LiquidAI/LFM2.5-2.6B-GGUF', 'hf.co/LiquidAI/LFM2-8B-A1B-GGUF', 'qwen3.5:9b', 'llama3.1:8b', 'gemma4:12b', 'qwen3.5:4b', 'qwen2.5:7b'];
    const bestMatch = preferred.find((p) => installedNames.has(p)) || s.installedModels.find((m) => !/embed|flux/i.test(m.name))?.name || s.installedModels[0].name;
    state.user.selectedModel = bestMatch;
    if ($('#setup-label')) $('#setup-label').textContent = bestMatch;
    saveUserState({ selectedModel: bestMatch }).catch(() => {});
  }

  const seen = new Set(s.installedModels.map((m) => m.name));
  const chatModelOptions = [
    ...s.installedModels.map((m) => ({ value: m.name, label: `✅ [Installed] ${m.name} (${m.sizeGB} GB)` })),
    ...s.recommendedModels.filter((r) => !seen.has(r.id)).map((r) => ({ value: r.id, label: `⬇ [Pull Needed] ${r.id} — ${r.label} (${r.sizeHint})` }))
  ];
  fillSelectOptions($('#model-select'), chatModelOptions, { selectedValue: state.user.selectedModel });

  if (s.plannerModels?.length) state.plannerModels = s.plannerModels;
  if (s.visionModels?.length) state.visionModels = s.visionModels;
  renderTargetModelSelectors();
  renderOnboardingSetupState(s, tiles, chatModelOptions, isReady);
  syncContextTierPickers();
  syncAvatarQualityPicker();

  if ($('#voice-tools-note')) {
    $('#voice-tools-note').textContent = `${s.voiceTools.browserSpeechNote}` +
      (s.voiceTools.whisperCli ? ' Local whisper-cli detected on Mac.' : '') +
      (s.voiceTools.parakeetCli ? ' Local parakeet-cli detected on Mac.' : '');
  }
  if (s.storage) {
    if ($('#settings-db-badge')) $('#settings-db-badge').textContent = `🗄️ ${s.storage.engine}`;
    if ($('#settings-storage-pill')) $('#settings-storage-pill').textContent = s.storage.dbFile;
    if ($('#settings-storage-summary')) {
      $('#settings-storage-summary').textContent = `Active SQLite storage (${s.storage.dbFile}) · ${state.user?.xp || 0} XP · ${(state.user?.sessions || []).length} scored drills · ${s.storage.targetsCount || 0} saved Target Interview packs.`;
    }
  }
  if (!isReady && !state.needsOnboarding && !sessionStorage.getItem('setupPromptedOnce')) {
    sessionStorage.setItem('setupPromptedOnce', '1');
    onSwitchView('view-settings');
  }
}

export async function refreshSetup() {
  state.setup = await apiJson('/api/setup-status', null, 'GET');
  renderSettingsPage();
}

export function wireDashboardAndSettingsEvents({ switchToView, applyCvCatalogBundle }) {
  onSwitchView = switchToView;
  onCvBundleApplied = applyCvCatalogBundle;
  wireRolePlaybookEvents();

  for (const chip of $$('#view-path .chip')) {
    chip.addEventListener('click', () => {
      for (const c of $$('#view-path .chip')) c.classList.remove('is-active');
      chip.classList.add('is-active');
      state.activeTopic = chip.dataset.topic;
      renderHome();
    });
  }

  $('#role-track-select')?.addEventListener('change', async (e) => {
    const nextTrack = e.target.value || 'auto';
    if (state.user) state.user.targetRoleTrack = nextTrack;
    try {
      state.user = await saveUserState({ targetRoleTrack: nextTrack });
      const freshCatalog = await apiJson('/api/catalog', null, 'GET');
      state.catalog = freshCatalog;
      renderHome();
    } catch {}
  });

  $('#global-jd-select')?.addEventListener('change', renderActiveFakeJobPreview);
  $('#btn-new-fake-job')?.addEventListener('click', async () => {
    const btn = $('#btn-new-fake-job');
    if (!btn) return;
    const prevText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Generating Fake Job...';
    try {
      const plannerModel = $('#settings-planner-model')?.value || $('#cv-planner-model')?.value || '';
      const data = await apiJson('/api/cv/fake-jobs', { plannerModel });
      onCvBundleApplied(data);
      if (data.createdJd?.id && $('#global-jd-select')) {
        $('#global-jd-select').value = data.createdJd.id;
        renderActiveFakeJobPreview();
      }
      if ($('#active-fake-job-preview')) $('#active-fake-job-preview').open = true;
    } catch (err) {
      alert(`Failed to generate Fake Job: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = prevText;
    }
  });

  const startOllamaDaemon = async () => {
    await fetch('/api/ollama/start', { method: 'POST' });
    await refreshSetup();
  };

  $('#btn-refresh-setup')?.addEventListener('click', refreshSetup);
  $('#btn-onb-refresh-setup')?.addEventListener('click', refreshSetup);
  $('#btn-start-ollama')?.addEventListener('click', startOllamaDaemon);
  $('#btn-onb-start-ollama')?.addEventListener('click', startOllamaDaemon);

  const pullOllamaModelToBox = async (model, prog, disableBtns = []) => {
    if (!model || !prog) return;
    prog.hidden = false;
    prog.style.color = '#38bdf8';
    prog.textContent = `Starting pull for ${model}...`;
    for (const b of disableBtns) if (b) b.disabled = true;
    try {
      const res = await fetch('/api/ollama/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      let sawError = null;
      let sawSuccess = false;
      await consumeNdjsonStream(res, (obj) => {
        if (obj.error) { sawError = obj.error; prog.style.color = '#f87171'; prog.textContent = `❌ Pull error: ${obj.error}`; return; }
        if (obj.status === 'success') sawSuccess = true;
        const mbDone = obj.completed ? `${(obj.completed / 1e6).toFixed(0)} MB` : '';
        const mbTot = obj.total ? ` / ${(obj.total / 1e6).toFixed(0)} MB` : '';
        const pct = obj.total && obj.completed ? ` (${Math.round((obj.completed / obj.total) * 100)}%)` : '';
        prog.textContent = `${obj.status || 'Downloading'} ${mbDone}${mbTot}${pct}`.trim();
      });
      if (!sawError && sawSuccess) {
        prog.style.color = '#4ade80';
        prog.textContent = `✅ Successfully pulled ${model}!`;
        state.user = await saveUserState({ selectedModel: model });
        await refreshSetup();
      }
    } catch (err) {
      prog.style.color = '#f87171';
      prog.textContent = `❌ Failed to pull ${model}: ${err.message}`;
    } finally {
      for (const b of disableBtns) if (b) b.disabled = false;
    }
  };

  $('#btn-pull-selected')?.addEventListener('click', () =>
    pullOllamaModelToBox($('#model-select')?.value, $('#pull-progress'), [$('#btn-pull-selected'), $('#btn-pull-model')])
  );
  $('#btn-pull-model')?.addEventListener('click', () =>
    pullOllamaModelToBox($('#custom-model-input')?.value.trim() || $('#model-select')?.value, $('#pull-progress'), [$('#btn-pull-selected'), $('#btn-pull-model')])
  );
  $('#btn-onb-pull-model')?.addEventListener('click', () =>
    pullOllamaModelToBox($('#onb-setup-model-select')?.value, $('#onb-pull-progress'), [$('#btn-onb-pull-model')])
  );

  let zonosPollTimer = null;
  const startZonosSetupToBox = async (box, triggerBtn) => {
    if (!box) return;
    box.hidden = false;
    box.style.color = '#38bdf8';
    box.textContent = 'Starting ZONOS3-Mini setup...';
    if (triggerBtn) triggerBtn.disabled = true;

    const poll = async () => {
      try {
        const data = await (await fetch('/api/zonos/logs')).json();
        box.textContent = (data.logs || []).slice(-6).join('\n') || 'Working...';
        if (data.running || data.status === 'error') {
          clearInterval(zonosPollTimer);
          zonosPollTimer = null;
          if (triggerBtn) triggerBtn.disabled = false;
          box.style.color = data.running ? '#4ade80' : '#f87171';
          if (data.running) {
            box.textContent = '✅ ZONOS3-Mini Natural Voice Server is running on :1919!';
            await refreshSetup();
          }
        }
      } catch {}
    };

    await fetch('/api/zonos/start', { method: 'POST' });
    clearInterval(zonosPollTimer);
    zonosPollTimer = setInterval(poll, 1500);
    await poll();
  };

  $('#btn-start-zonos')?.addEventListener('click', () => startZonosSetupToBox($('#zonos-progress'), $('#btn-start-zonos')));
  $('#btn-onb-start-zonos')?.addEventListener('click', () => startZonosSetupToBox($('#onb-zonos-progress'), $('#btn-onb-start-zonos')));

  $('#btn-test-voice').addEventListener('click', () => {
    if ($('#tts-engine-select')) state.user.ttsEngine = $('#tts-engine-select').value;
    if ($('#zonos-voice-select')) state.user.zonosVoice = $('#zonos-voice-select').value;
    if ($('#voice-select')) state.user.preferredVoice = $('#voice-select').value;
    updateAvatarStage();
    const { firstName } = getCandidateIdentity();
    speakEnglish(`Hi ${firstName}! Your local voice setup is working clearly. Let's sharpen your senior interview impact!`, { force: true });
  });

  $('#open-setup-btn')?.addEventListener('click', () => {
    stopLobbyMicTest();
    switchToView('view-settings');
  });

  syncLinkedSelectGroup(['#settings-planner-model', '#planner-model-select', '#cv-planner-model', '#onb-planner-model']);
  syncLinkedSelectGroup(['#settings-vision-model', '#vision-model-select']);

  for (const box of $$('[data-context-tier-picker]')) {
    const infoBtn = box.querySelector('.tier-info-btn');
    const popover = box.querySelector('.tier-info-popover');
    infoBtn?.addEventListener('click', () => {
      if (!popover) return;
      const nextHidden = !popover.hidden;
      popover.hidden = nextHidden;
      infoBtn.setAttribute('aria-expanded', String(!nextHidden));
    });
    for (const btn of box.querySelectorAll('.tier-seg-btn')) {
      btn.addEventListener('click', async () => {
        const nextTier = btn.dataset.tierValue || 'auto';
        if (state.user) state.user.modelContextTier = nextTier;
        syncContextTierPickers();
        try {
          state.user = await saveUserState({ modelContextTier: nextTier });
        } catch {}
      });
    }
  }

  for (const btn of $$('[data-avatar-quality]')) {
    btn.addEventListener('click', async () => {
      const nextQ = btn.dataset.avatarQuality === 'detailed' ? 'detailed' : 'standard';
      if (state.user) state.user.avatarQuality = nextQ;
      syncAvatarQualityPicker();
      renderAvatarVisual(true);
      try {
        state.user = await saveUserState({ avatarQuality: nextQ });
      } catch {}
    });
  }

  $('#model-select')?.addEventListener('change', (e) => syncContextTierPickers(e.target.value));
  $('#onb-setup-model-select')?.addEventListener('change', async (e) => {
    const val = e.target.value;
    syncContextTierPickers(val);
    syncOnboardingModelButton(val);
    const isInstalled = (state.setup?.installedModels || []).some((m) => m.name === val);
    if (isInstalled) {
      if (state.user) state.user.selectedModel = val;
      if ($('#model-select')) $('#model-select').value = val;
      if ($('#setup-label')) $('#setup-label').textContent = val;
      try {
        state.user = await saveUserState({ selectedModel: val });
      } catch {}
    }
  });
  $('#custom-model-input')?.addEventListener('input', (e) => syncContextTierPickers(e.target.value));

  $('#settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    state.user = await saveUserState({
      selectedModel: $('#custom-model-input')?.value.trim() || $('#model-select')?.value,
      modelContextTier: state.user?.modelContextTier || 'auto',
      avatarQuality: state.user?.avatarQuality || 'standard',
      plannerModel: $('#settings-planner-model')?.value || $('#planner-model-select')?.value || '',
      visionModel: $('#settings-vision-model')?.value || $('#vision-model-select')?.value || '',
      preferredVoice: $('#voice-select')?.value || '',
      ttsEngine: $('#tts-engine-select')?.value || 'auto',
      zonosVoice: $('#zonos-voice-select')?.value || 'AmericanFemale',
      defaultAutoSpeak: Boolean($('#setting-default-voice')?.checked ?? true),
      defaultContinuousFlow: Boolean($('#setting-default-continuous')?.checked ?? true),
      micMode: $('#setting-mic-mode')?.value || 'manual',
      defaultDurationMinutes: Number($('#setting-default-duration')?.value || 12),
      defaultExamMode: Boolean($('#setting-default-exam')?.checked),
      callAmbientAudio: Boolean($('#setting-ambient-audio')?.checked)
    });
    renderHud();
    renderSettingsPage();
    if ($('#settings-save-status')) $('#settings-save-status').textContent = '✅ Saved all LLM & Voice settings to SQLite (data/arena.db)!';
  });
}
