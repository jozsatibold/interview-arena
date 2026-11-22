export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const state = {
  catalog: null,
  setup: null,
  user: null,
  activeTopic: 'ALL',
  activeSession: {
    agentFile: '01-hr-recruiter-screening.md',
    jdFile: 'jd-01-senior-frontend-fintech-bnpl.md',
    topic: 'HR',
    title: 'Internal Fintech Talent Partner',
    day: 1,
    messages: [],
    doubleXpActive: false
  },
  lobbyCfg: null,
  recognition: null,
  isListening: false,
  pendingSendOnMicStop: false,
  pendingRetry: null,
  shieldInterval: null,
  mediaStream: null,
  camEnabled: true,
  audioCtx: null,
  micMeterRaf: null,
  lobbyTestRec: null,
  lobbyTestingMic: false,
  chatOpen: false,
  unreadChatCount: 0,
  customInterviews: [],
  plannerModels: [],
  visionModels: [],
  jdImages: [],
  activeCv: null,
  cvVersions: [],
  cvUploadFile: null,
  onbCvFile: null,
  needsOnboarding: false,
  practiceTrack: 'conversation',
  logicDiffFilter: 'ALL',
  selectedLogicPuzzleId: null,
  selectedLogicTeacherId: 'tutor-sarah',
  scratchpadOpen: false,
  screenShareOpen: false,
  lastSentScratchpadText: '',
  logicTimerSeconds: 600,
  logicTimerTotalSeconds: 600,
  logicTimerRunning: false,
  logicTimerInterval: null,
  logicHintStep: 0,
  scratchpadDebounceTimer: null
};

export function initDialogFallbacks() {
  if (!('commandForElement' in HTMLButtonElement.prototype)) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[command][commandfor]');
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute('commandfor'));
      if (!target) return;
      const cmd = btn.getAttribute('command');
      if (cmd === 'show-modal' && typeof target.showModal === 'function') target.showModal();
      else if (cmd === 'close' && typeof target.close === 'function') target.close();
    });
  }

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of $$('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) dialog.close();
      });
    }
  }

  for (const dialog of $$('dialog')) {
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });
  }
}

export function getCandidateIdentity() {
  if (state.activeSession?.guestMode) {
    return { fullName: 'Guest', firstName: 'Guest', initials: 'G' };
  }
  const fullName = String(state.activeCv?.profile?.candidateName || 'Candidate').trim() || 'Candidate';
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Candidate';
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : fullName.slice(0, 2).toUpperCase();
  return {
    fullName,
    firstName,
    initials
  };
}

export function syncCandidateIdentity() {
  const id = getCandidateIdentity();
  if ($('#lobby-self-initials')) $('#lobby-self-initials').textContent = id.initials;
  if ($('#arena-self-initials')) $('#arena-self-initials').textContent = id.initials;
  if ($('#lobby-self-nameplate')) $('#lobby-self-nameplate').textContent = `${id.firstName} (You)`;
  if ($('#arena-self-nameplate')) $('#arena-self-nameplate').textContent = `You · ${id.firstName}`;
}

export function wireDropzone(zoneEl, onFiles) {
  if (!zoneEl) return;
  zoneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    zoneEl.classList.add('is-dragover');
  });
  zoneEl.addEventListener('dragleave', () => zoneEl.classList.remove('is-dragover'));
  zoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    zoneEl.classList.remove('is-dragover');
    if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
  });
  zoneEl.addEventListener('keydown', (e) => {
    if (e.target !== zoneEl) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      zoneEl.querySelector('input[type="file"]')?.click();
    }
  });
}

export function syncLinkedSelectGroup(selectors) {
  for (const srcId of selectors) {
    $(srcId)?.addEventListener('change', (e) => {
      for (const dstId of selectors) {
        if (dstId !== srcId && $(dstId)) $(dstId).value = e.target.value;
      }
    });
  }
}
