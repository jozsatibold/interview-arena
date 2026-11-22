import { apiJson, esc } from '../components.js';
import { $, $$, state } from './state.js';

export function setScratchpadOpen(open) {
  state.scratchpadOpen = Boolean(open);
  const panel = $('#call-scratchpad-panel');
  const layout = $('#arena-layout');
  const toggleBtn = $('#btn-toggle-scratchpad');
  if (panel) panel.hidden = !state.scratchpadOpen;
  if (layout) layout.classList.toggle('scratchpad-open', state.scratchpadOpen);
  if (toggleBtn) {
    toggleBtn.classList.toggle('is-active', state.scratchpadOpen);
    toggleBtn.setAttribute('aria-expanded', String(state.scratchpadOpen));
  }
}

export function formatMmSs(totalSecs) {
  const s = Math.max(0, Math.floor(Number(totalSecs || 0)));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function renderLogicTimer() {
  const el = $('#logic-timer-display');
  const pill = el?.closest('.logic-timer-pill');
  if (el) el.textContent = formatMmSs(state.logicTimerSeconds);
  if (pill) pill.classList.toggle('is-low', state.logicTimerSeconds > 0 && state.logicTimerSeconds <= 60);
  if ($('#btn-logic-timer-toggle')) {
    $('#btn-logic-timer-toggle').textContent = state.logicTimerRunning ? '⏸' : '▶';
    $('#btn-logic-timer-toggle').setAttribute('aria-label', state.logicTimerRunning ? 'Pause logic timer' : 'Start logic timer');
  }
}

export function stopLogicTimer() {
  if (state.logicTimerInterval) {
    clearInterval(state.logicTimerInterval);
    state.logicTimerInterval = null;
  }
  state.logicTimerRunning = false;
  if (state.scratchpadDebounceTimer) {
    clearTimeout(state.scratchpadDebounceTimer);
    state.scratchpadDebounceTimer = null;
  }
  renderLogicTimer();
}

export function startLogicTimer(initialSeconds = null) {
  stopLogicTimer();
  if (initialSeconds !== null && initialSeconds !== undefined) {
    state.logicTimerTotalSeconds = initialSeconds;
    state.logicTimerSeconds = initialSeconds;
  }
  state.logicTimerRunning = true;
  renderLogicTimer();
  state.logicTimerInterval = setInterval(() => {
    if (!state.logicTimerRunning) return;
    if (state.logicTimerSeconds > 0) {
      state.logicTimerSeconds -= 1;
      renderLogicTimer();
    } else {
      stopLogicTimer();
    }
  }, 1000);
}

export function renderTutorPin(pinText) {
  const box = $('#scratchpad-tutor-pin');
  const textEl = $('#scratchpad-tutor-pin-text');
  if (!box || !textEl) return;
  if (!pinText) {
    box.hidden = true;
    textEl.textContent = '';
    return;
  }
  textEl.textContent = String(pinText).trim();
  box.hidden = false;
}

export function updateScratchpadSyncPill() {
  const pill = $('#scratchpad-sync-pill');
  const editor = $('#scratchpad-editor');
  if (!pill || !editor) return;
  const dirty = editor.value !== state.lastSentScratchpadText;
  pill.classList.toggle('is-dirty', dirty);
  pill.textContent = dirty ? '🟡 Unsynced edits' : '🟢 Tutor sees latest notes';
}

export function renderScratchpadForPuzzle(puzzle) {
  if (!puzzle) return;
  if ($('#scratchpad-puzzle-title')) $('#scratchpad-puzzle-title').textContent = `🧩 ${puzzle.title}`;
  if ($('#scratchpad-diff-badge')) $('#scratchpad-diff-badge').textContent = `${puzzle.durationMinutes || 10} min`;
  const probBody = $('#scratchpad-problem-body');
  if (probBody) {
    const cList = (puzzle.constraints || []).map((c) => `<li>${esc(c)}</li>`).join('');
    probBody.innerHTML = `<p style="margin:0;">${esc(puzzle.prompt)}</p>${cList ? `<ul>${cList}</ul>` : ''}`;
  }
  if ($('#logic-hint-banner')) {
    $('#logic-hint-banner').hidden = true;
    $('#logic-hint-banner').textContent = '';
  }
  state.logicHintStep = 0;
  renderTutorPin(null);

  const editor = $('#scratchpad-editor');
  const tpl = puzzle.scratchpadTemplate || 'Constraints & Variables:\n\nStep 1:\n\nStep 2:\n\nConclusion:';
  if (editor) editor.value = tpl;
  state.lastSentScratchpadText = tpl;
  updateScratchpadSyncPill();
}

export function wireScratchpadEvents(onShareNotes) {
  $('#btn-toggle-scratchpad')?.addEventListener('click', () => setScratchpadOpen(!state.scratchpadOpen));
  $('#btn-close-scratchpad')?.addEventListener('click', () => setScratchpadOpen(false));
  $('#btn-logic-timer-toggle')?.addEventListener('click', () => {
    if (state.logicTimerRunning) {
      state.logicTimerRunning = false;
      renderLogicTimer();
    } else if (state.logicTimerSeconds > 0) {
      startLogicTimer();
    }
  });
  $('#btn-logic-timer-reset')?.addEventListener('click', () => startLogicTimer(state.logicTimerTotalSeconds || 600));

  $('#btn-logic-hint')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const puzzle = state.activeSession?.logicPuzzle;
    const btn = $('#btn-logic-hint');
    if (!puzzle || !btn || btn.disabled) return;
    btn.disabled = true;
    try {
      const data = await apiJson('/api/practice/logic/hint', { logicPuzzleId: puzzle.id, step: state.logicHintStep });
      state.logicHintStep = (data.index || 0) + 1;
      const banner = $('#logic-hint-banner');
      if (banner) {
        banner.hidden = false;
        banner.textContent = `💡 Hint ${data.index + 1}/${Math.max(1, data.total || 1)}: ${data.hint}`;
      }
    } catch (err) {
      const banner = $('#logic-hint-banner');
      if (banner) {
        banner.hidden = false;
        banner.textContent = `⚠️ Could not load hint: ${err.message}`;
      }
    } finally {
      btn.disabled = false;
    }
  });

  $('#btn-apply-tutor-pin')?.addEventListener('click', () => {
    const editor = $('#scratchpad-editor');
    const pinText = $('#scratchpad-tutor-pin-text')?.textContent.trim() || '';
    if (!editor || !pinText) return;
    const sep = editor.value && !editor.value.endsWith('\n') ? '\n\n' : '\n';
    editor.value = `${editor.value}${sep}# Tutor Note:\n${pinText}\n`;
    updateScratchpadSyncPill();
    renderTutorPin(null);
    editor.focus();
  });
  $('#btn-dismiss-tutor-pin')?.addEventListener('click', () => renderTutorPin(null));

  $('#btn-scratchpad-reset')?.addEventListener('click', () => {
    const editor = $('#scratchpad-editor');
    const puzzle = state.activeSession?.logicPuzzle;
    if (!editor || !puzzle) return;
    editor.value = puzzle.scratchpadTemplate || '';
    updateScratchpadSyncPill();
  });

  for (const btn of $$('[data-sp-insert]')) {
    btn.addEventListener('click', () => {
      const editor = $('#scratchpad-editor');
      if (!editor) return;
      const snippets = {
        table: '\n| Case / Item | Observation | Conclusion |\n|---|---|---|\n| 1 |  |  |\n',
        step: '\nStep -> ',
        hyp: '\n[Hypothesis]: \n[Test / Edge case]: ',
        check: ' ✓ ',
        cross: ' ✗ '
      };
      const ins = snippets[btn.dataset.spInsert] || '';
      const start = editor.selectionStart ?? editor.value.length;
      const end = editor.selectionEnd ?? editor.value.length;
      editor.value = editor.value.slice(0, start) + ins + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start + ins.length;
      updateScratchpadSyncPill();
      editor.focus();
    });
  }

  $('#scratchpad-editor')?.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      el.value = el.value.slice(0, start) + '  ' + el.value.slice(el.selectionEnd);
      el.selectionStart = el.selectionEnd = start + 2;
      updateScratchpadSyncPill();
    }
  });

  $('#scratchpad-editor')?.addEventListener('input', () => {
    updateScratchpadSyncPill();
    if (state.scratchpadDebounceTimer) clearTimeout(state.scratchpadDebounceTimer);
    if ($('#scratchpad-auto-observe')?.checked && state.activeSession?.mode === 'logic') {
      state.scratchpadDebounceTimer = setTimeout(() => {
        if ($('#scratchpad-editor')?.value !== state.lastSentScratchpadText) onShareNotes();
      }, 4000);
    }
  });

  $('#btn-share-scratchpad')?.addEventListener('click', () => onShareNotes());
}
