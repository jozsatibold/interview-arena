import { esc, saveUserState } from '../components.js';
import { $, state } from './state.js';
import { speakEnglish } from './voice-media.js';

export function computeLeague(xp, sessions) {
  const avg = sessions.length
    ? sessions.reduce((s, x) => s + Number(x.totalScore || 0), 0) / sessions.length
    : 0;
  if (xp >= 800 && avg >= 8.5) return '💎 Top 5% Legend';
  if (xp >= 400 || avg >= 7.5) return '🥇 Top 10% Senior Challenger';
  if (xp >= 150) return '🥈 Rising Architect';
  return '🌱 Morning Warmup Contender';
}

export function renderHud() {
  const u = state.user;
  if (!u) return;
  $('#hud-streak').textContent = u.streak;
  $('#hud-xp').textContent = u.xp;
  $('#hud-gems').textContent = u.gems;
  const levelProgress = u.xp % 200;
  $('#hud-xp-fill').style.setProperty('--xp-pct', `${Math.round((levelProgress / 200) * 100)}%`);
  $('#league-name').textContent = computeLeague(u.xp, u.sessions || []);

  $('#pu-shield-count').textContent = u.powerUps?.antiFreezeShield ?? 0;
  $('#pu-hint-count').textContent = u.powerUps?.seniorHint ?? 0;
  $('#pu-retry-count').textContent = u.powerUps?.doubleXpRetry ?? 0;
}

export function showScorecardDialog(sc, xpEarned, extra = {}) {
  const s = sc.subScores || {};
  const m = extra?.speechMetrics || null;
  const deferred = Array.isArray(extra?.deferredCoachItems) ? extra.deferredCoachItems : [];

  const metricsHtml = m
    ? `<div class="scorecard-metrics-strip">
        <div class="kpi-card"><small>Pace (WPM)</small><strong>${m.wpm ? `${esc(m.wpm)} WPM` : 'Typed'}</strong><span class="muted">${esc(m.wpmBand)}</span></div>
        <div class="kpi-card"><small>Talk Ratio (You / AI)</small><strong>${esc(m.userTalkPct)}% / ${esc(m.aiTalkPct)}%</strong><span class="muted">${esc(m.userWords)} words spoken</span></div>
        <div class="kpi-card"><small>Filler Words</small><strong>${esc(m.fillerCount)} (${esc(m.fillersPer100Words)}/100w)</strong><span class="muted">${m.topFillers?.length ? esc(m.topFillers.map((f) => `${f.label}×${f.count}`).join(', ')) : 'Clean delivery'}</span></div>
        <div class="kpi-card"><small>Avg Answer Length</small><strong>${esc(m.avgTurnSec || 0)}s</strong><span class="muted">Max ${esc(m.longestTurnSec || 0)}s</span></div>
      </div>`
    : '';

  const questionsNoteHtml = sc.candidateQuestionsNote
    ? `<div class="coach-tip-card" style="margin-top:0.5rem;"><strong>❓ Candidate Questions Evaluation:</strong><p style="margin:0.2rem 0 0 0;">${esc(sc.candidateQuestionsNote)}</p></div>`
    : '';

  const deferredHtml = deferred.length
    ? `<div style="margin-top:0.65rem;">
        <h3>📋 Collected Live Coaching Notes (${esc(deferred.length)})</h3>
        <div class="deferred-coach-list">${deferred.slice(0, 12).map((item) => {
          if (item.kind === 'fix') {
            return `<div class="coach-grammar-card"><p class="grammar-said">❌ "${esc(item.data.said)}"</p><p class="grammar-better">✅ "${esc(item.data.better)}"</p>${item.data.why ? `<small class="grammar-why">${esc(item.data.why)}</small>` : ''}</div>`;
          }
          if (item.kind === 'pause') {
            return `<div class="coach-pause-card"><h4>${esc(item.data.category || 'Upgrade')}</h4><p>"${esc(item.data.original)}" → <strong>"${esc(item.data.seniorUpgrades?.[0] || '')}"</strong></p></div>`;
          }
          return `<div class="coach-tip-card"><p style="margin:0;">💡 ${esc(item.data)}</p></div>`;
        }).join('')}</div>
      </div>`
    : '';

  $('#scorecard-content').innerHTML = `
    <div class="hero-banner" style="margin-bottom:0.5rem;">
      <div>
        <h2>${esc(sc.totalScore)} / 10 — ${esc(sc.percentile)}</h2>
        <p>Verdict: <strong>${esc(sc.verdict)}</strong> • Earned <strong>+${esc(xpEarned)} XP</strong></p>
      </div>
    </div>
    <div class="stats-summary-grid">
      <div class="kpi-card"><small>English &amp; Vocab</small><strong>${esc(s.english)}/10</strong></div>
      <div class="kpi-card"><small>Analysis / Anti-Freeze</small><strong>${esc(s.analysis)}/10</strong></div>
      <div class="kpi-card"><small>Tech Depth &amp; ROI</small><strong>${esc(s.techRoi)}/10</strong></div>
      <div class="kpi-card"><small>Confidence</small><strong>${esc(s.confidence)}/10</strong></div>
    </div>
    ${metricsHtml}
    ${questionsNoteHtml}
    <div>
      <h3>✅ What Worked Well</h3>
      <ul>${(sc.strengths || sc.strengthsHu || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>❌ Gaps Blocking Top 5%</h3>
      <ul>${(sc.weaknesses || sc.weaknessesHu || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>🚀 3 Golden Senior Sentences to Memorize</h3>
      <ul>${(sc.goldenSentences || []).map((x) => `<li><strong>"${esc(x)}"</strong></li>`).join('')}</ul>
    </div>
    ${deferredHtml}
  `;
  $('#scorecard-dialog').showModal();
}

function getOwnedPowerUpCount(itemId) {
  if (itemId === 'streakFreeze') return Number(state.user?.streakFreezes ?? 0);
  return Number(state.user?.powerUps?.[itemId] ?? 0);
}

export function renderShopModal(statusMsg = '', isError = false) {
  const u = state.user || {};
  const catalog = state.catalog?.powerUpCatalog || [];
  if ($('#shop-xp-balance')) $('#shop-xp-balance').textContent = u.xp ?? 0;
  if ($('#shop-gems-balance')) $('#shop-gems-balance').textContent = u.gems ?? 0;
  if ($('#shop-freezes-balance')) $('#shop-freezes-balance').textContent = u.streakFreezes ?? 0;

  const statusEl = $('#shop-status-msg');
  if (statusEl && statusMsg) {
    statusEl.textContent = statusMsg;
    statusEl.className = `shop-status-msg ${isError ? 'is-error' : 'is-success'}`;
  } else if (statusEl) {
    statusEl.textContent = 'Spend your earned XP points or Gems to unlock interview boosts & streak shields.';
    statusEl.className = 'shop-status-msg';
  }

  const grid = $('#shop-items-grid');
  if (!grid) return;
  grid.innerHTML = catalog
    .map((item) => {
      const owned = getOwnedPowerUpCount(item.id);
      const canXp = Number(u.xp ?? 0) >= item.xpCost;
      const canGem = Number(u.gems ?? 0) >= item.gemCost;
      return `
        <article class="shop-card" data-item-id="${esc(item.id)}">
          <div class="shop-card-head">
            <span class="shop-item-title">${esc(item.icon)} ${esc(item.name)}</span>
            <span class="shop-owned-pill">Owned: <strong>${esc(owned)}</strong></span>
          </div>
          <p class="shop-item-desc">${esc(item.description)}</p>
          <div class="shop-buy-row">
            <button type="button" class="btn btn-buy-xp" data-buy-id="${esc(item.id)}" data-currency="xp" ${canXp ? '' : 'disabled'}>⚡ Buy (${esc(item.xpCost)} XP)</button>
            <button type="button" class="btn btn-buy-gems" data-buy-id="${esc(item.id)}" data-currency="gems" ${canGem ? '' : 'disabled'}>💎 Buy (${esc(item.gemCost)})</button>
          </div>
        </article>
      `;
    })
    .join('');

  grid.querySelectorAll('[data-buy-id]').forEach((btn) => {
    btn.addEventListener('click', () => buyShopPowerUp(btn.dataset.buyId, btn.dataset.currency));
  });
}

async function buyShopPowerUp(itemId, currency = 'xp') {
  const item = (state.catalog?.powerUpCatalog || []).find((p) => p.id === itemId);
  const grid = $('#shop-items-grid');
  if (grid) grid.querySelectorAll('button').forEach((b) => (b.disabled = true));
  try {
    state.user = await saveUserState({ buyPowerUp: itemId, currency });
    renderHud();
    const paidLabel = currency === 'gems' ? `${item?.gemCost || ''} 💎 Gems` : `${item?.xpCost || ''} ⚡ XP`;
    renderShopModal(`✅ Purchased 1× ${item?.name || itemId} for ${paidLabel}!`);
  } catch (err) {
    renderShopModal(`⚠️ ${err.message}`, true);
  }
}

export function openShopModal(statusMsg = '') {
  renderShopModal(statusMsg, false);
  const dlg = $('#shop-dialog');
  if (dlg && !dlg.open) dlg.showModal();
}

export async function activatePowerUp(kind) {
  if ((state.user?.powerUps?.[kind] ?? 0) <= 0) {
    const labelMap = {
      antiFreezeShield: 'Anti-Freeze 2m Shield',
      seniorHint: 'Senior Power-Verb Hint',
      doubleXpRetry: '2x XP Session Boost'
    };
    openShopModal(`You're out of ${labelMap[kind] || 'this Power-Up'} — buy more below with your XP or Gems!`);
    return;
  }
  state.user = await saveUserState({ usePowerUp: kind });
  renderHud();

  if (kind === 'antiFreezeShield') {
    clearInterval(state.shieldInterval);
    let secs = 120;
    $('#shield-timer').hidden = false;
    const tick = () => {
      $('#shield-countdown').textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      if (secs <= 0) {
        clearInterval(state.shieldInterval);
        $('#shield-countdown').textContent = 'Ready to Code!';
      }
      secs -= 1;
    };
    tick();
    state.shieldInterval = setInterval(tick, 1000);
  } else if (kind === 'seniorHint') {
    const sample = (state.catalog?.cheatsheet?.phrases || []).slice(0, 5);
    const drawer = $('#hint-drawer');
    drawer.hidden = false;
    drawer.innerHTML = `<strong>💡 Senior Time-Buying &amp; Framing Phrases:</strong><ul>${sample.map((p) => `<li>"${esc(p)}"</li>`).join('')}</ul>`;
  } else if (kind === 'doubleXpRetry') {
    state.activeSession.doubleXpActive = true;
    $('#hint-drawer').hidden = false;
    $('#hint-drawer').innerHTML = '<strong>🔄 2x XP Boost Active!</strong> All answers, retries &amp; scorecards earn double XP this call.';
  }
}

export function renderStats() {
  const sessions = state.user?.sessions || [];
  const totalSessions = sessions.length;
  const avgScore = totalSessions ? (sessions.reduce((a, b) => a + Number(b.totalScore || 0), 0) / totalSessions).toFixed(1) : '—';
  const bestScore = totalSessions ? Math.max(...sessions.map((s) => Number(s.totalScore || 0))).toFixed(1) : '—';

  $('#stats-kpis').innerHTML = `
    <div class="kpi-card"><small>Completed Drills</small><strong>${totalSessions}</strong></div>
    <div class="kpi-card"><small>Average Score</small><strong>${avgScore} / 10</strong></div>
    <div class="kpi-card"><small>Personal Best</small><strong>${bestScore} / 10</strong></div>
    <div class="kpi-card"><small>Active Mistakes</small><strong>${(state.user?.mistakes || []).filter((m) => !m.mastered).length}</strong></div>
  `;

  const chartWrap = $('#curve-chart-wrap');
  if (sessions.length === 0) {
    chartWrap.innerHTML = '<p class="muted">Complete your first 10-minute session and click "Finish &amp; Score" to plot your 1–10 growth curve.</p>';
  } else {
    const w = 520;
    const h = 190;
    const pad = 26;
    const pts = sessions.map((s, i) => ({
      x: sessions.length === 1 ? w / 2 : pad + (i / (sessions.length - 1)) * (w - pad * 2),
      y: h - pad - ((Math.max(1, Math.min(10, s.totalScore)) - 1) / 9) * (h - pad * 2),
      score: s.totalScore,
      label: s.date
    }));
    const targetY = h - pad - ((8.5 - 1) / 9) * (h - pad * 2);
    const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    chartWrap.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Score progression curve">
        <line x1="${pad}" y1="${targetY}" x2="${w - pad}" y2="${targetY}" stroke="#58cc02" stroke-dasharray="5 5" stroke-width="2" />
        <text x="${w - pad - 95}" y="${targetY - 6}" fill="#166534" font-size="11" font-weight="700">Top 5% (8.5)</text>
        <polyline fill="none" stroke="#1cb0f6" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" points="${poly}" />
        ${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="#1cb0f6" stroke="#fff" stroke-width="2"><title>${esc(p.label)}: ${p.score}/10</title></circle>`).join('')}
      </svg>
    `;
  }

  const topics = ['HR', 'Behavioral', 'Technical', 'Live Coding', 'System Design', 'Negotiation'];
  $('#topic-bars').innerHTML = topics
    .map((topic) => {
      const list = sessions.filter((s) => s.topic === topic);
      const avg = list.length ? list.reduce((a, b) => a + b.totalScore, 0) / list.length : 0;
      const pct = Math.round((avg / 10) * 100);
      return `
        <div class="bar-row">
          <div class="bar-label"><span>${esc(topic)} (${list.length} drills)</span><span>${list.length ? avg.toFixed(1) + ' / 10' : 'Not practiced'}</span></div>
          <div class="bar-track"><div class="bar-fill" style="--bar-pct: ${pct}%;"></div></div>
        </div>
      `;
    })
    .join('');

  const dims = [
    ['english', 'English Grammar & Senior Vocabulary'],
    ['analysis', 'Structured Analysis & Anti-Freeze Control'],
    ['techRoi', 'Technical Depth & Business ROI'],
    ['confidence', 'Confidence & Senior Executive Presence']
  ];
  $('#dimension-bars').innerHTML = dims
    .map(([key, label]) => {
      const vals = sessions.map((s) => s.subScores?.[key]).filter((v) => typeof v === 'number');
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const pct = Math.round((avg / 10) * 100);
      return `
        <div class="bar-row">
          <div class="bar-label"><span>${esc(label)}</span><span>${vals.length ? avg.toFixed(1) + ' / 10' : '—'}</span></div>
          <div class="bar-track"><div class="bar-fill" style="--bar-pct: ${pct}%;"></div></div>
        </div>
      `;
    })
    .join('');
}

export function renderMistakes(filterQuery = '') {
  const q = filterQuery.trim().toLowerCase();
  const mistakes = [...(state.user?.mistakes || [])].sort((a, b) => (b.count || 1) - (a.count || 1));
  const filteredMistakes = mistakes.filter((m) =>
    !q || m.original.toLowerCase().includes(q) || m.better.toLowerCase().includes(q) || m.reasonHu.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
  );

  const listEl = $('#mistakes-list');
  listEl.innerHTML = '';
  for (const m of filteredMistakes) {
    const div = document.createElement('div');
    div.className = `mistake-item ${m.mastered ? 'is-mastered' : ''}`;
    div.innerHTML = `
      <div class="mistake-meta">
        <span class="badge">${esc(m.category)} • ${m.count}x</span>
        <span class="muted">${esc(m.topic || 'General')}</span>
      </div>
      <p class="mistake-orig">❌ "${esc(m.original)}"</p>
      <p class="mistake-better">✅ "${esc(m.better)}"</p>
      <p class="muted">${esc(m.reasonHu)}</p>
      <div class="setup-actions-row">
        <button type="button" class="btn btn-secondary btn-speak-tip">🔊 Hear Senior</button>
        ${m.mastered ? '<span class="badge badge-green">Mastered (+25 XP)</span>' : '<button type="button" class="btn btn-green btn-master">Mark Mastered (+25 XP)</button>'}
      </div>
    `;
    div.querySelector('.btn-speak-tip').addEventListener('click', () => speakEnglish(m.better, { force: true }));
    div.querySelector('.btn-master')?.addEventListener('click', async () => {
      state.user = await saveUserState({ masterMistakeId: m.id });
      renderHud();
      renderMistakes($('#mistakes-search-input').value);
    });
    listEl.appendChild(div);
  }

  const upgrades = (state.catalog?.cheatsheet?.upgrades || []).filter(
    (u) => !q || u.basic.toLowerCase().includes(q) || u.senior.toLowerCase().includes(q) || u.noteHu.toLowerCase().includes(q)
  );
  $('#cheatsheet-upgrades').innerHTML = upgrades
    .map((u) => `
      <div class="upgrade-item">
        <p class="mistake-orig">B2: ${esc(u.basic)}</p>
        <p class="mistake-better">C1 Senior: ${esc(u.senior)}</p>
        <p class="muted">${esc(u.noteHu)}</p>
      </div>
    `)
    .join('');
}

export function wireStatsAndShopEvents() {
  $('#pu-shield-btn').addEventListener('click', () => activatePowerUp('antiFreezeShield'));
  $('#pu-hint-btn').addEventListener('click', () => activatePowerUp('seniorHint'));
  $('#pu-retry-btn').addEventListener('click', () => activatePowerUp('doubleXpRetry'));
  $('#pu-shop-btn')?.addEventListener('click', () => openShopModal());
  $('#open-shop-btn')?.addEventListener('click', () => openShopModal());
  $('#mistakes-search-input').addEventListener('input', (e) => renderMistakes(e.target.value));
}
