/**
 * Senior Role Knowledge Base Playbook Modal
 * Lets candidates inspect senior benchmarks, frameworks, probing traps, and red flags for ANY tech-company role.
 */

import { esc } from '../components.js';
import { $, state } from './state.js';
import { ROLE_TRACK_GROUPS, ROLE_ARCHETYPES, getTopicUiLabels } from '/shared/role-archetypes.mjs';
import { getRoleKnowledgeBase } from '/shared/role-knowledge.mjs';
import { getAllTechStackKbs, TECH_STACK_KBS, DEFAULT_TECH_STACK_MAP } from '/shared/kb-tech-stacks.mjs';

const TOPIC_ORDER = ['HR', 'Behavioral', 'Technical', 'Live Coding', 'System Design', 'Negotiation'];
let activeTechChipId = null;

function populatePlaybookRoleSelect(sel, selectedKey) {
  if (!sel) return;
  if (sel.options.length === 0) {
    sel.innerHTML = ROLE_TRACK_GROUPS.map(
      (g) => `<optgroup label="${esc(g.group)}">${g.roles.map((r) => `<option value="${esc(r.id)}">${esc(r.label)}</option>`).join('')}</optgroup>`
    ).join('');
  }
  sel.value = Object.hasOwn(ROLE_ARCHETYPES, selectedKey) ? selectedKey : 'general';
}

export function renderRolePlaybook(archKeyOverride = null) {
  const activeKey = archKeyOverride || $('#playbook-role-select')?.value || state.catalog?.effectiveArchKey || 'general';
  const safeKey = Object.hasOwn(ROLE_ARCHETYPES, activeKey) ? activeKey : 'general';
  const arch = ROLE_ARCHETYPES[safeKey] || ROLE_ARCHETYPES.general;
  const kb = getRoleKnowledgeBase(safeKey);
  const topicLabels = getTopicUiLabels(safeKey);

  populatePlaybookRoleSelect($('#playbook-role-select'), safeKey);
  const titleEl = $('#role-playbook-title');
  if (titleEl) titleEl.textContent = `📚 Senior Knowledge Base — ${arch.label}`;
  const badgeEl = $('#playbook-category-badge');
  if (badgeEl) badgeEl.textContent = String(arch.category || 'engineering').toUpperCase();

  const body = $('#role-playbook-body');
  if (!body) return;

  const frameworksHtml = (kb.mentalModels || [])
    .map((m) => `<li>${esc(m)}</li>`)
    .join('');

  const probesHtml = (kb.probeLadders || [])
    .map(
      (p) => `<div class="playbook-probe-card">
        <div class="playbook-probe-claim"><strong>Surface claim:</strong> "${esc(p.claim)}"</div>
        <div class="playbook-probe-push"><strong>Senior follow-up:</strong> ${esc(p.probe)}</div>
      </div>`
    )
    .join('');

  const roundsHtml = TOPIC_ORDER.map((t) => {
    const rubric = kb.roundRubrics?.[t];
    if (!rubric) return '';
    return `<div class="playbook-round-card">
      <span class="playbook-round-tag">${esc(topicLabels[t] || t)}</span>
      <p>${esc(rubric)}</p>
    </div>`;
  }).join('');

  const redFlagsHtml = (kb.redFlags || []).map((f) => `<li>${esc(f)}</li>`).join('');
  const phrasesHtml = (kb.powerPhrases || []).map((p) => `<blockquote>"${esc(p)}"</blockquote>`).join('');
  const allStacks = getAllTechStackKbs();
  const defaultStack = DEFAULT_TECH_STACK_MAP[safeKey]?.[0] || allStacks[0]?.id || 'typescript';
  const currentStackId = (activeTechChipId && TECH_STACK_KBS[activeTechChipId]) ? activeTechChipId : defaultStack;
  const currentStack = TECH_STACK_KBS[currentStackId] || allStacks[0];
  const stackChipsHtml = allStacks
    .map((s) => `<button type="button" class="playbook-stack-pill${s.id === currentStack.id ? ' is-active' : ''}" data-stack-id="${esc(s.id)}">${esc(s.label)}</button>`)
    .join('');

  body.innerHTML = `
    <div class="playbook-mandate-box">
      <small class="playbook-eyebrow">TOP 5% SENIOR HIRING BAR</small>
      <p>${esc(kb.mandate)}</p>
    </div>

    <section class="playbook-section">
      <h4>🧠 Core Frameworks, Metrics &amp; Benchmarks</h4>
      <ul class="playbook-list">${frameworksHtml}</ul>
    </section>

    <section class="playbook-section">
      <h4>🎯 How Senior Interviewers Push Deeper (Probe Ladders)</h4>
      <div class="playbook-probes-grid">${probesHtml}</div>
    </section>

    <section class="playbook-section">
      <h4>🗺️ Round-by-Round Evaluation Guide</h4>
      <div class="playbook-rounds-grid">${roundsHtml}</div>
    </section>

    <div class="playbook-two-col">
      <section class="playbook-section is-warn">
        <h4>🚩 Red Flags That Trigger Downgrade</h4>
        <ul class="playbook-list">${redFlagsHtml}</ul>
      </section>
      <section class="playbook-section is-gold">
        <h4>💬 Executive / Senior Framing Examples</h4>
        <div class="playbook-phrases">${phrasesHtml}</div>
      </section>
    </div>

    <section class="playbook-section playbook-stack-explorer">
      <h4>🛠️ Built-In Language, Mobile &amp; Web Technology Knowledge Base (${allStacks.length} Stacks)</h4>
      <div class="playbook-stack-pills">${stackChipsHtml}</div>
      <div class="playbook-stack-detail">
        <div><strong>Common Senior Traps (${esc(currentStack.label)}):</strong> ${esc(currentStack.pitfalls)}</div>
        <div><strong>What Interviewers Probe:</strong> ${esc(currentStack.probe)}</div>
      </div>
    </section>
  `;

  body.querySelectorAll('.playbook-stack-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTechChipId = btn.dataset.stackId || null;
      renderRolePlaybook(safeKey);
    });
  });
}

export function openRolePlaybookModal(archKey = null) {
  const dlg = $('#role-playbook-dialog');
  if (!dlg) return;
  activeTechChipId = null;
  const targetKey = archKey || state.catalog?.effectiveArchKey || 'general';
  renderRolePlaybook(targetKey);
  if (typeof dlg.showModal === 'function' && !dlg.open) {
    dlg.showModal();
  }
}

export function wireRolePlaybookEvents() {
  $('#btn-role-playbook')?.addEventListener('click', () => openRolePlaybookModal());
  $('#btn-lobby-playbook')?.addEventListener('click', () => openRolePlaybookModal());
  $('#playbook-role-select')?.addEventListener('change', (e) => {
    activeTechChipId = null;
    renderRolePlaybook(e.target.value);
  });
}
