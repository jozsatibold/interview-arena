import { apiJson } from './components.js';
import { $, $$, state, initDialogFallbacks, syncCandidateIdentity } from './modules/state.js';
import { updateAvatarStage } from './modules/avatar.js';
import { populateVoiceSelect, initSpeechRecognition } from './modules/voice-media.js';
import { stopLobbyMicTest, wireLobbyEvents } from './modules/lobby.js';
import { startSession, sendChatTurn, wireArenaEvents } from './modules/call-arena.js';
import { renderHud, renderStats, renderMistakes, wireStatsAndShopEvents } from './modules/stats-shop.js';
import { renderHome, renderSettingsPage, wireDashboardAndSettingsEvents } from './modules/dashboard.js';
import { renderJdImagePreviews, loadCustomInterviews, wireTargetsEvents } from './modules/targets.js';
import { renderTutorStudio, refreshTutorMemory, wirePracticeEvents } from './modules/practice.js';
import { renderAboutMe, wireCvAndOnboardingEvents } from './modules/cv-onboarding.js';

export function switchToView(viewId) {
  const applyDomUpdate = () => {
    for (const view of $$('.spa-view')) {
      const isTarget = view.id === viewId;
      view.classList.toggle('inactive', !isTarget);
      view.setAttribute('aria-hidden', String(!isTarget));
      if (isTarget) view.removeAttribute('inert');
      else view.setAttribute('inert', 'inert');
    }
    for (const tab of $$('.nav-tab')) {
      const isTarget = tab.dataset.view === viewId;
      tab.classList.toggle('is-active', isTarget);
      if (isTarget) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }
  };

  const afterTransition = () => {
    document.getElementById(viewId)?.focus();
    if (viewId === 'view-practice' && !$('#practice-guest-toggle')?.checked) refreshTutorMemory();
  };

  if (!document.startViewTransition) {
    applyDomUpdate();
    afterTransition();
    return;
  }
  document.startViewTransition(() => applyDomUpdate()).finished.finally(afterTransition);
}

export function applyCvCatalogBundle(data) {
  if (!data) return;
  if ('activeCv' in data) state.activeCv = data.activeCv;
  if (data.versions) state.cvVersions = data.versions;
  state.needsOnboarding = Boolean(data.needsOnboarding || !state.activeCv);
  document.body.classList.toggle('is-onboarding', state.needsOnboarding);
  if (state.catalog) {
    if (data.morningPath) state.catalog.morningPath = data.morningPath;
    if (data.agents) state.catalog.agents = data.agents;
    if (data.jobDescriptions) state.catalog.jobDescriptions = data.jobDescriptions;
  }
  syncCandidateIdentity();
  renderAboutMe();
  renderHome();
  if (state.needsOnboarding) switchToView('view-onboarding');
}

async function bootstrap() {
  initDialogFallbacks();
  initSpeechRecognition((action, text, ref) => sendChatTurn(action, text, ref));

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = populateVoiceSelect;
  }

  for (const tab of $$('.nav-tab')) {
    tab.addEventListener('click', () => {
      if (tab.dataset.view !== 'view-lobby') stopLobbyMicTest();
      switchToView(tab.dataset.view);
    });
  }

  wireLobbyEvents({ switchToView, onStartSession: startSession });
  wireArenaEvents({ switchToView, refreshHome: renderHome });
  wireStatsAndShopEvents();
  wireDashboardAndSettingsEvents({ switchToView, applyCvCatalogBundle });
  wireTargetsEvents({ switchToView });
  wirePracticeEvents();
  wireCvAndOnboardingEvents({ switchToView, applyCvCatalogBundle });

  const [userData, catData, setupData] = await Promise.all([
    apiJson('/api/state', null, 'GET'),
    apiJson('/api/catalog', null, 'GET'),
    apiJson('/api/setup-status', null, 'GET')
  ]);
  state.user = userData;
  state.catalog = catData;
  state.setup = setupData;
  state.activeCv = catData.activeCv || null;
  state.cvVersions = catData.cvVersions || [];
  state.needsOnboarding = Boolean(catData.needsOnboarding || !state.activeCv);
  document.body.classList.toggle('is-onboarding', state.needsOnboarding);

  populateVoiceSelect();
  syncCandidateIdentity();
  renderHud();
  renderSettingsPage();
  renderAboutMe();
  renderTutorStudio();
  renderHome();
  renderStats();
  renderMistakes();
  renderJdImagePreviews();
  updateAvatarStage();
  await loadCustomInterviews();
  if (state.needsOnboarding) switchToView('view-onboarding');
}

bootstrap();
