import { apiJson, esc, consumeNdjsonStream, createProgressTracker } from '../components.js';
import { $, $$, state, getCandidateIdentity, wireDropzone } from './state.js';

const cvTracker = createProgressTracker('cv-progress', ['extract', 'profile', 'path', 'saving']);

export function renderAboutMe() {
  const cv = state.activeCv;
  const profile = cv?.profile || {};
  const versions = state.cvVersions || [];

  if ($('#about-active-cv-badge')) $('#about-active-cv-badge').textContent = `📄 ${cv?.versionLabel || 'v1 · Baseline CV'}`;
  if ($('#about-cv-count')) $('#about-cv-count').textContent = `${versions.length} Version${versions.length === 1 ? '' : 's'}`;

  const profileEl = $('#about-profile-view');
  if (profileEl) {
    const stackHtml = (profile.coreStack || []).map((s) => `<span class="stack-pill">${esc(s)}</span>`).join('');
    const achHtml = (profile.topAchievements || []).map((a) => `<li>${esc(a)}</li>`).join('');
    const gapHtml = (profile.gapAreas || []).map((g) => `<li>${esc(g)}</li>`).join('');
    const identity = getCandidateIdentity();
    const avatarHtml = `<div class="about-avatar-initials" aria-hidden="true">${esc(identity.initials)}</div>`;
    const fakeJdsHtml = (state.catalog?.jobDescriptions || []).slice(0, 4).map((j) => `<li><strong>${esc(j.title)}</strong>${j.compensation ? ` (${esc(j.compensation)})` : ''}</li>`).join('');

    profileEl.innerHTML = `
      <div class="about-profile-header">
        ${avatarHtml}
        <div class="about-profile-meta">
          <h4>${esc(identity.fullName)}</h4>
          <p class="muted">${esc(profile.headline || '')} · ${esc(profile.yearsExperience || '')}</p>
          <p class="muted">${esc(profile.location || '')} · Target: <strong>${esc(profile.targetCompensation || '')}</strong></p>
        </div>
      </div>
      ${stackHtml ? `<div class="stack-pills">${stackHtml}</div>` : ''}
      ${achHtml ? `<div><strong>🏆 Verified Metrics &amp; Highlights:</strong><ul class="about-sub-list">${achHtml}</ul></div>` : ''}
      ${gapHtml ? `<div><strong>🛡️ Coaching &amp; Gap Priorities:</strong><ul class="about-sub-list">${gapHtml}</ul></div>` : ''}
      ${fakeJdsHtml ? `<div><strong>💼 Active Fake Jobs Tailored to This CV:</strong><ul class="about-sub-list">${fakeJdsHtml}</ul></div>` : ''}
      <details class="target-study-details">
        <summary>📜 View Extracted CV Raw Text (${esc((cv?.rawText || '').length)} chars)</summary>
        <pre style="white-space:pre-wrap;font-size:0.78rem;margin:0.5rem 0 0 0;max-block-size:240px;overflow:auto;">${esc(cv?.rawText || '')}</pre>
      </details>
    `;
  }

  const listEl = $('#cv-versions-list');
  if (listEl) {
    listEl.innerHTML = '';
    for (const v of versions) {
      const row = document.createElement('div');
      row.className = `cv-version-row ${v.isActive ? 'is-active' : ''}`;
      row.innerHTML = `
        <div class="cv-version-meta">
          <strong>${v.isActive ? '✅ ' : ''}${esc(v.versionLabel)}</strong>
          <small class="muted">${esc(v.createdAt)} · Model: ${esc(v.plannerModel)}</small>
        </div>
        <div class="cv-version-actions">
          ${v.isActive ? '<span class="badge badge-green">Active Path</span>' : '<button type="button" class="btn btn-secondary btn-activate-cv" style="padding:0.4rem 0.7rem;font-size:0.78rem;">Activate ▶</button>'}
          <button type="button" class="icon-close btn-del-cv" title="${versions.length === 1 ? 'Delete CV & restart Sign-Up onboarding' : 'Delete CV version'}" aria-label="Delete CV version">🗑️</button>
        </div>
      `;
      row.querySelector('.btn-activate-cv')?.addEventListener('click', async () => {
        onBundleApplied(await apiJson('/api/cv/activate', { id: v.id }));
      });
      row.querySelector('.btn-del-cv')?.addEventListener('click', async () => {
        onBundleApplied(await apiJson(`/api/cv?id=${encodeURIComponent(v.id)}`, null, 'DELETE'));
      });
      listEl.appendChild(row);
    }
  }
}

let onBundleApplied = () => {};

function readCvFileToState(files, stateKey, badgeSelector) {
  const file = files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state[stateKey] = { name: file.name, base64Data: String(reader.result) };
    const badge = $(badgeSelector);
    if (badge) {
      badge.textContent = `📄 ${file.name}`;
      badge.hidden = false;
    }
  };
  reader.readAsDataURL(file);
}

async function streamCvUpload({ filename, base64Data, plainText, plannerModel, visionModel, notes, candidateName = '', onProgress }) {
  const res = await fetch('/api/cv/upload-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, base64Data, plainText, plannerModel, visionModel, notes, candidateName })
  });
  if (!res.ok || !res.body) throw new Error(`Server error (${res.status})`);
  let finalPayload = null;
  await consumeNdjsonStream(res, (ev) => {
    if (ev.type === 'progress') onProgress?.(ev);
    else if (ev.type === 'done') finalPayload = ev;
    else if (ev.type === 'error') throw new Error(ev.error || 'CV analysis failed');
  });
  if (!finalPayload?.activeCv) throw new Error('CV analysis ended unexpectedly.');
  return finalPayload;
}

function renderProcessingScreenState({ stageKey = 'extract', percent = 5, message = '', detail = '', etaSeconds = null, elapsedSeconds = 0, mode = 'running' }) {
  const stageOrder = ['extract', 'profile', 'path', 'saving'];
  const activeIdx = Math.max(0, stageOrder.indexOf(stageKey));

  if ($('#proc-progress-bar')) $('#proc-progress-bar').value = Math.max(0, Math.min(100, percent));
  if ($('#proc-percent-label')) $('#proc-percent-label').textContent = `${Math.round(percent)}%`;
  if ($('#proc-elapsed')) $('#proc-elapsed').textContent = `${elapsedSeconds}s`;
  if ($('#proc-eta')) {
    $('#proc-eta').textContent = mode === 'done' ? '0s' : etaSeconds != null ? (etaSeconds <= 2 ? 'Almost done...' : `~${etaSeconds}s`) : '~25s';
  }
  if ($('#proc-headline') && message) $('#proc-headline').textContent = message;
  if ($('#proc-live-detail')) $('#proc-live-detail').textContent = detail || message || 'Processing locally...';
  if ($('#proc-icon')) $('#proc-icon').textContent = mode === 'done' ? '🎉' : mode === 'error' ? '❌' : stageKey === 'path' ? '🗺️' : stageKey === 'profile' ? '🧠' : '⚡';
  if ($('#proc-error-actions')) $('#proc-error-actions').hidden = mode !== 'error';

  $$('#proc-checklist li').forEach((li) => {
    const idx = stageOrder.indexOf(li.dataset.stage);
    const badge = li.querySelector('.proc-step-badge');
    if (mode === 'done' || idx < activeIdx) {
      li.dataset.state = 'done';
      if (badge) badge.textContent = 'Done ✅';
    } else if (idx === activeIdx) {
      li.dataset.state = mode === 'error' ? 'error' : 'active';
      if (badge) badge.textContent = mode === 'error' ? 'Failed ❌' : 'Working...';
    } else {
      li.dataset.state = 'pending';
      if (badge) badge.textContent = 'Waiting';
    }
  });
}

async function submitOnboardingCv(switchToView) {
  const plainText = $('#onb-cv-paste-input')?.value.trim() || '';
  const errBanner = $('#onb-error-banner');
  if (!state.onbCvFile && plainText.length < 40) {
    if (errBanner) {
      errBanner.textContent = '⚠️ Please upload a CV file or paste your CV text (at least 40 characters) to continue.';
      errBanner.hidden = false;
    }
    return;
  }
  if (errBanner) errBanner.hidden = true;

  const plannerModel = $('#onb-planner-model')?.value || $('#planner-model-select')?.value || '';
  const visionModel = $('#vision-model-select')?.value || $('#settings-vision-model')?.value || '';
  const notes = $('#onb-notes-input')?.value.trim() || '';
  const candidateName = $('#onb-name-input')?.value.trim() || '';
  const btn = $('#btn-onb-start');
  if (btn) btn.disabled = true;

  const startMs = Date.now();
  let lastStageKey = 'extract';
  let lastPercent = 6;
  let lastMessage = `Reading ${state.onbCvFile?.name || 'your CV'}...`;
  let lastDetail = `Local AI model: ${plannerModel || 'auto-selected'} · Parsing skills & projects`;
  let estEta = 26;

  renderProcessingScreenState({ stageKey: lastStageKey, percent: lastPercent, message: lastMessage, detail: lastDetail, etaSeconds: estEta, elapsedSeconds: 0, mode: 'running' });
  switchToView('view-processing');

  const tickTimer = setInterval(() => {
    const elapsedSeconds = Math.round((Date.now() - startMs) / 1000);
    if (estEta > 2) estEta -= 1;
    renderProcessingScreenState({ stageKey: lastStageKey, percent: lastPercent, message: lastMessage, detail: lastDetail, etaSeconds: estEta, elapsedSeconds, mode: 'running' });
  }, 1000);

  try {
    const finalPayload = await streamCvUpload({
      filename: state.onbCvFile?.name || 'uploaded-cv.md',
      base64Data: state.onbCvFile?.base64Data || '',
      plainText,
      plannerModel,
      visionModel,
      notes,
      candidateName,
      onProgress: (ev) => {
        lastStageKey = ev.stageKey || lastStageKey;
        lastPercent = ev.percent ?? lastPercent;
        lastMessage = ev.message || lastMessage;
        lastDetail = ev.detail || lastDetail;
        if (typeof ev.etaSeconds === 'number') estEta = ev.etaSeconds;
        renderProcessingScreenState({
          stageKey: lastStageKey, percent: lastPercent, message: lastMessage, detail: lastDetail, etaSeconds: estEta,
          elapsedSeconds: ev.elapsedSeconds ?? Math.round((Date.now() - startMs) / 1000), mode: 'running'
        });
      }
    });

    clearInterval(tickTimer);
    const totalSec = Math.round((Date.now() - startMs) / 1000);
    const candName = finalPayload.activeCv?.profile?.candidateName || candidateName || 'Candidate';
    renderProcessingScreenState({
      stageKey: 'saving', percent: 100, message: `✅ Ready! Welcome aboard, ${candName}!`,
      detail: `Generated tailored Fake Jobs, 15 Interviewers & 20-Day Path in ${totalSec}s.`, etaSeconds: 0, elapsedSeconds: totalSec, mode: 'done'
    });

    state.onbCvFile = null;
    if ($('#onb-cv-selected-file')) $('#onb-cv-selected-file').hidden = true;
    if ($('#onb-cv-paste-input')) $('#onb-cv-paste-input').value = '';
    if ($('#onb-notes-input')) $('#onb-notes-input').value = '';

    await new Promise((r) => setTimeout(r, 750));
    onBundleApplied(finalPayload);
    switchToView('view-path');
  } catch (err) {
    clearInterval(tickTimer);
    const totalSec = Math.round((Date.now() - startMs) / 1000);
    renderProcessingScreenState({
      stageKey: lastStageKey, percent: lastPercent, message: `Processing paused: ${err.message}`,
      detail: 'Make sure Ollama is running locally or choose a lighter model, then try again.', etaSeconds: 0, elapsedSeconds: totalSec, mode: 'error'
    });
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function uploadAndAnalyzeCv() {
  const btn = $('#btn-upload-cv');
  const prevLabel = btn.textContent;
  const plainText = $('#cv-paste-input')?.value.trim() || '';
  if (!state.cvUploadFile && plainText.length < 40) {
    cvTracker.setStage('extract', { error: true });
    cvTracker.update({ icon: '⚠️', message: 'Choose a CV file (.pdf, .docx, .md, .txt) or paste CV text first.', percent: 0, mode: 'error' });
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Analyzing CV & Rebuilding 20-Day Path...';
  let lastStage = 'extract';
  const finishTimer = cvTracker.startTimer();

  try {
    const plannerModel = $('#cv-planner-model')?.value || $('#planner-model-select')?.value || '';
    const visionModel = $('#vision-model-select')?.value || $('#settings-vision-model')?.value || '';
    cvTracker.setStage('extract');
    cvTracker.update({ icon: '📄', message: `Uploading & parsing ${state.cvUploadFile?.name || 'pasted CV'}...`, detail: `Analyzer: ${plannerModel || 'recommended model'}`, percent: 8, mode: 'running' });

    const finalPayload = await streamCvUpload({
      filename: state.cvUploadFile?.name || 'pasted-cv.md',
      base64Data: state.cvUploadFile?.base64Data || '',
      plainText,
      plannerModel,
      visionModel,
      notes: $('#cv-notes-input')?.value.trim() || '',
      onProgress: (ev) => {
        lastStage = ev.stageKey || lastStage;
        cvTracker.setStage(lastStage);
        const etaSuffix = typeof ev.etaSeconds === 'number' ? ` · ~${ev.etaSeconds}s left` : '';
        cvTracker.update({
          icon: lastStage === 'path' ? '🗺️' : lastStage === 'profile' ? '🧠' : lastStage === 'saving' ? '💾' : '📄',
          message: ev.message || 'Analyzing CV...', detail: `${ev.detail || ''}${etaSuffix}`, percent: ev.percent ?? 25, mode: 'running'
        });
      }
    });

    const sec = finishTimer();
    cvTracker.setStage('saving', { done: true });
    onBundleApplied(finalPayload);
    state.cvUploadFile = null;
    if ($('#cv-selected-file')) $('#cv-selected-file').hidden = true;
    if ($('#cv-paste-input')) $('#cv-paste-input').value = '';
    if ($('#cv-notes-input')) $('#cv-notes-input').value = '';
    cvTracker.update({
      icon: '✅', message: `Ready in ${sec}s! Activated ${state.activeCv.versionLabel}, built Fake Jobs & rebuilt 20-Day Path.`,
      detail: 'Your Daily Path, 15 Interviewers & Fake Jobs are now tailored to this CV.', percent: 100, mode: 'done'
    });
  } catch (err) {
    finishTimer();
    cvTracker.setStage(lastStage, { error: true });
    cvTracker.update({ icon: '❌', message: `Error: ${err.message}`, detail: 'Try verifying Ollama is running or pasting CV text directly.', percent: 0, mode: 'error' });
  } finally {
    btn.disabled = false;
    btn.textContent = prevLabel;
  }
}

function wireCvInputAndDropzone(inputSel, dropzoneSel, stateKey, badgeSel) {
  $(inputSel)?.addEventListener('change', (e) => {
    if (e.target.files?.length) readCvFileToState(e.target.files, stateKey, badgeSel);
    e.target.value = '';
  });
  wireDropzone($(dropzoneSel), (files) => readCvFileToState(files, stateKey, badgeSel));
}

export function setOnboardingStep(step = 1) {
  const isStep2 = Number(step) === 2;
  const setupPanel = $('#onb-step-setup');
  const cvPanel = $('#onb-step-cv');
  const step1Btn = $('#btn-onb-step-1');
  const step2Btn = $('#btn-onb-step-2');

  if (setupPanel) setupPanel.hidden = isStep2;
  if (cvPanel) cvPanel.hidden = !isStep2;

  if (step1Btn) {
    step1Btn.classList.toggle('is-active', !isStep2);
    if (!isStep2) step1Btn.setAttribute('aria-current', 'step');
    else step1Btn.removeAttribute('aria-current');
  }
  if (step2Btn) {
    step2Btn.classList.toggle('is-active', isStep2);
    if (isStep2) step2Btn.setAttribute('aria-current', 'step');
    else step2Btn.removeAttribute('aria-current');
  }

  if ($('#onb-hero-badge')) {
    $('#onb-hero-badge').textContent = isStep2 ? '📄 Welcome · Step 2 of 2' : '👋 Welcome · Step 1 of 2';
  }
  if ($('#onb-hero-title')) {
    $('#onb-hero-title').textContent = isStep2 ? 'Upload Your CV & Build Your Arena' : 'Set Up Local AI & Voice First';
  }
  if ($('#onb-hero-subtitle')) {
    $('#onb-hero-subtitle').textContent = isStep2
      ? 'Upload your CV once (any tech or product role). Local AI will tailor your interviewer panel, realistic Fake Jobs, and 20-Day Training Path.'
      : 'Everything runs 100% locally on your machine. Verify Ollama & ZONOS3-Mini voice below, then upload your CV to build your 20-Day Training Path.';
  }
}

export function wireCvAndOnboardingEvents({ switchToView, applyCvCatalogBundle }) {
  onBundleApplied = applyCvCatalogBundle;
  wireCvInputAndDropzone('#cv-file-input', '#cv-dropzone', 'cvUploadFile', '#cv-selected-file');
  wireCvInputAndDropzone('#onb-cv-file-input', '#onb-cv-dropzone', 'onbCvFile', '#onb-cv-selected-file');

  $('#btn-onb-step-1')?.addEventListener('click', () => setOnboardingStep(1));
  $('#btn-onb-step-2')?.addEventListener('click', () => setOnboardingStep(2));
  $('#btn-onb-next-cv')?.addEventListener('click', () => setOnboardingStep(2));
  $('#btn-onb-back-setup')?.addEventListener('click', () => setOnboardingStep(1));

  $('#btn-upload-cv')?.addEventListener('click', uploadAndAnalyzeCv);
  $('#onboarding-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitOnboardingCv(switchToView);
  });
  $('#btn-proc-back')?.addEventListener('click', () => {
    setOnboardingStep(2);
    switchToView('view-onboarding');
  });
  $('#btn-proc-setup')?.addEventListener('click', () => {
    setOnboardingStep(1);
    switchToView('view-onboarding');
  });
  $('#btn-about-go-path')?.addEventListener('click', () => switchToView('view-path'));
  setOnboardingStep(1);
}
