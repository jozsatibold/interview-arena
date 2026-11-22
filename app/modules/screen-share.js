/**
 * Interviewer Screen-Share Artifact Panel (`EXP-07`)
 * Renders numbered technical code/architecture briefs safely and tracks highlighted lines.
 */

import { esc, fillSelectOptions } from '../components.js';
import { $, state } from './state.js';
import { getArtifactsForTopic, findArtifactById, isScreenShareAllowedTopic } from '../../shared/interview-artifacts.mjs';
import { getRoleCategory } from '../../shared/role-archetypes.mjs';

export function isScreenShareOpen() {
  return Boolean(state.screenShareOpen);
}

export function setScreenShareOpen(open) {
  const topic = state.activeSession?.topic || '';
  const allowed = state.activeSession?.mode === 'interview' && isScreenShareAllowedTopic(topic);
  state.screenShareOpen = Boolean(open && allowed);

  const panel = $('#call-screenshare-panel');
  const layout = $('#arena-layout');
  const btn = $('#btn-toggle-screenshare');
  if (panel) panel.hidden = !state.screenShareOpen;
  if (layout) layout.classList.toggle('screenshare-open', state.screenShareOpen);
  if (btn) {
    btn.classList.toggle('is-active', state.screenShareOpen);
    btn.setAttribute('aria-expanded', String(state.screenShareOpen));
  }
}

export function renderScreenShareForTopic(topic) {
  const allowed = state.activeSession?.mode === 'interview' && isScreenShareAllowedTopic(topic);
  const btn = $('#btn-toggle-screenshare');
  if (btn) btn.hidden = !allowed;
  if (!allowed) {
    setScreenShareOpen(false);
    return;
  }

  const archKey = state.catalog?.effectiveArchKey || 'general';
  const cat = getRoleCategory(archKey);
  const notesEl = $('#screenshare-notes');
  if (notesEl) {
    notesEl.placeholder = cat === 'executive'
      ? 'Optional executive notes, trade-offs, or board talking points (sent to interviewer)...'
      : cat === 'product'
        ? 'Optional product notes, metrics, or prioritization trade-offs (sent to interviewer)...'
        : cat === 'gtm'
          ? 'Optional GTM notes, pipeline math, or positioning trade-offs (sent to interviewer)...'
          : cat === 'solutions'
            ? 'Optional discovery notes, PoC exit criteria, or integration trade-offs (sent to interviewer)...'
            : (cat === 'tpm' || cat === 'csm' || cat === 'people' || archKey === 'em')
              ? 'Optional action plan, stakeholder trade-offs, or risk mitigations (sent to interviewer)...'
              : 'Optional quick notes on this code/architecture (sent to interviewer)...';
  }
  const artifacts = getArtifactsForTopic(topic, archKey);
  if (state.activeSession && !artifacts.some((a) => a.id === state.activeSession.screenShareId) && artifacts[0]) {
    state.activeSession.screenShareId = artifacts[0].id;
    state.activeSession.highlightedLines = [];
  }
  const sel = $('#screenshare-artifact-select');
  if (sel) {
    fillSelectOptions(sel, artifacts, {
      selectedValue: state.activeSession.screenShareId || artifacts[0]?.id || '',
      getValue: (a) => a.id,
      getLabel: (a) => `${a.kind} · ${a.title}`
    });
  }
  renderActiveArtifactLines();
}

export function renderActiveArtifactLines() {
  const artifact = findArtifactById(state.activeSession?.screenShareId);
  const titleEl = $('#screenshare-title');
  const hintEl = $('#screenshare-hint');
  const codeEl = $('#screenshare-code-lines');
  if (!artifact || !codeEl) return;

  if (titleEl) titleEl.textContent = `${artifact.kind}: ${artifact.title}`;
  if (hintEl) hintEl.textContent = artifact.promptHint || '';
  const highlighted = new Set(state.activeSession?.highlightedLines || []);

  codeEl.innerHTML = artifact.lines
    .map((line, idx) => {
      const lineNum = idx + 1;
      const activeCls = highlighted.has(lineNum) ? 'is-highlighted' : '';
      return `<button type="button" class="ss-line-btn ${activeCls}" data-line-num="${lineNum}" aria-pressed="${highlighted.has(lineNum)}">
        <span class="ss-line-num">${lineNum}</span>
        <span class="ss-line-code">${esc(line || ' ')}</span>
      </button>`;
    })
    .join('');

  codeEl.querySelectorAll('.ss-line-btn').forEach((row) => {
    row.addEventListener('click', () => {
      const num = Number(row.dataset.lineNum);
      const list = new Set(state.activeSession?.highlightedLines || []);
      if (list.has(num)) list.delete(num);
      else list.add(num);
      if (state.activeSession) {
        state.activeSession.highlightedLines = Array.from(list).sort((a, b) => a - b);
      }
      renderActiveArtifactLines();
    });
  });
}

export function getActiveScreenSharePayload() {
  if (!state.activeSession || state.activeSession.mode !== 'interview') return null;
  if (!state.screenShareOpen || !state.activeSession.screenShareId) return null;
  return {
    screenShareId: state.activeSession.screenShareId,
    highlightedLines: state.activeSession.highlightedLines || [],
    artifactNotes: $('#screenshare-notes')?.value.trim() || ''
  };
}

export function wireScreenShareEvents() {
  $('#btn-toggle-screenshare')?.addEventListener('click', () => setScreenShareOpen(!state.screenShareOpen));
  $('#btn-close-screenshare')?.addEventListener('click', () => setScreenShareOpen(false));
  $('#screenshare-artifact-select')?.addEventListener('change', (e) => {
    if (state.activeSession) {
      state.activeSession.screenShareId = e.target.value;
      state.activeSession.highlightedLines = [];
    }
    renderActiveArtifactLines();
  });
}
