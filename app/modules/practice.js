import { apiJson, esc, fillSelectOptions } from '../components.js';
import { $, $$, state, getCandidateIdentity } from './state.js';
import { buildCharacterSvgHtml } from './avatar.js';
import { speakEnglish, ensureMediaStream } from './voice-media.js';
import { startSession } from './call-arena.js';

function getFilteredLogicPuzzles() {
  const puzzles = state.catalog?.logicCatalog?.puzzles || [];
  const cat = $('#logic-category-select')?.value || 'Any';
  return puzzles.filter((p) => {
    if (state.logicDiffFilter !== 'ALL' && p.difficulty !== state.logicDiffFilter) return false;
    if (cat !== 'Any' && p.category !== cat) return false;
    return true;
  });
}

function getSelectedLogicPuzzle() {
  const puzzles = state.catalog?.logicCatalog?.puzzles || [];
  return puzzles.find((p) => p.id === state.selectedLogicPuzzleId) || getFilteredLogicPuzzles()[0] || puzzles[0] || null;
}

function renderSelectedLogicPreview() {
  const preview = $('#logic-selected-preview');
  const puzzle = getSelectedLogicPuzzle();
  if (!preview) return;
  if (!puzzle) {
    preview.hidden = true;
    return;
  }
  state.selectedLogicPuzzleId = puzzle.id;
  preview.hidden = false;
  if ($('#logic-preview-diff')) $('#logic-preview-diff').textContent = `⏱️ ${puzzle.durationMinutes || 10} min`;
  if ($('#logic-preview-cat')) $('#logic-preview-cat').textContent = puzzle.category;
  if ($('#logic-preview-title')) $('#logic-preview-title').textContent = puzzle.title;
  if ($('#logic-preview-prompt')) $('#logic-preview-prompt').textContent = puzzle.prompt;
  if ($('#logic-preview-constraints')) {
    $('#logic-preview-constraints').innerHTML = (puzzle.constraints || []).map((c) => `<li>${esc(c)}</li>`).join('');
  }
}

export function renderPracticeLogicCatalog() {
  const lc = state.catalog?.logicCatalog;
  if (!lc) return;
  const catSel = $('#logic-category-select');
  if (catSel && catSel.options.length === 0) {
    fillSelectOptions(catSel, [{ id: 'Any', label: 'All Categories' }, ...(lc.categories || [])], {
      selectedValue: 'Any', getValue: (c) => c.id, getLabel: (c) => c.label
    });
  }
  const genDiffSel = $('#logic-gen-diff-select');
  if (genDiffSel && genDiffSel.options.length === 0) {
    fillSelectOptions(genDiffSel, lc.difficulties || [], {
      selectedValue: '10min', getValue: (d) => d.id, getLabel: (d) => d.label
    });
  }

  const allPuzzles = lc.puzzles || [];
  const filtered = getFilteredLogicPuzzles();
  if ($('#logic-puzzle-count')) $('#logic-puzzle-count').textContent = `${filtered.length} / ${allPuzzles.length} Puzzles`;
  if (!filtered.some((p) => p.id === state.selectedLogicPuzzleId) && filtered[0]) state.selectedLogicPuzzleId = filtered[0].id;

  const grid = $('#logic-puzzles-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const p of filtered) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `logic-puzzle-card ${p.id === state.selectedLogicPuzzleId ? 'is-selected' : ''}`;
    btn.dataset.puzzleId = p.id;
    btn.innerHTML = `
      <div class="logic-card-meta">
        <span class="logic-diff-pill is-${esc(p.difficulty)}">⏱️ ${p.durationMinutes || 10} min</span>
        <span class="badge">${esc(p.category)}</span>
        ${p.isCustom ? '<span class="badge badge-green">✨ AI</span>' : ''}
      </div>
      <h4 class="logic-card-title">${esc(p.title)}</h4>
      <p class="logic-card-snippet">${esc(p.prompt)}</p>
    `;
    btn.addEventListener('click', () => {
      state.selectedLogicPuzzleId = p.id;
      renderPracticeLogicCatalog();
    });
    grid.appendChild(btn);
  }
  renderSelectedLogicPreview();
}

export function syncPracticeGuestUi() {
  const isGuest = Boolean($('#practice-guest-toggle')?.checked);
  if ($('#practice-memory-section')) $('#practice-memory-section').hidden = isGuest;
  if ($('#practice-guest-notice')) $('#practice-guest-notice').hidden = !isGuest;
  if ($('#practice-mode-badge')) {
    $('#practice-mode-badge').textContent = isGuest
      ? (state.practiceTrack === 'logic' ? '🧑 Guest · 🧩 Logic Practice (No Save)' : '🧑 Guest Mode · No Memory Saved')
      : (state.practiceTrack === 'logic' ? '🧩 Timed Logic + Shared Scratchpad' : '💬 Personalized English Practice');
  }
}

export function syncPracticeTrackUi() {
  const isLogic = state.practiceTrack === 'logic';
  if ($('#practice-conversation-controls')) $('#practice-conversation-controls').hidden = isLogic;
  if ($('#practice-logic-panel')) $('#practice-logic-panel').hidden = !isLogic;

  for (const tab of $$('.practice-track-tab')) {
    const active = tab.dataset.practiceTrack === state.practiceTrack;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  }
  for (const btn of $$('#tutor-teachers-grid .btn-start-tutor')) {
    btn.textContent = isLogic ? '🧩 Solve in Call ▶' : '🎧 Start Lesson ▶';
  }
  syncPracticeGuestUi();
}

async function startLogicCallWithTeacher(teacherObj = null) {
  const puzzle = getSelectedLogicPuzzle();
  if (!puzzle) return;
  const teachers = state.catalog?.tutorCatalog?.teachers || [];
  const teacher = teacherObj || teachers.find((t) => t.id === state.selectedLogicTeacherId) || teachers[0];
  if (!teacher) return;
  const isGuest = Boolean($('#practice-guest-toggle')?.checked);
  await ensureMediaStream().catch(() => {});
  await startSession({
    mode: 'logic',
    guestMode: isGuest,
    tutorTeacherId: teacher.id,
    tutorTeacher: teacher,
    logicPuzzle: puzzle,
    voice: teacher.voice,
    topic: puzzle.category,
    title: isGuest ? `${teacher.name} (Guest · 🧩 ${puzzle.title})` : `${teacher.name} · 🧩 ${puzzle.title}`,
    continuous: true
  });
}

async function generateNewLogicPuzzle() {
  const btn = $('#btn-generate-logic-puzzle');
  if (!btn) return;
  const prevLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Generating AI Puzzle...';
  try {
    const difficulty = $('#logic-gen-diff-select')?.value || (state.logicDiffFilter !== 'ALL' ? state.logicDiffFilter : '10min');
    const category = $('#logic-category-select')?.value || 'Any';
    const data = await apiJson('/api/practice/logic/generate', {
      model: state.user?.selectedModel || 'qwen3.5:9b',
      difficulty,
      category,
      guestMode: Boolean($('#practice-guest-toggle')?.checked)
    });
    if (state.catalog?.logicCatalog && Array.isArray(data.puzzles)) state.catalog.logicCatalog.puzzles = data.puzzles;
    if (data.puzzle?.id) {
      state.logicDiffFilter = 'ALL';
      for (const chip of $$('#logic-diff-chips .chip')) chip.classList.toggle('is-active', chip.dataset.logicDiff === 'ALL');
      state.selectedLogicPuzzleId = data.puzzle.id;
    }
    renderPracticeLogicCatalog();
  } catch (err) {
    alert(`Failed to generate logic puzzle: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = prevLabel;
  }
}

export function renderTutorMemoryCard(mem) {
  const body = $('#tutor-memory-body');
  if (!body || !mem) return;
  if ($('#tutor-map-updated')) $('#tutor-map-updated').textContent = mem.updatedAt ? `Updated ${mem.updatedAt}` : 'Background Observer Ready';

  const cm = mem.cognitiveMap || {};
  const hobbies = mem.hobbies || [];
  const facts = mem.facts || [];
  const scores = mem.topicScores || [];
  const recent = mem.recentAngles || [];

  const hobbyHtml = hobbies.length
    ? hobbies.map((h) => `<span class="hobby-chip">${esc(h)} <button type="button" data-del-hobby="${esc(h)}" title="Remove interest">×</button></span>`).join('')
    : '<span class="muted">Mention a hobby or passion in a chat — Sarah/Claire/Hannah will remember it for analogies.</span>';
  const scoresHtml = scores.length
    ? scores.map((s) => `<div class="topic-score-row"><span>${esc(s.topic)}</span><span class="score-pills-inline"><span class="score-mini-pill" title="Interest level">❤️ ${s.engagement}/10</span><span class="score-mini-pill is-fluency" title="English fluency">🗣️ ${s.fluency}/10</span></span></div>`).join('')
    : '<span class="muted">Topics get scored automatically after a few conversation turns.</span>';
  const factsHtml = facts.length
    ? `<ul class="about-sub-list">${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
    : '<span class="muted">Teacher notes about your projects, goals, and stories appear here silently.</span>';

  body.innerHTML = `
    <div class="memory-map-grid">
      <div class="memory-block">
        <h5>🧭 Thinking &amp; Explanation Map</h5>
        <div><strong>Thinking style:</strong> ${esc(cm.thinkingStyle || 'Observing...')}</div>
        <div><strong>Best explanations:</strong> ${esc(cm.explanationPreference || 'Balanced rules + examples')}</div>
        <div><strong>Preferred tone:</strong> ${esc(cm.tonePreference || 'Grounded, no fake hype')}</div>
        ${cm.summary ? `<p class="muted" style="margin:0.2rem 0 0 0;">${esc(cm.summary)}</p>` : ''}
      </div>
      <div class="memory-block">
        <h5>💡 Interests &amp; Hobbies (Analogy Anchors)</h5>
        <div class="hobby-chip-row">${hobbyHtml}</div>
        ${recent.length ? `<small class="muted" style="margin-top:0.25rem;"><strong>Recent rotated topics:</strong> ${esc(recent.slice(0, 3).join(' · '))}</small>` : ''}
      </div>
      <div class="memory-block">
        <h5>📊 Topic Engagement &amp; Fluency Scores</h5>
        <div class="topic-score-list">${scoresHtml}</div>
      </div>
      <div class="memory-block">
        <h5>📝 Teacher Notes About You</h5>
        ${factsHtml}
      </div>
    </div>
  `;

  body.querySelectorAll('[data-del-hobby]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const updated = await apiJson('/api/tutor/memory', { removeHobby: btn.dataset.delHobby });
      if (state.catalog) state.catalog.studentMemory = updated;
      renderTutorMemoryCard(updated);
    });
  });
}

export async function refreshTutorMemory() {
  try {
    const mem = await apiJson('/api/tutor/memory', null, 'GET');
    if (state.catalog) state.catalog.studentMemory = mem;
    renderTutorMemoryCard(mem);
  } catch {}
}

export function renderTutorStudio() {
  const catalog = state.catalog?.tutorCatalog;
  if (!catalog) return;
  fillSelectOptions($('#tutor-topic-select'), catalog.topics || [], {
    selectedValue: $('#tutor-topic-select')?.value || catalog.topics?.[0]?.id || '',
    getValue: (t) => t.id,
    getLabel: (t) => t.label
  });
  fillSelectOptions($('#tutor-level-select'), catalog.levels || [], {
    selectedValue: $('#tutor-level-select')?.value || 'B2-C1',
    getValue: (l) => l.id,
    getLabel: (l) => l.label
  });

  const grid = $('#tutor-teachers-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const teacher of catalog.teachers || []) {
    const teacherAppearance = {
      id: teacher.hairStyle,
      hairStyle: teacher.hairStyle,
      glasses: teacher.glasses || 'none',
      headset: teacher.headset || 'none',
      tie: false,
      hairColor: { hairA: teacher.palette?.hairA, hairB: teacher.palette?.hairB },
      eyeColor: { id: 'warm', iris: teacher.palette?.iris || '#4d6b43', ring: teacher.palette?.ring || '#2d4226' },
      ...(teacher.palette || {}),
      sig: teacher.id
    };
    const svgHtml = buildCharacterSvgHtml(
      { id: teacher.id, avatarName: teacher.avatarName, gender: 'female', badgeText: 'TUTOR', palette: teacher.palette },
      'tutor', 'female', teacherAppearance
    );

    const card = document.createElement('article');
    card.className = 'tutor-card';
    card.innerHTML = `
      <div class="tutor-card-head">
        <div class="tutor-svg-frame" style="background:linear-gradient(135deg, ${esc(teacher.palette?.bgA || '#ecfdf5')}, ${esc(teacher.palette?.bgB || '#d1fae5')});">${svgHtml}</div>
        <div class="tutor-card-meta">
          <span class="badge badge-green" style="align-self:flex-start;">${esc(teacher.accent)}</span>
          <h4>${esc(teacher.name)}</h4>
          <small class="muted">${esc(teacher.specialty)}</small>
        </div>
      </div>
      <p class="tutor-bio">${esc(teacher.bio)}</p>
      <div class="tutor-card-actions">
        <button type="button" class="btn btn-secondary btn-hear-teacher">🔊 Voice</button>
        <button type="button" class="btn btn-green btn-start-tutor">🎧 Start Lesson ▶</button>
      </div>
    `;

    card.querySelector('.btn-hear-teacher')?.addEventListener('click', () => {
      const isGuest = Boolean($('#practice-guest-toggle')?.checked);
      const { firstName } = getCandidateIdentity();
      state.activeSession.voice = teacher.voice;
      speakEnglish(`Hi ${isGuest ? 'Guest' : firstName}! I'm ${teacher.name}. Let's relax, chat in English, and polish any grammar slips together!`, { force: true });
    });

    card.querySelector('.btn-start-tutor')?.addEventListener('click', async () => {
      const isGuest = Boolean($('#practice-guest-toggle')?.checked);
      if (state.practiceTrack === 'logic') {
        state.selectedLogicTeacherId = teacher.id;
        await startLogicCallWithTeacher(teacher);
        return;
      }
      const topicId = $('#tutor-topic-select')?.value || 'fresh-rotate';
      const custom = $('#tutor-custom-topic')?.value.trim() || '';
      const level = $('#tutor-level-select')?.value || 'B2-C1';
      const topicObj = (catalog.topics || []).find((tp) => tp.id === topicId);
      const chosenTitle = custom || topicObj?.label || 'English Conversation';
      await ensureMediaStream().catch(() => {});
      await startSession({
        mode: 'tutor',
        guestMode: isGuest,
        tutorTeacherId: teacher.id,
        tutorTeacher: teacher,
        tutorTopic: custom || topicId,
        tutorLevel: level,
        voice: teacher.voice,
        topic: topicId,
        title: isGuest ? `${teacher.name} (Guest): ${chosenTitle}` : `${teacher.name}: ${chosenTitle}`,
        continuous: true
      });
    });

    grid.appendChild(card);
  }
  renderPracticeLogicCatalog();
  renderTutorMemoryCard(state.catalog?.studentMemory || null);
  syncPracticeTrackUi();
  syncPracticeGuestUi();
}

export function wirePracticeEvents() {
  $('#btn-tutor-add-hobby')?.addEventListener('click', async () => {
    const inp = $('#tutor-add-hobby-input');
    const val = inp?.value.trim() || '';
    if (!val) return;
    const updated = await apiJson('/api/tutor/memory', { addHobby: val });
    if (inp) inp.value = '';
    if (state.catalog) state.catalog.studentMemory = updated;
    renderTutorMemoryCard(updated);
  });
  $('#btn-tutor-reset-map')?.addEventListener('click', async () => {
    const updated = await apiJson('/api/tutor/memory', null, 'DELETE');
    if (state.catalog) state.catalog.studentMemory = updated;
    renderTutorMemoryCard(updated);
  });
  $('#practice-guest-toggle')?.addEventListener('change', syncPracticeGuestUi);

  for (const tab of $$('#practice-track-tabs .practice-track-tab')) {
    tab.addEventListener('click', () => {
      state.practiceTrack = tab.dataset.practiceTrack || 'conversation';
      syncPracticeTrackUi();
    });
  }
  for (const chip of $$('#logic-diff-chips .chip')) {
    chip.addEventListener('click', () => {
      state.logicDiffFilter = chip.dataset.logicDiff || 'ALL';
      for (const c of $$('#logic-diff-chips .chip')) c.classList.toggle('is-active', c === chip);
      renderPracticeLogicCatalog();
    });
  }
  $('#logic-category-select')?.addEventListener('change', renderPracticeLogicCatalog);
  $('#btn-generate-logic-puzzle')?.addEventListener('click', generateNewLogicPuzzle);
  $('#btn-start-logic-call')?.addEventListener('click', () => startLogicCallWithTeacher());
}
