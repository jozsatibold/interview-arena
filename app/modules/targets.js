import { apiJson, esc, consumeNdjsonStream, createProgressTracker } from '../components.js';
import { $, state, wireDropzone } from './state.js';
import { renderTargetModelSelectors } from './dashboard.js';
import { openLobby } from './lobby.js';

const plannerTracker = createProgressTracker('planner-progress', ['ocr', 'fit', 'study', 'rounds']);
let onSwitchView = () => {};

export function renderJdImagePreviews() {
  const wrap = $('#jd-image-previews');
  const extractBtn = $('#btn-extract-images');
  if (!wrap) return;
  wrap.innerHTML = '';
  const hasImgs = state.jdImages.length > 0;
  wrap.hidden = !hasImgs;
  if (extractBtn) extractBtn.hidden = !hasImgs;

  state.jdImages.forEach((img, idx) => {
    const div = document.createElement('div');
    div.className = 'jd-thumb';
    div.innerHTML = `
      <img src="${esc(img.dataUrl)}" alt="Uploaded job description screenshot ${idx + 1}">
      <button type="button" class="jd-thumb-remove" aria-label="Remove screenshot ${idx + 1}">✕</button>
    `;
    div.querySelector('button').addEventListener('click', () => {
      state.jdImages.splice(idx, 1);
      renderJdImagePreviews();
    });
    wrap.appendChild(div);
  });
}

function addJdImageFiles(files) {
  for (const file of files) {
    if (!file.type || !file.type.startsWith('image/')) continue;
    const reader = new FileReader();
    reader.onload = () => {
      state.jdImages.push({ name: file.name || 'screenshot.png', dataUrl: String(reader.result) });
      renderJdImagePreviews();
    };
    reader.readAsDataURL(file);
  }
}

async function extractImagesToJd({ autoFlow = false } = {}) {
  if (state.jdImages.length === 0) return $('#target-jd-textarea').value.trim();
  const visionModel = $('#vision-model-select')?.value || '';
  const extractBtn = $('#btn-extract-images');
  if (extractBtn) extractBtn.disabled = true;
  const finishTimer = autoFlow ? null : plannerTracker.startTimer();

  const chunks = [];
  try {
    const total = state.jdImages.length;
    for (let i = 0; i < total; i++) {
      const pct = autoFlow ? Math.round(2 + (i / total) * 8) : Math.round(10 + (i / total) * 80);
      plannerTracker.setStage('ocr', { skipFirst: false });
      plannerTracker.update({
        icon: '👁️',
        message: `Reading screenshot ${i + 1} / ${total} with ${visionModel || 'Vision AI'}...`,
        detail: `Extracting job requirements from ${state.jdImages[i].name}`,
        percent: pct,
        mode: 'running'
      });
      const data = await apiJson('/api/jd/extract-image', { imageBase64: state.jdImages[i].dataUrl, visionModel });
      if (data.extractedText) chunks.push(data.extractedText);
    }
    const existing = $('#target-jd-textarea').value.trim();
    const combined = [existing, ...chunks].filter(Boolean).join('\n\n');
    $('#target-jd-textarea').value = combined;
    plannerTracker.setStepState('ocr', 'done');
    if (!autoFlow) {
      const sec = finishTimer?.() || '0.0';
      plannerTracker.update({
        icon: '✅',
        message: `Extracted text from ${total} screenshot(s) in ${sec}s — ready to analyze!`,
        detail: `Vision model: ${visionModel || 'auto'} · ${combined.length} characters extracted`,
        percent: 100,
        mode: 'done'
      });
    }
    return combined;
  } catch (err) {
    if (!autoFlow) {
      finishTimer?.();
      plannerTracker.setStage('ocr', { error: true });
      plannerTracker.update({
        icon: '❌',
        message: `Screenshot OCR failed: ${err.message}`,
        detail: 'Check that Ollama is running or paste the JD text manually.',
        percent: 15,
        mode: 'error'
      });
    }
    throw err;
  } finally {
    if (extractBtn) extractBtn.disabled = false;
  }
}

async function generateTargetSeries() {
  const genBtn = $('#btn-generate-series');
  const prevBtnLabel = genBtn.textContent;
  genBtn.disabled = true;
  genBtn.textContent = '⏳ Analyzing & Generating Series...';

  const usedOcr = state.jdImages.length > 0 && !$('#target-jd-textarea').value.trim();
  let lastStage = usedOcr ? 'ocr' : 'fit';
  const finishTimer = plannerTracker.startTimer();

  try {
    let jdText = $('#target-jd-textarea').value.trim();
    if (!jdText && state.jdImages.length > 0) jdText = await extractImagesToJd({ autoFlow: true });
    if (!jdText || jdText.length < 30) {
      finishTimer();
      plannerTracker.setStage('fit', { skipFirst: !usedOcr, error: true });
      plannerTracker.update({ icon: '⚠️', message: 'Paste a job description or add a screenshot first (min 30 chars).', detail: '', percent: 0, mode: 'error' });
      return;
    }

    const plannerModel = $('#planner-model-select')?.value || '';
    lastStage = 'fit';
    plannerTracker.setStage('fit', { skipFirst: !usedOcr });
    plannerTracker.update({
      icon: '🧠',
      message: `Starting analysis with ${plannerModel || 'recommended model'}...`,
      detail: 'Loading model into local GPU memory...',
      percent: usedOcr ? 12 : 8,
      mode: 'running'
    });

    const res = await fetch('/api/custom-interviews/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: $('#target-company-input').value.trim(),
        roleTitle: $('#target-role-input').value.trim(),
        notes: $('#target-notes-input').value.trim(),
        jdText,
        plannerModel
      })
    });
    if (!res.ok || !res.body) throw new Error(`Server error (${res.status})`);

    let finalPayload = null;
    await consumeNdjsonStream(res, (ev) => {
      if (ev.type === 'progress') {
        lastStage = ev.stageKey || lastStage;
        plannerTracker.setStage(lastStage, { skipFirst: !usedOcr });
        plannerTracker.update({
          icon: lastStage === 'rounds' ? '🎬' : lastStage === 'study' ? '📚' : lastStage === 'saving' ? '💾' : '🧠',
          message: ev.message || 'Processing...',
          detail: ev.detail || '',
          percent: ev.percent ?? 30,
          mode: 'running'
        });
      } else if (ev.type === 'done') finalPayload = ev;
      else if (ev.type === 'error') throw new Error(ev.error || 'Generation failed');
    });

    if (!finalPayload?.pack) throw new Error('Generation stream ended before saving pack.');

    const sec = finishTimer();
    plannerTracker.setStage('rounds', { skipFirst: !usedOcr, done: true });
    state.customInterviews = finalPayload.interviews || [];
    state.jdImages = [];
    renderJdImagePreviews();
    $('#target-company-input').value = '';
    $('#target-role-input').value = '';
    $('#target-notes-input').value = '';
    $('#target-jd-textarea').value = '';
    plannerTracker.update({
      icon: '✅',
      message: `Ready in ${sec}s! Saved ${finalPayload.pack.company} (${finalPayload.pack.rounds?.length || 0} rounds, ${finalPayload.pack.fitSummary?.matchScore ?? 85}% match).`,
      detail: 'Click any round card on the right to enter the Green Room & Live Call.',
      percent: 100,
      mode: 'done'
    });
    renderSavedTargets();
  } catch (err) {
    finishTimer();
    plannerTracker.setStage(lastStage, { skipFirst: !usedOcr, error: true });
    plannerTracker.update({ icon: '❌', message: `Error: ${err.message}`, detail: 'Try a lighter model or verify Ollama is running.', percent: 0, mode: 'error' });
  } finally {
    genBtn.disabled = false;
    genBtn.textContent = prevBtnLabel;
  }
}

export function renderSavedTargets() {
  const listEl = $('#saved-targets-list');
  const countEl = $('#saved-targets-count');
  if (!listEl) return;

  const items = state.customInterviews || [];
  if (countEl) countEl.textContent = `${items.length} Saved`;
  if (items.length === 0) {
    listEl.innerHTML = '<p class="muted">No target company packs generated yet. Paste a job description or screenshot on the left to build your first tailored series!</p>';
    return;
  }

  listEl.innerHTML = '';
  for (const pack of items) {
    const card = document.createElement('article');
    card.className = 'target-pack-card';
    const stackHtml = (pack.fitSummary?.keyStack || []).map((s) => `<span class="stack-pill">${esc(s)}</span>`).join('');
    const qaHtml = (pack.studyPack?.mustKnowQuestions || [])
      .map((q) => `<div class="study-qa-item"><strong>Q: ${esc(q.question)}</strong><p style="margin:0.2rem 0;">${esc(q.seniorAnswer)}</p>${q.keyMetricToDrop ? `<small class="muted">Drop metric: ${esc(q.keyMetricToDrop)}</small>` : ''}</div>`)
      .join('');
    const gapsHtml = (pack.fitSummary?.gapStrategies || []).map((g) => `<li><strong>${esc(g.gap || '')}:</strong> ${esc(g.reframe || g)}</li>`).join('');
    const askHtml = (pack.studyPack?.questionsToAskThem || []).map((q) => `<li>${esc(q)}</li>`).join('');

    card.innerHTML = `
      <div class="target-pack-head">
        <div><h4>${esc(pack.company)} — ${esc(pack.roleTitle)}</h4><p class="muted" style="margin:0.2rem 0 0 0;">${esc(pack.fitSummary?.headline || '')}</p></div>
        <div class="target-pack-badges">
          <span class="badge badge-green">${esc(pack.fitSummary?.matchScore ?? 85)}% Match</span>
          <span class="badge">${esc(pack.plannerModel)}</span>
          <button type="button" class="icon-close btn-del-target" aria-label="Delete ${esc(pack.company)}">🗑️</button>
        </div>
      </div>
      ${stackHtml ? `<div class="stack-pills">${stackHtml}</div>` : ''}
      <details class="target-study-details">
        <summary>📚 Open Study Material, Gap Reframing &amp; Must-Know Q&amp;A</summary>
        <div class="study-qa-list">
          ${gapsHtml ? `<div><strong>🛡️ Gap Reframing Strategy:</strong><ul>${gapsHtml}</ul></div>` : ''}
          ${qaHtml ? `<div><strong>💬 Tailored Interview Q&amp;A:</strong>${qaHtml}</div>` : ''}
          ${askHtml ? `<div><strong>❓ Smart Questions to Ask Them:</strong><ul>${askHtml}</ul></div>` : ''}
        </div>
      </details>
      <div class="target-rounds-grid"></div>
    `;

    card.querySelector('.btn-del-target').addEventListener('click', async () => {
      const data = await apiJson(`/api/custom-interviews?id=${encodeURIComponent(pack.id)}`, null, 'DELETE');
      state.customInterviews = data.interviews || [];
      renderSavedTargets();
    });

    const roundsGrid = card.querySelector('.target-rounds-grid');
    for (const r of pack.rounds || []) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'target-round-btn';
      btn.innerHTML = `<div class="target-round-meta"><span>Round ${esc(r.roundNumber)} · ${esc(r.topic)}</span><span>${esc(r.avatarName)} ▶</span></div><strong>${esc(r.title)}</strong><small class="muted">${esc(r.focus)}</small>`;
      btn.addEventListener('click', () => openLobby({
        agentFile: r.agentId,
        jdFile: 'jd-01-senior-frontend-fintech-bnpl.md',
        customInterviewId: pack.id,
        customRoundId: r.id,
        topic: r.topic,
        title: `${pack.company} — ${r.title}`,
        day: null
      }, onSwitchView));
      roundsGrid.appendChild(btn);
    }
    listEl.appendChild(card);
  }
}

export async function loadCustomInterviews() {
  try {
    const res = await fetch('/api/custom-interviews');
    if (!res.ok) return;
    const data = await res.json();
    state.customInterviews = data.interviews || [];
    state.plannerModels = data.plannerModels || [];
    state.visionModels = data.visionModels || [];
    renderTargetModelSelectors();
    renderSavedTargets();
  } catch {}
}

export function wireTargetsEvents({ switchToView }) {
  onSwitchView = switchToView;
  $('#jd-image-input')?.addEventListener('change', (e) => {
    if (e.target.files?.length) addJdImageFiles(e.target.files);
    e.target.value = '';
  });
  wireDropzone($('#jd-dropzone'), addJdImageFiles);

  document.addEventListener('paste', (e) => {
    const view = $('#view-targets');
    if (!view || view.classList.contains('inactive')) return;
    const imgFiles = Array.from(e.clipboardData?.items || [])
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (imgFiles.length > 0) {
      e.preventDefault();
      addJdImageFiles(imgFiles);
    }
  });

  $('#btn-extract-images')?.addEventListener('click', () => extractImagesToJd({ autoFlow: false }));
  $('#btn-generate-series')?.addEventListener('click', generateTargetSeries);
}
