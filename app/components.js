/**
 * Shared Tactile Interview-styled UI Web Components & Client Helpers
 * Uses native Light-DOM controls so HTML form semantics, labels, focus styles,
 * and `accent-color` progress/checkbox enhancements work uniformly without duplication.
 */

export function esc(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function apiJson(url, body = null, method = body ? 'POST' : 'GET') {
  const opts = { method, headers: {} };
  if (body !== null && method !== 'GET') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function saveUserState(patch) {
  return apiJson('/api/state', patch, 'POST');
}

export async function consumeNdjsonStream(response, onObj) {
  if (!response?.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  const flushLine = (line) => {
    if (!line.trim()) return;
    const obj = JSON.parse(line);
    onObj(obj);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) flushLine(line);
  }
  buf += decoder.decode();
  if (buf.trim()) {
    for (const line of buf.split('\n')) flushLine(line);
  }
}

export function fillSelectOptions(
  selectEl,
  items,
  {
    selectedValue = '',
    getValue = (x) => (typeof x === 'string' ? x : x.value ?? x.name ?? x.id),
    getLabel = (x) => (typeof x === 'string' ? x : x.label ?? x.title ?? x.name),
    emptyLabel = ''
  } = {}
) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  if (!items || items.length === 0) {
    if (emptyLabel) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = emptyLabel;
      selectEl.appendChild(opt);
    }
    return;
  }
  for (const item of items) {
    const opt = document.createElement('option');
    const val = String(getValue(item) ?? '');
    opt.value = val;
    opt.textContent = String(getLabel(item) ?? val);
    if (selectedValue && String(selectedValue) === val) opt.selected = true;
    selectEl.appendChild(opt);
  }
  if (selectedValue) selectEl.value = String(selectedValue);
}

function moveNodes(fromEl, toEl, filterFn = null) {
  for (const node of Array.from(fromEl.childNodes)) {
    if (!filterFn || filterFn(node)) toEl.appendChild(node);
  }
}

class IntButton extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';

    const btn = document.createElement('button');
    btn.type = this.getAttribute('type') || 'button';
    const controlId = this.getAttribute('control-id');
    if (controlId) btn.id = controlId;

    const variant = this.getAttribute('variant') || 'primary';
    const extraClass = this.getAttribute('btn-class') || '';
    btn.className = `btn btn-${variant} ${extraClass}`.trim();

    if (this.hasAttribute('title')) btn.title = this.getAttribute('title');
    if (this.hasAttribute('aria-label')) btn.setAttribute('aria-label', this.getAttribute('aria-label'));
    if (this.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', this.getAttribute('aria-expanded'));
    if (this.hasAttribute('aria-controls')) btn.setAttribute('aria-controls', this.getAttribute('aria-controls'));
    if (this.hasAttribute('value')) btn.value = this.getAttribute('value');
    if (this.hasAttribute('disabled')) btn.disabled = true;
    if (this.hasAttribute('hidden')) {
      btn.hidden = true;
      this.removeAttribute('hidden');
    }
    for (const attr of this.attributes) {
      if (attr.name.startsWith('data-')) btn.setAttribute(attr.name, attr.value);
    }

    const label = this.getAttribute('label');
    if (label) {
      btn.textContent = label;
    } else {
      moveNodes(this, btn);
    }

    this.innerHTML = '';
    this.appendChild(btn);
  }
}

function buildFieldShell(host, tagName) {
  const controlId = host.getAttribute('control-id') || `ctrl-${Math.random().toString(36).slice(2, 8)}`;
  const name = host.getAttribute('name') || controlId;
  const labelText = host.getAttribute('label') || '';
  const helpText = host.getAttribute('help') || '';
  const actionId = host.getAttribute('action-id');
  const actionLabel = host.getAttribute('action-label');
  const actionVariant = host.getAttribute('action-variant') || 'secondary';

  const wrap = document.createElement('div');
  wrap.className = 'field-group int-field';

  if (labelText) {
    const label = document.createElement('label');
    label.className = 'field-label';
    label.setAttribute('for', controlId);
    label.innerHTML = labelText;
    wrap.appendChild(label);
  }

  const control = document.createElement(tagName);
  control.id = controlId;
  control.name = name;
  control.className = tagName === 'textarea' ? 'full-input jd-textarea' : 'full-input';
  if (tagName === 'input') control.type = host.getAttribute('type') || 'text';
  if (tagName === 'textarea' && host.hasAttribute('rows')) control.rows = Number(host.getAttribute('rows'));
  if (host.hasAttribute('placeholder')) control.placeholder = host.getAttribute('placeholder');
  if (host.hasAttribute('value')) control.value = host.getAttribute('value');
  if (host.hasAttribute('autocomplete')) control.setAttribute('autocomplete', host.getAttribute('autocomplete'));
  if (host.hasAttribute('required')) control.required = true;
  if (helpText) control.setAttribute('aria-describedby', `${controlId}-help`);

  const extraActions = Array.from(host.children).filter((ch) => ch.getAttribute('slot') === 'actions');
  if (actionId && actionLabel) {
    const row = document.createElement('div');
    row.className = 'pull-row';
    row.appendChild(control);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.id = actionId;
    actionBtn.className = `btn btn-${actionVariant}`;
    actionBtn.textContent = actionLabel;
    row.appendChild(actionBtn);
    for (const extra of extraActions) row.appendChild(extra);
    wrap.appendChild(row);
  } else if (extraActions.length > 0) {
    const row = document.createElement('div');
    row.className = 'pull-row';
    row.appendChild(control);
    for (const extra of extraActions) row.appendChild(extra);
    wrap.appendChild(row);
  } else {
    wrap.appendChild(control);
  }

  if (tagName === 'select') {
    moveNodes(host, control, (n) => n.nodeName === 'OPTION' || n.nodeName === 'OPTGROUP');
  }

  if (helpText) {
    const help = document.createElement('small');
    help.id = `${controlId}-help`;
    help.className = 'muted int-field-help';
    help.textContent = helpText;
    wrap.appendChild(help);
  }

  host.innerHTML = '';
  host.appendChild(wrap);
}

class IntField extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';
    buildFieldShell(this, 'input');
  }
}

class IntSelect extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';
    buildFieldShell(this, 'select');
  }
}

class IntTextarea extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';
    buildFieldShell(this, 'textarea');
  }
}

class IntToggle extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';

    const controlId = this.getAttribute('control-id') || `tgl-${Math.random().toString(36).slice(2, 8)}`;
    const labelText = this.getAttribute('label') || '';
    const desc = this.getAttribute('description') || '';
    const isChecked = this.hasAttribute('checked');

    const row = document.createElement('div');
    row.className = 'int-toggle-card';

    const textWrap = document.createElement('div');
    textWrap.className = 'int-toggle-copy';

    const lbl = document.createElement('label');
    lbl.className = 'int-toggle-title';
    lbl.setAttribute('for', controlId);
    lbl.textContent = labelText;
    textWrap.appendChild(lbl);

    if (desc) {
      const sub = document.createElement('small');
      sub.className = 'muted';
      sub.textContent = desc;
      textWrap.appendChild(sub);
    }

    const controlWrap = document.createElement('div');
    controlWrap.className = 'int-toggle-control';

    const statePill = document.createElement('span');
    statePill.className = 'int-toggle-state';
    statePill.textContent = isChecked ? 'ON' : 'OFF';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = controlId;
    input.className = 'int-toggle-input';
    input.checked = isChecked;

    const syncStateText = () => {
      statePill.textContent = input.checked ? 'ON' : 'OFF';
      row.classList.toggle('is-checked', input.checked);
    };
    input.addEventListener('change', syncStateText);
    syncStateText();

    controlWrap.appendChild(statePill);
    controlWrap.appendChild(input);

    row.appendChild(textWrap);
    row.appendChild(controlWrap);

    this.innerHTML = '';
    this.appendChild(row);
  }
}

class IntCard extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';

    const heading = this.getAttribute('heading') || '';
    const headingId = this.getAttribute('heading-id') || '';
    const badgeId = this.getAttribute('badge-id') || '';
    const badgeText = this.getAttribute('badge-text') || '';
    const badgeClass = this.getAttribute('badge-class') || 'badge';
    const extraClass = this.getAttribute('card-class') || '';

    const section = document.createElement('section');
    section.className = `card ${extraClass}`.trim();
    if (headingId) section.setAttribute('aria-labelledby', headingId);

    if (heading) {
      const head = document.createElement('div');
      head.className = 'card-head';
      const h3 = document.createElement('h3');
      if (headingId) h3.id = headingId;
      h3.textContent = heading;
      head.appendChild(h3);

      if (badgeId || badgeText) {
        const badge = document.createElement('span');
        if (badgeId) badge.id = badgeId;
        badge.className = badgeClass;
        badge.textContent = badgeText;
        head.appendChild(badge);
      }
      section.appendChild(head);
    }

    const body = document.createElement('div');
    body.className = 'int-card-body';
    moveNodes(this, body);
    section.appendChild(body);

    this.innerHTML = '';
    this.appendChild(section);
  }
}

class IntProgress extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';

    const controlId = this.getAttribute('control-id') || `prog-${Math.random().toString(36).slice(2, 7)}`;
    const stepsRaw = (this.getAttribute('steps') || '').split('|').map((s) => s.trim()).filter(Boolean);

    const panel = document.createElement('div');
    panel.id = `${controlId}-panel`;
    panel.className = 'planner-progress-panel';
    panel.hidden = true;

    const headRow = document.createElement('div');
    headRow.className = 'progress-head-row';
    headRow.innerHTML = `
      <div class="progress-title-wrap">
        <span id="${esc(controlId)}-icon" aria-hidden="true">⚙️</span>
        <label id="${esc(controlId)}-status" for="${esc(controlId)}-bar" class="progress-status-label" aria-live="polite">Ready</label>
      </div>
      <div class="progress-metrics-wrap">
        <span id="${esc(controlId)}-elapsed" class="badge">⏱️ 0.0s</span>
        <strong id="${esc(controlId)}-percent" class="progress-pct-text">0%</strong>
      </div>
    `;
    panel.appendChild(headRow);

    const bar = document.createElement('progress');
    bar.id = `${controlId}-bar`;
    bar.className = 'planner-progress-bar';
    bar.max = 100;
    bar.value = 0;
    bar.textContent = '0%';
    panel.appendChild(bar);

    if (stepsRaw.length > 0) {
      const ol = document.createElement('ol');
      ol.className = 'planner-steps-list';
      ol.innerHTML = stepsRaw
        .map((label, idx) => {
          const [keyPart, ...titleParts] = label.includes(':') ? label.split(':') : [`step${idx}`, label];
          const key = keyPart.trim();
          const title = titleParts.join(':').trim();
          return `
            <li id="${esc(controlId)}-step-${esc(key)}" class="pstep" data-state="pending">
              <span class="pstep-icon" aria-hidden="true">⏳</span>
              <span>${esc(title)}</span>
            </li>
          `;
        })
        .join('');
      panel.appendChild(ol);
    }

    const detail = document.createElement('small');
    detail.id = `${controlId}-detail`;
    detail.className = 'muted';
    panel.appendChild(detail);

    this.innerHTML = '';
    this.appendChild(panel);
  }
}

const STEP_STATE_ICONS = {
  pending: '⏳',
  active: '⚙️',
  done: '✅',
  skipped: '⏭️',
  error: '❌'
};

export function createProgressTracker(controlId, stepKeys) {
  let timerId = null;

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    const startedAt = performance.now();
    const elapsedEl = document.getElementById(`${controlId}-elapsed`);
    if (elapsedEl) elapsedEl.textContent = '⏱️ 0.0s';
    timerId = setInterval(() => {
      const sec = ((performance.now() - startedAt) / 1000).toFixed(1);
      if (elapsedEl) elapsedEl.textContent = `⏱️ ${sec}s`;
    }, 150);
    return () => {
      stopTimer();
      const sec = ((performance.now() - startedAt) / 1000).toFixed(1);
      if (elapsedEl) elapsedEl.textContent = `⏱️ ${sec}s`;
      return sec;
    };
  };

  const setStepState = (key, stateName) => {
    const el = document.getElementById(`${controlId}-step-${key}`);
    if (!el) return;
    el.dataset.state = stateName;
    const iconEl = el.querySelector('.pstep-icon');
    if (iconEl) iconEl.textContent = STEP_STATE_ICONS[stateName] || '⏳';
  };

  const setStage = (activeKey, { skipFirst = false, done = false, error = false } = {}) => {
    if (done) {
      stepKeys.forEach((k, idx) => setStepState(k, idx === 0 && skipFirst ? 'skipped' : 'done'));
      return;
    }
    const resolvedKey = activeKey === 'saving' ? stepKeys[stepKeys.length - 1] : activeKey;
    const activeIdx = stepKeys.indexOf(resolvedKey);
    stepKeys.forEach((k, idx) => {
      if (idx === 0 && skipFirst && resolvedKey !== k) {
        setStepState(k, 'skipped');
      } else if (idx < activeIdx) {
        setStepState(k, 'done');
      } else if (idx === activeIdx) {
        setStepState(k, error ? 'error' : 'active');
      } else {
        setStepState(k, 'pending');
      }
    });
  };

  const update = ({ visible = true, icon = '⚙️', message = '', detail = '', percent = 0, mode = 'running' }) => {
    const panel = document.getElementById(`${controlId}-panel`);
    const bar = document.getElementById(`${controlId}-bar`);
    const pctEl = document.getElementById(`${controlId}-percent`);
    const iconEl = document.getElementById(`${controlId}-icon`);
    const statusEl = document.getElementById(`${controlId}-status`);
    const detailEl = document.getElementById(`${controlId}-detail`);

    if (panel) {
      panel.hidden = !visible;
      panel.classList.toggle('is-error', mode === 'error');
      panel.classList.toggle('is-done', mode === 'done');
    }
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    if (bar) {
      bar.value = clamped;
      bar.textContent = `${clamped}%`;
    }
    if (pctEl) pctEl.textContent = `${clamped}%`;
    if (iconEl) iconEl.textContent = icon;
    if (statusEl && message) statusEl.textContent = message;
    if (detailEl) detailEl.textContent = detail || '';
  };

  return { startTimer, stopTimer, setStepState, setStage, update };
}

customElements.define('int-button', IntButton);
customElements.define('int-field', IntField);
customElements.define('int-select', IntSelect);
customElements.define('int-textarea', IntTextarea);
customElements.define('int-toggle', IntToggle);
customElements.define('int-card', IntCard);
customElements.define('int-progress', IntProgress);
