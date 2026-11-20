import { esc } from '../components.js';
import { $, state } from './state.js';

const FEMALE_HAIRSTYLES = ['bob', 'ponytail', 'bun', 'layered', 'pixie'];
const MALE_HAIRSTYLES = ['quiff', 'parted', 'spiky', 'slick', 'curly'];

const REALISTIC_HAIR_COLORS = [
  { id: 'espresso', hairA: '#4b3123', hairB: '#22140c' },
  { id: 'jet-black', hairA: '#27272a', hairB: '#09090b' },
  { id: 'auburn', hairA: '#8b3e24', hairB: '#4a1d0d' },
  { id: 'honey-blonde', hairA: '#d4a64a', hairB: '#8f671e' },
  { id: 'ash-blonde', hairA: '#b9a37c', hairB: '#7a684a' },
  { id: 'copper-ginger', hairA: '#b45309', hairB: '#712e08' },
  { id: 'salt-pepper', hairA: '#717885', hairB: '#334155' },
  { id: 'dark-walnut', hairA: '#65432e', hairB: '#362114' }
];

const REALISTIC_EYE_COLORS = [
  { id: 'chestnut', iris: '#5b341a', ring: '#381e0d' },
  { id: 'hazel-green', iris: '#4d6b43', ring: '#2d4226' },
  { id: 'nordic-blue', iris: '#2e6395', ring: '#1a3b5c' },
  { id: 'steel-grey', iris: '#566475', ring: '#303b47' },
  { id: 'warm-amber', iris: '#8d5b24', ring: '#543310' },
  { id: 'deep-espresso', iris: '#2c1e18', ring: '#140c09' }
];

const VIBE_SUIT_PALETTES = {
  warm: [
    { suitA: '#059669', suitB: '#065f46', accent: '#34d399', bgA: '#ecfdf5', bgB: '#d1fae5' },
    { suitA: '#e11d48', suitB: '#9f1239', accent: '#fda4af', bgA: '#fff1f2', bgB: '#ffe4e6' },
    { suitA: '#0d9488', suitB: '#115e59', accent: '#5eead4', bgA: '#f0fdfa', bgB: '#ccfbf1' },
    { suitA: '#b45309', suitB: '#78350f', accent: '#fbbf24', bgA: '#fffbeb', bgB: '#fef3c7' }
  ],
  bored: [
    { suitA: '#64748b', suitB: '#475569', accent: '#cbd5e1', bgA: '#f1f5f9', bgB: '#e2e8f0' },
    { suitA: '#52525b', suitB: '#3f3f46', accent: '#a1a1aa', bgA: '#f4f4f5', bgB: '#e4e4e7' },
    { suitA: '#57534e', suitB: '#44403c', accent: '#d6d3d1', bgA: '#f5f5f4', bgB: '#e7e5e4' },
    { suitA: '#3b4a5e', suitB: '#1e293b', accent: '#94a3b8', bgA: '#e2e8f0', bgB: '#cbd5e1' }
  ],
  hardball: [
    { suitA: '#18181b', suitB: '#09090b', accent: '#a1a1aa', bgA: '#e2e8f0', bgB: '#cbd5e1' },
    { suitA: '#1e293b', suitB: '#0f172a', accent: '#64748b', bgA: '#f1f5f9', bgB: '#cbd5e1' },
    { suitA: '#4c1d95', suitB: '#2e1065', accent: '#c4b5fd', bgA: '#f5f3ff', bgB: '#ddd6fe' },
    { suitA: '#7f1d1d', suitB: '#450a0a', accent: '#fca5a5', bgA: '#fef2f2', bgB: '#fee2e2' }
  ],
  creative: [
    { suitA: '#2563eb', suitB: '#1d4ed8', accent: '#93c5fd', bgA: '#eff6ff', bgB: '#dbeafe' },
    { suitA: '#4f46e5', suitB: '#3730a3', accent: '#a5b4fc', bgA: '#eef2ff', bgB: '#e0e7ff' },
    { suitA: '#0284c7', suitB: '#0369a1', accent: '#7dd3fc', bgA: '#f0f9ff', bgB: '#bae6fd' },
    { suitA: '#15803d', suitB: '#14532d', accent: '#86efac', bgA: '#f0fdf4', bgB: '#dcfce7' }
  ],
  pedantic: [
    { suitA: '#334155', suitB: '#0f172a', accent: '#38bdf8', bgA: '#0f172a', bgB: '#1e293b' },
    { suitA: '#1e3a8a', suitB: '#172554', accent: '#60a5fa', bgA: '#0f172a', bgB: '#172554' },
    { suitA: '#064e3b', suitB: '#022c22', accent: '#34d399', bgA: '#064e3b', bgB: '#022c22' },
    { suitA: '#3f3f46', suitB: '#18181b', accent: '#facc15', bgA: '#18181b', bgB: '#27272a' }
  ]
};

let avatarMode = 'idle';
let avatarEngineLabel = '';
let lastRenderedAvatarKey = '';

export function getAvatarMode() {
  return avatarMode;
}

export function getActiveAgentMeta(agentFile = state.activeSession?.agentFile) {
  const isPractice = state.activeSession?.mode === 'tutor' || state.activeSession?.mode === 'logic';
  if (isPractice && state.activeSession?.tutorTeacher && (!agentFile || agentFile === state.activeSession.tutorTeacher.id)) {
    const t = state.activeSession.tutorTeacher;
    return {
      id: t.id,
      topic: state.activeSession.mode === 'logic' ? 'Logic Puzzle' : 'English Practice',
      persona: 'hr',
      code: state.activeSession.mode === 'logic' ? 'LOGIC' : 'TUTOR',
      avatarName: t.avatarName || t.name,
      title: `${t.accent} · ${t.specialty}`,
      defaultVoice: t.voice,
      gender: 'female',
      hairStyle: t.hairStyle,
      glasses: t.glasses,
      headset: t.headset,
      tie: false,
      badgeText: state.activeSession.mode === 'logic' ? 'LOGIC' : 'TUTOR',
      palette: t.palette
    };
  }
  return (
    state.catalog?.agents?.find((a) => a.id === agentFile) ||
    state.catalog?.agents?.[0] || {
      id: '01-hr-recruiter-screening.md',
      topic: 'HR',
      persona: 'hr',
      avatarName: 'Maya',
      title: 'Internal Fintech Talent Partner',
      defaultVoice: 'AmericanFemale',
      gender: 'female',
      hairStyle: 'bob',
      glasses: 'none',
      headset: 'earpiece',
      tie: false,
      badgeText: 'HR',
      palette: { suitA: '#fb7185', suitB: '#be123c', hairA: '#6b3e26', hairB: '#381e12', bgA: '#fff1f2', bgB: '#ffe4e6', accent: '#f43f5e' }
    }
  );
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function classifyPersonalityVibe(personality) {
  const id = personality?.id || '';
  if (/warm|empathetic|good-cop|collab|mentor/.test(id)) return 'warm';
  if (/bored|exhausted|burned-out|unimpressed|tired|silent-observer/.test(id)) return 'bored';
  if (/cold|hardball|bar-raiser|cfo|agency|urgency|low-anchor|skeptic|purist|security|grumpy|saboteur|trivia/.test(id)) return 'hardball';
  if (/startup|whiteboard|founder|product|async/.test(id)) return 'creative';
  return 'pedantic';
}

export function rollAppearance(meta, personality, genderOverride = null) {
  const gender = genderOverride || meta.gender || 'female';
  const vibe = classifyPersonalityVibe(personality);
  const hairPool = gender === 'female' ? FEMALE_HAIRSTYLES : MALE_HAIRSTYLES;
  const suit = pickOne(VIBE_SUIT_PALETTES[vibe] || VIBE_SUIT_PALETTES.warm);
  const hairColor = vibe === 'hardball' || vibe === 'bored'
    ? pickOne(REALISTIC_HAIR_COLORS.filter((h) => h.id !== 'copper-ginger'))
    : pickOne(REALISTIC_HAIR_COLORS);
  const eyeColor = pickOne(REALISTIC_EYE_COLORS);
  const hairStyle = pickOne(hairPool);
  const browMood = vibe === 'bored' ? 'flat' : vibe === 'hardball' || vibe === 'pedantic' ? 'focused' : 'warm';
  const sig = `${vibe}-${suit.suitA}-${hairColor.id}-${eyeColor.id}-${hairStyle}-${browMood}`;
  return { ...suit, ...hairColor, eyeColor, hairStyle, browMood, sig };
}

function buildHairPaths(style, prefix, gender) {
  const effStyle =
    gender === 'female' && MALE_HAIRSTYLES.includes(style)
      ? FEMALE_HAIRSTYLES[MALE_HAIRSTYLES.indexOf(style) % FEMALE_HAIRSTYLES.length]
      : gender === 'male' && FEMALE_HAIRSTYLES.includes(style)
        ? MALE_HAIRSTYLES[FEMALE_HAIRSTYLES.indexOf(style) % MALE_HAIRSTYLES.length]
        : style;

  const backMap = {
    bob: `<path d="M52 96 C50 45 78 27 110 27 C142 27 170 45 168 96 C172 126 164 148 148 153 L72 153 C56 148 48 126 52 96 Z" fill="url(#${prefix}-hair)" />`,
    ponytail: `<path d="M148 64 C178 68 184 114 166 138 C158 124 156 96 150 84 Z" fill="url(#${prefix}-hair)" /><path d="M54 92 C54 45 79 27 110 27 C141 27 166 45 166 92 Z" fill="url(#${prefix}-hair)" />`,
    bun: `<circle cx="110" cy="24" r="20" fill="url(#${prefix}-hair)" /><path d="M55 92 C55 45 80 28 110 28 C140 28 165 45 165 92 Z" fill="url(#${prefix}-hair)" />`,
    layered: `<path d="M47 95 C47 42 76 24 110 24 C144 24 173 42 173 95 C177 134 167 162 152 164 L68 164 C53 162 43 134 47 95 Z" fill="url(#${prefix}-hair)" />`,
    pixie: `<path d="M56 88 C56 44 80 28 110 28 C140 28 164 44 164 88 Z" fill="url(#${prefix}-hair)" />`,
    quiff: '',
    parted: '',
    spiky: '',
    slick: '',
    curly: `<circle cx="72" cy="52" r="14" fill="url(#${prefix}-hair)" /><circle cx="148" cy="52" r="14" fill="url(#${prefix}-hair)" />`
  };

  const frontMap = {
    bob: `<path d="M60 84 C60 46 84 31 112 31 C141 31 160 47 160 82 C147 64 132 54 114 55 C95 57 77 65 60 84 Z" fill="url(#${prefix}-hair)" />`,
    ponytail: `<path d="M61 82 C62 45 86 30 112 30 C138 30 160 46 159 80 C143 58 122 50 96 54 C79 57 68 68 61 82 Z" fill="url(#${prefix}-hair)" />`,
    bun: `<path d="M62 82 C62 46 84 32 110 32 C136 32 158 46 158 82 C142 57 123 50 110 50 C97 50 78 57 62 82 Z" fill="url(#${prefix}-hair)" />`,
    layered: `<path d="M59 84 C61 44 84 29 112 29 C140 29 161 46 161 84 C149 62 134 52 121 54 C104 58 80 62 59 84 Z" fill="url(#${prefix}-hair)" />`,
    pixie: `<path d="M59 80 C59 43 84 28 110 28 C136 28 161 44 160 76 C144 63 128 53 102 57 C83 60 70 67 59 80 Z" fill="url(#${prefix}-hair)" />`,
    quiff: `<path d="M60 84 C57 44 82 22 114 23 C145 24 164 44 159 83 C152 60 135 49 109 51 C87 53 71 63 60 84 Z" fill="url(#${prefix}-hair)" />`,
    parted: `<path d="M61 84 C60 45 83 28 110 28 C139 28 161 45 159 83 C145 59 128 52 118 52 L113 66 L104 52 C86 55 71 65 61 84 Z" fill="url(#${prefix}-hair)" />`,
    spiky: `<path d="M60 84 C58 50 75 28 96 22 L106 32 L120 18 L128 32 L144 25 C157 40 163 60 159 83 C146 61 128 52 108 53 C87 54 71 65 60 84 Z" fill="url(#${prefix}-hair)" />`,
    slick: `<path d="M60 80 C62 43 85 28 110 28 C136 28 159 43 160 80 C145 53 125 46 110 46 C95 46 75 53 60 80 Z" fill="url(#${prefix}-hair)" />`,
    curly: `<path d="M58 84 C58 52 72 30 92 26 C100 22 120 22 128 26 C148 30 162 52 162 84 C148 64 134 56 122 60 C112 53 98 53 88 60 C76 56 66 66 58 84 Z" fill="url(#${prefix}-hair)" />`
  };

  return { back: backMap[effStyle] || '', front: frontMap[effStyle] || frontMap.quiff };
}

export function buildCharacterSvgHtml(meta, prefix, genderOverride = null, appearance = null) {
  const baseP = meta.palette || {};
  const p = appearance ? { ...baseP, ...appearance } : baseP;
  const gender = genderOverride || meta.gender || 'female';
  const hair = buildHairPaths(appearance?.hairStyle || meta.hairStyle || 'bob', prefix, gender);
  const badgeText = esc(meta.badgeText || 'AI');
  const accent = esc(p.accent || '#38bdf8');
  const iris = esc(appearance?.eyeColor?.iris || '#334155');
  const irisRing = esc(appearance?.eyeColor?.ring || '#1e293b');
  const browMood = appearance?.browMood || 'warm';
  const browLeft = browMood === 'flat' ? 'M79 81 L99 81' : browMood === 'focused' ? 'M79 78 L99 83' : 'M79 81 Q89 75 98 81';
  const browRight = browMood === 'flat' ? 'M121 81 L141 81' : browMood === 'focused' ? 'M121 83 L141 78' : 'M122 81 Q131 75 141 81';

  let torsoDetail;
  if (meta.persona === 'tech') {
    torsoDetail = `
      <path d="M84 154 Q110 172 136 154" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="6" stroke-linecap="round" />
      <line x1="99" y1="165" x2="97" y2="188" stroke="#cbd5e1" stroke-width="2.6" stroke-linecap="round" />
      <line x1="121" y1="165" x2="123" y2="188" stroke="#cbd5e1" stroke-width="2.6" stroke-linecap="round" />
      <rect x="89" y="177" width="42" height="19" rx="7" fill="rgba(15, 23, 42, 0.55)" stroke="${accent}" stroke-width="1.4" />
      <text x="110" y="190" text-anchor="middle" fill="${accent}" font-size="10.5" font-weight="800" font-family="ui-monospace, monospace">${badgeText}</text>
    `;
  } else if (meta.tie) {
    torsoDetail = `
      <path d="M93 153 L110 189 L127 153 Z" fill="#ffffff" />
      <path d="M106 160 L114 160 L116 184 L110 192 L104 184 Z" fill="${accent}" />
      <rect x="131" y="172" width="24" height="14" rx="5" fill="rgba(255,255,255,0.18)" />
      <text x="143" y="182" text-anchor="middle" fill="#ffffff" font-size="8.2" font-weight="800">${badgeText}</text>
    `;
  } else {
    torsoDetail = `
      <path d="M93 153 L110 184 L127 153 Z" fill="#fff7ed" />
      <circle cx="110" cy="171" r="4.2" fill="${accent}" />
      <rect x="130" y="173" width="26" height="14" rx="5" fill="rgba(15,23,42,0.28)" />
      <text x="143" y="183" text-anchor="middle" fill="#ffffff" font-size="8.2" font-weight="800">${badgeText}</text>
    `;
  }

  let glassesSvg = '';
  if (meta.glasses === 'tech') {
    glassesSvg = `<g><rect x="72" y="83" width="33" height="25" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#0f172a" stroke-width="3.2" /><rect x="115" y="83" width="33" height="25" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#0f172a" stroke-width="3.2" /><line x1="105" y1="95" x2="115" y2="95" stroke="#0f172a" stroke-width="3.2" /></g>`;
  } else if (meta.glasses === 'round') {
    glassesSvg = `<g><circle cx="89" cy="95" r="14.5" fill="rgba(255,255,255,0.10)" stroke="#334155" stroke-width="2.5" /><circle cx="131" cy="95" r="14.5" fill="rgba(255,255,255,0.10)" stroke="#334155" stroke-width="2.5" /><line x1="103.5" y1="95" x2="116.5" y2="95" stroke="#334155" stroke-width="2.5" /></g>`;
  } else if (meta.glasses === 'executive') {
    glassesSvg = `<g><rect x="75" y="86" width="29" height="21" rx="6" fill="rgba(255, 255, 255, 0.08)" stroke="#92400e" stroke-width="2.2" /><rect x="116" y="86" width="29" height="21" rx="6" fill="rgba(255, 255, 255, 0.08)" stroke="#92400e" stroke-width="2.2" /><line x1="104" y1="95" x2="116" y2="95" stroke="#92400e" stroke-width="2.2" /></g>`;
  }

  let headsetSvg = '';
  if (meta.headset === 'studio') {
    headsetSvg = `<g><path d="M55 94 C53 43 79 24 110 24 C141 24 167 43 165 94" fill="none" stroke="#0f172a" stroke-width="8.5" stroke-linecap="round" /><rect x="48" y="80" width="16" height="34" rx="8" fill="${accent}" stroke="#0f172a" stroke-width="2.8" /><rect x="156" y="80" width="16" height="34" rx="8" fill="${accent}" stroke="#0f172a" stroke-width="2.8" /></g>`;
  } else if (meta.headset === 'earpiece') {
    headsetSvg = `<g><circle cx="158" cy="100" r="6" fill="#0f172a" /><circle cx="158" cy="100" r="2.6" fill="${accent}" /></g>`;
  }

  return `
    <svg class="interviewer-svg" viewBox="0 0 220 220" role="img" aria-label="${esc(meta.avatarName)} — animated interviewer character with two eyes and no mouth">
      <defs>
        <radialGradient id="${prefix}-skin" cx="38%" cy="30%" r="65%"><stop offset="0%" stop-color="#fff0e3" /><stop offset="55%" stop-color="#ffd5b8" /><stop offset="100%" stop-color="#e5a27d" /></radialGradient>
        <radialGradient id="${prefix}-cheek" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff7a90" stop-opacity="0.5" /><stop offset="100%" stop-color="#ff7a90" stop-opacity="0" /></radialGradient>
        <linearGradient id="${prefix}-hair" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="${esc(p.hairA || '#4b352a')}" /><stop offset="100%" stop-color="${esc(p.hairB || '#221712')}" /></linearGradient>
        <linearGradient id="${prefix}-suit" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${esc(p.suitA || '#fb7185')}" /><stop offset="100%" stop-color="${esc(p.suitB || '#be123c')}" /></linearGradient>
        <filter id="${prefix}-drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.20" /></filter>
      </defs>
      <ellipse cx="110" cy="204" rx="58" ry="10" fill="rgba(15, 23, 42, 0.16)" />
      <g class="avatar-torso" filter="url(#${prefix}-drop)">
        <path d="M49 204 C51 164 76 153 110 153 C144 153 169 164 171 204 Z" fill="url(#${prefix}-suit)" />
        ${torsoDetail}
        <rect x="97" y="138" width="26" height="22" rx="11" fill="#e8ab87" />
      </g>
      <g class="avatar-head-group" filter="url(#${prefix}-drop)">
        ${hair.back}
        <circle cx="62" cy="98" r="11" fill="#f2b895" />
        <circle cx="158" cy="98" r="11" fill="#e5a27d" />
        <rect x="63" y="42" width="94" height="104" rx="46" fill="url(#${prefix}-skin)" />
        <ellipse cx="94" cy="60" rx="22" ry="9" fill="rgba(255,255,255,0.34)" transform="rotate(-10 94 60)" />
        <ellipse cx="81" cy="111" rx="11" ry="6.5" fill="url(#${prefix}-cheek)" />
        <ellipse cx="139" cy="111" rx="11" ry="6.5" fill="url(#${prefix}-cheek)" />
        ${hair.front}
        ${headsetSvg}
        <g class="avatar-face-eyes">
          <path d="${browLeft}" fill="none" stroke="${esc(p.hairB || '#4b352a')}" stroke-width="3.2" stroke-linecap="round" />
          <path d="${browRight}" fill="none" stroke="${esc(p.hairB || '#4b352a')}" stroke-width="3.2" stroke-linecap="round" />
          <g class="avatar-eyes-blink">
            <ellipse cx="89" cy="96" rx="9.4" ry="10.4" fill="#f8fafc" />
            <circle cx="89" cy="96" r="7.4" fill="${iris}" stroke="${irisRing}" stroke-width="1.3" />
            <circle cx="89" cy="96" r="4.1" fill="#0f172a" />
            <circle cx="91.8" cy="93" r="2.6" fill="#ffffff" />
            <circle cx="86.5" cy="99" r="1.2" fill="#ffffff" opacity="0.75" />
            <ellipse cx="131" cy="96" rx="9.4" ry="10.4" fill="#f8fafc" />
            <circle cx="131" cy="96" r="7.4" fill="${iris}" stroke="${irisRing}" stroke-width="1.3" />
            <circle cx="131" cy="96" r="4.1" fill="#0f172a" />
            <circle cx="133.8" cy="93" r="2.6" fill="#ffffff" />
            <circle cx="128.5" cy="99" r="1.2" fill="#ffffff" opacity="0.75" />
          </g>
        </g>
        ${glassesSvg}
      </g>
    </svg>
  `;
}

export function inferVoiceGender(voiceKeyOverride = null) {
  const engine = state.user?.ttsEngine || $('#tts-engine-select')?.value || 'auto';
  const zVoice = voiceKeyOverride || state.activeSession?.voice || state.user?.zonosVoice || 'AmericanFemale';
  if (engine !== 'browser') {
    const preset = (state.setup?.zonosPresets || []).find((p) => p.key === zVoice);
    if (preset?.gender) return preset.gender;
    if (/male/i.test(zVoice) && !/female/i.test(zVoice)) return 'male';
    if (/\b(rupert|wyatt|cillian|jett|thaddeus)\b/i.test(zVoice)) return 'male';
    return 'female';
  }
  const bVoice = state.user?.preferredVoice || $('#voice-select')?.value || '';
  if (/\b(daniel|alex|fred|tom|arthur|oliver|aaron|rishi|gordon)\b/i.test(bVoice)) return 'male';
  return 'female';
}

export function renderAvatarVisual(force = false) {
  const meta = getActiveAgentMeta(state.lobbyCfg?.agentFile || state.activeSession?.agentFile);
  const voiceKey = state.lobbyCfg ? ($('#lobby-voice-select')?.value || meta.defaultVoice) : (state.activeSession?.voice || meta.defaultVoice);
  const gender = inferVoiceGender(voiceKey);
  const appearance = state.lobbyCfg?.appearance || state.activeSession?.appearance || null;
  const key = `${meta.id}:${gender}:${appearance?.sig || 'base'}`;
  if (force || key !== lastRenderedAvatarKey) {
    lastRenderedAvatarKey = key;
    if ($('#call-avatar-mount')) $('#call-avatar-mount').innerHTML = buildCharacterSvgHtml(meta, 'call', gender, appearance);
    if ($('#lobby-avatar-mount')) $('#lobby-avatar-mount').innerHTML = buildCharacterSvgHtml(meta, 'lobby', gender, appearance);
  }
  const p = appearance || meta.palette || {};
  const stage = $('#interviewer-stage');
  if (stage) {
    stage.style.setProperty('--stage-bg-a', p.bgA || '#1e293b');
    stage.style.setProperty('--stage-bg-b', p.bgB || '#020617');
  }
  const lobbyBox = $('#lobby-avatar-viewport');
  if (lobbyBox) {
    lobbyBox.style.setProperty('--stage-bg-a', p.bgA || '#ffffff');
    lobbyBox.style.setProperty('--stage-bg-b', p.bgB || '#dbeafe');
  }
}

export function updateAvatarStage() {
  const stage = $('#interviewer-stage');
  if (!stage) return;

  renderAvatarVisual();
  const meta = getActiveAgentMeta();
  const voiceActive = Boolean($('#auto-speak-toggle')?.checked);
  stage.classList.toggle('no-avatar-mode', !voiceActive);
  stage.classList.toggle('is-speaking', avatarMode === 'speaking');
  stage.classList.toggle('is-listening', avatarMode === 'listening');
  stage.classList.toggle('is-thinking', avatarMode === 'thinking');

  const bubble = $('#thinking-bubble');
  if (bubble) bubble.hidden = avatarMode !== 'thinking';

  const isTutor = state.activeSession?.mode === 'tutor';
  const isLogic = state.activeSession?.mode === 'logic';
  const isPractice = isTutor || isLogic;
  $('#avatar-role-badge').textContent = isLogic
    ? (state.activeSession?.guestMode ? '🧑 Guest · 🧩 Logic' : '🧩 Logic Puzzle')
    : isTutor
      ? (state.activeSession?.guestMode ? '🧑 Guest Practice' : '🗣️ Practice')
      : `${meta.code} · ${meta.topic}`;
  $('#avatar-name').textContent = isPractice
    ? `${state.activeSession?.tutorTeacher?.name || meta.avatarName} · ${meta.title}`
    : `${meta.avatarName} · ${meta.title}`;
  const p = state.activeSession?.personality;
  if ($('#arena-personality-badge')) {
    if (isLogic) {
      const mins = state.activeSession?.logicPuzzle?.durationMinutes || 10;
      $('#arena-personality-badge').textContent = `⏱️ ${mins} min · Live Scratchpad`;
      $('#arena-personality-badge').title = 'Collaborative analytical logic session with shared live notepad';
    } else if (isTutor) {
      $('#arena-personality-badge').textContent = state.activeSession?.guestMode ? '🧑 Anonymous Guest' : '☕ Personalized Practice';
      $('#arena-personality-badge').title = state.activeSession?.guestMode
        ? 'Guest Mode: no personal memory read or saved'
        : 'Patient English conversation, Learning Map & grammar explanations';
    } else if (p) {
      $('#arena-personality-badge').textContent = `${p.emoji} ${p.label}`;
      $('#arena-personality-badge').title = `${p.mood} — ${p.trapHint}`;
    }
  }
  const baseHint = isLogic
    ? 'Live shared scratchpad · Socratic reasoning partner'
    : isTutor
      ? 'Gentle English coaching + clear "why" explanations'
      : ($('#continuous-flow-toggle')?.checked ? 'Continuous natural dialogue' : 'Strict Senior Stop-Correct coaching');
  $('#avatar-persona-hint').textContent = (!isPractice && p) ? `${baseHint} · ${p.emoji} ${p.label} (${p.mood})` : baseHint;

  const pill = $('#avatar-status-pill');
  if (avatarMode === 'speaking') pill.textContent = avatarEngineLabel === 'zonos' ? '🗣️ Speaking (ZONOS3)' : '🗣️ Speaking';
  else if (avatarMode === 'listening') pill.textContent = '🎙️ Listening...';
  else if (avatarMode === 'thinking') pill.textContent = '💭 Thinking...';
  else pill.textContent = '👀 Watching';
}

export function setAvatarState(mode, engineLabel = '') {
  avatarMode = mode;
  avatarEngineLabel = engineLabel;
  updateAvatarStage();
}
