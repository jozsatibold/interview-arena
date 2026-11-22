import { esc } from '../components.js';
import { $, state } from './state.js';
import { getTopicUiLabels } from '../../shared/role-archetypes.mjs';
import { rollDetailedDna, startDetailedAvatarLoop, stopDetailedAvatarLoopsExcept } from './avatar-detailed.js';
import { startSvgAvatarLoop, stopSvgAvatarLoopsExcept } from './avatar-svg-live.js';
import { getSpeechLipLevel, getSpeechViseme } from './voice-media.js';

const FEMALE_HAIRSTYLES = ['bob', 'ponytail', 'bun', 'layered', 'pixie'];
const MALE_HAIRSTYLES = ['quiff', 'parted', 'spiky', 'slick', 'curly'];

export const OFFICE_BACKDROPS = [
  { id: 'office-01', file: 'office-01.jpg', deskTop: '#d7b892', deskFront: '#b89468' },
  { id: 'office-02', file: 'office-02.jpg', deskTop: '#e3cdb2', deskFront: '#c6aa89' },
  { id: 'office-03', file: 'office-03.jpg', deskTop: '#6b442b', deskFront: '#4a2e1c' },
  { id: 'office-04', file: 'office-04.jpg', deskTop: '#a47753', deskFront: '#7d5639' },
  { id: 'office-05', file: 'office-05.jpg', deskTop: '#e7dac8', deskFront: '#cabaa3' },
  { id: 'office-06', file: 'office-06.jpg', deskTop: '#eef0ef', deskFront: '#d3d7d5' },
  { id: 'office-07', file: 'office-07.jpg', deskTop: '#5c4132', deskFront: '#3e2b20' },
  { id: 'office-08', file: 'office-08.jpg', deskTop: '#dec6a7', deskFront: '#bf9f7b' },
  { id: 'office-09', file: 'office-09.jpg', deskTop: '#323842', deskFront: '#1f242c' },
  { id: 'office-10', file: 'office-10.jpg', deskTop: '#a27451', deskFront: '#7a5235' },
  { id: 'office-11', file: 'office-11.jpg', deskTop: '#d9b98d', deskFront: '#b99567' },
  { id: 'office-12', file: 'office-12.jpg', deskTop: '#363b42', deskFront: '#22262b' },
  { id: 'office-13', file: 'office-13.jpg', deskTop: '#d2b28d', deskFront: '#b28f67' },
  { id: 'office-14', file: 'office-14.jpg', deskTop: '#81573b', deskFront: '#5d3d27' },
  { id: 'office-15', file: 'office-15.jpg', deskTop: '#e2ccb0', deskFront: '#c3a887' }
];

const REALISTIC_SKIN_TONES = [
  { id: 'fair-warm', light: '#fff2e8', mid: '#f8d5bd', shadow: '#dda684', earShadow: '#d1926d', blush: '#f98597' },
  { id: 'ivory-peach', light: '#ffefe2', mid: '#f2c7a5', shadow: '#d69870', earShadow: '#c7855c', blush: '#f47d8c' },
  { id: 'olive-honey', light: '#f6dec4', mid: '#e2b78d', shadow: '#be895b', earShadow: '#ae7748', blush: '#e07b79' },
  { id: 'golden-tan', light: '#e8c49e', mid: '#ce9c6f', shadow: '#a57147', earShadow: '#936038', blush: '#cf6f6a' },
  { id: 'rich-chestnut', light: '#b88363', mid: '#966143', shadow: '#714229', earShadow: '#60351f', blush: '#b45a5a' }
];

const REALISTIC_HAIR_COLORS = [
  { id: 'espresso', hairA: '#4b3123', hairB: '#22140c', shine: 'rgba(255,255,255,0.16)' },
  { id: 'jet-black', hairA: '#27272a', hairB: '#09090b', shine: 'rgba(255,255,255,0.14)' },
  { id: 'auburn', hairA: '#8b3e24', hairB: '#4a1d0d', shine: 'rgba(255,245,230,0.18)' },
  { id: 'honey-blonde', hairA: '#d4a64a', hairB: '#8f671e', shine: 'rgba(255,255,240,0.24)' },
  { id: 'ash-blonde', hairA: '#b9a37c', hairB: '#7a684a', shine: 'rgba(255,255,245,0.20)' },
  { id: 'copper-ginger', hairA: '#b45309', hairB: '#712e08', shine: 'rgba(255,238,215,0.20)' },
  { id: 'salt-pepper', hairA: '#717885', hairB: '#334155', shine: 'rgba(255,255,255,0.22)' },
  { id: 'dark-walnut', hairA: '#65432e', hairB: '#362114', shine: 'rgba(255,240,225,0.16)' }
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
    { suitA: '#be185d', suitB: '#831843', accent: '#f9a8d4', bgA: '#fff1f2', bgB: '#ffe4e6' },
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

export function rollOfficeBackdrop() {
  return {
    office: pickOne(OFFICE_BACKDROPS),
    officeFlip: Math.random() < 0.5
  };
}

function classifyPersonalityVibe(personality) {
  if (personality?.vibe && VIBE_SUIT_PALETTES[personality.vibe]) return personality.vibe;
  const warmth = personality?.traits?.warmth || '';
  if (/warm|friendly/.test(warmth)) return 'warm';
  const skep = personality?.traits?.skepticism || '';
  if (/devils-advocate/.test(skep)) return 'pedantic';
  const id = personality?.id || '';
  if (/warm|empathetic|good-cop|collab|mentor/.test(id)) return 'warm';
  if (/bored|exhausted|burned-out|unimpressed|tired|silent-observer/.test(id)) return 'bored';
  if (/cold|hardball|bar-raiser|cfo|agency|urgency|low-anchor|skeptic|purist|security|grumpy|saboteur|trivia/.test(id)) return 'hardball';
  if (/startup|whiteboard|founder|product|async/.test(id)) return 'creative';
  return 'creative';
}

export function rollAppearance(meta, personality, genderOverride = null) {
  const gender = genderOverride || meta.gender || 'female';
  const vibe = classifyPersonalityVibe(personality);
  const hairPool = gender === 'female' ? FEMALE_HAIRSTYLES : MALE_HAIRSTYLES;
  const suit = pickOne(VIBE_SUIT_PALETTES[vibe] || VIBE_SUIT_PALETTES.warm);
  const hairColor = vibe === 'hardball' || vibe === 'bored'
    ? pickOne(REALISTIC_HAIR_COLORS.filter((h) => h.id !== 'copper-ginger'))
    : pickOne(REALISTIC_HAIR_COLORS);
  const skinTone = pickOne(REALISTIC_SKIN_TONES);
  const eyeColor = pickOne(REALISTIC_EYE_COLORS);
  const hairStyle = pickOne(hairPool);
  const glassesChoices = [meta?.glasses || 'none', meta?.glasses || 'none', 'none', 'round', 'executive', 'tech'];
  const glasses = pickOne(glassesChoices);
  const humorId = personality?.traits?.humor || '';
  const warmthId = personality?.traits?.warmth || '';
  const smileMood = /witty|playful/.test(humorId) || /warm|friendly/.test(warmthId) ? 'smile' : 'calm';
  const browMood = vibe === 'bored' ? 'flat' : vibe === 'hardball' || vibe === 'pedantic' ? 'focused' : 'warm';
  const { office, officeFlip } = rollOfficeBackdrop();
  const dna = rollDetailedDna(meta, personality, gender);
  const sig = `${vibe}-${suit.suitA}-${hairColor.id}-${skinTone.id}-${eyeColor.id}-${hairStyle}-${glasses}-${smileMood}-${browMood}-${dna.facialHair}-${office.id}-${officeFlip ? 'flip' : 'std'}`;
  return { ...suit, ...hairColor, skinTone, eyeColor, hairStyle, glasses, smileMood, browMood, dna, office, officeFlip, sig };
}

function buildHairPaths(style, prefix, gender, shineColor = 'rgba(255,255,255,0.18)') {
  const effStyle =
    gender === 'female' && MALE_HAIRSTYLES.includes(style)
      ? FEMALE_HAIRSTYLES[MALE_HAIRSTYLES.indexOf(style) % FEMALE_HAIRSTYLES.length]
      : gender === 'male' && FEMALE_HAIRSTYLES.includes(style)
        ? MALE_HAIRSTYLES[FEMALE_HAIRSTYLES.indexOf(style) % MALE_HAIRSTYLES.length]
        : style;

  const backMap = {
    bob: `<path d="M51 96 C49 43 78 25 110 25 C142 25 171 43 169 96 C173 128 164 152 149 157 L71 157 C56 152 47 128 51 96 Z" fill="url(#${prefix}-hair)" />`,
    ponytail: `<path d="M148 64 C180 68 186 116 168 142 C158 128 156 98 150 84 Z" fill="url(#${prefix}-hair)" /><path d="M53 92 C53 43 79 25 110 25 C141 25 167 43 167 92 Z" fill="url(#${prefix}-hair)" />`,
    bun: `<circle cx="110" cy="22" r="20" fill="url(#${prefix}-hair)" /><path d="M54 92 C54 43 80 26 110 26 C140 26 166 43 166 92 Z" fill="url(#${prefix}-hair)" />`,
    layered: `<path d="M46 95 C46 40 76 22 110 22 C144 22 174 40 174 95 C178 136 168 166 153 168 L67 168 C52 166 42 136 46 95 Z" fill="url(#${prefix}-hair)" />`,
    pixie: `<path d="M55 88 C55 42 80 26 110 26 C140 26 165 42 165 88 Z" fill="url(#${prefix}-hair)" />`,
    quiff: '',
    parted: '',
    spiky: '',
    slick: '',
    curly: `<circle cx="71" cy="52" r="14" fill="url(#${prefix}-hair)" /><circle cx="149" cy="52" r="14" fill="url(#${prefix}-hair)" />`
  };

  const frontMap = {
    bob: `<path d="M59 84 C59 44 84 29 112 29 C141 29 161 45 161 82 C148 62 132 52 114 54 C94 56 76 64 59 84 Z" fill="url(#${prefix}-hair)" /><path d="M77 44 Q108 33 136 44" fill="none" stroke="${shineColor}" stroke-width="3.2" stroke-linecap="round" />`,
    ponytail: `<path d="M60 82 C61 44 86 28 112 28 C138 28 161 44 160 80 C143 56 122 48 96 52 C79 55 67 67 60 82 Z" fill="url(#${prefix}-hair)" /><path d="M78 42 Q110 32 138 42" fill="none" stroke="${shineColor}" stroke-width="3" stroke-linecap="round" />`,
    bun: `<path d="M61 82 C61 44 84 30 110 30 C136 30 159 44 159 82 C142 55 123 48 110 48 C97 48 78 55 61 82 Z" fill="url(#${prefix}-hair)" />`,
    layered: `<path d="M58 84 C60 42 84 27 112 27 C140 27 162 44 162 84 C149 60 134 50 121 52 C104 56 79 60 58 84 Z" fill="url(#${prefix}-hair)" /><path d="M78 41 Q109 31 139 41" fill="none" stroke="${shineColor}" stroke-width="3.2" stroke-linecap="round" />`,
    pixie: `<path d="M58 80 C58 41 84 26 110 26 C136 26 162 42 161 76 C144 61 128 51 102 55 C83 58 69 66 58 80 Z" fill="url(#${prefix}-hair)" />`,
    quiff: `<path d="M59 84 C56 42 82 20 114 21 C145 22 165 42 160 83 C153 58 135 47 109 49 C87 51 70 61 59 84 Z" fill="url(#${prefix}-hair)" /><path d="M84 34 Q112 27 136 36" fill="none" stroke="${shineColor}" stroke-width="3" stroke-linecap="round" />`,
    parted: `<path d="M60 84 C59 43 83 26 110 26 C139 26 162 43 160 83 C145 57 128 50 118 50 L113 64 L104 50 C86 53 70 63 60 84 Z" fill="url(#${prefix}-hair)" />`,
    spiky: `<path d="M59 84 C57 48 75 26 96 20 L106 30 L120 16 L128 30 L144 23 C157 38 164 58 160 83 C146 59 128 50 108 51 C87 52 70 63 59 84 Z" fill="url(#${prefix}-hair)" />`,
    slick: `<path d="M59 80 C61 41 85 26 110 26 C136 26 160 41 161 80 C145 51 125 44 110 44 C95 44 75 51 59 80 Z" fill="url(#${prefix}-hair)" /><path d="M82 36 Q110 30 138 36" fill="none" stroke="${shineColor}" stroke-width="2.8" stroke-linecap="round" />`,
    curly: `<path d="M57 84 C57 50 72 28 92 24 C100 20 120 20 128 24 C148 28 163 50 163 84 C148 62 134 54 122 58 C112 51 98 51 88 58 C76 54 65 64 57 84 Z" fill="url(#${prefix}-hair)" />`
  };

  return { back: backMap[effStyle] || '', front: frontMap[effStyle] || frontMap.quiff };
}

export function buildCharacterSvgHtml(meta, prefix, genderOverride = null, appearance = null) {
  const baseP = meta.palette || {};
  const p = appearance ? { ...baseP, ...appearance } : baseP;
  const skin = appearance?.skinTone || REALISTIC_SKIN_TONES[0];
  const gender = genderOverride || meta.gender || 'female';
  const hair = buildHairPaths(appearance?.hairStyle || meta.hairStyle || 'bob', prefix, gender, p.shine || 'rgba(255,255,255,0.18)');
  const badgeText = esc(meta.badgeText || 'AI');
  const accent = esc(p.accent || '#38bdf8');
  const iris = esc(appearance?.eyeColor?.iris || '#334155');
  const irisRing = esc(appearance?.eyeColor?.ring || '#1e293b');
  const browMood = appearance?.browMood || 'warm';
  const browLeft = browMood === 'flat' ? 'M79 80 L98 80' : browMood === 'focused' ? 'M79 77 L98 82' : 'M79 80 Q89 74 98 80';
  const browRight = browMood === 'flat' ? 'M122 80 L141 80' : browMood === 'focused' ? 'M122 82 L141 77' : 'M122 80 Q131 74 141 80';

  // Extended seated upper-body framing that connects seamlessly behind the desk foreground
  let torsoDetail;
  if (meta.persona === 'tech') {
    torsoDetail = `
      <path d="M84 155 Q110 175 136 155" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="5.5" stroke-linecap="round" />
      <path d="M98 166 L96 212 M122 166 L124 212" stroke="rgba(255,255,255,0.28)" stroke-width="2.2" stroke-linecap="round" />
      <rect x="89" y="191" width="42" height="18" rx="7" fill="rgba(15, 23, 42, 0.52)" stroke="${accent}" stroke-width="1.4" />
      <text x="110" y="203.5" text-anchor="middle" fill="${accent}" font-size="10" font-weight="800" font-family="ui-monospace, monospace">${badgeText}</text>
    `;
  } else if (meta.tie) {
    torsoDetail = `
      <path d="M90 153 L110 198 L130 153 Z" fill="#f8fafc" />
      <path d="M82 155 L96 196 L88 214" fill="none" stroke="rgba(15,23,42,0.18)" stroke-width="2.2" stroke-linecap="round" />
      <path d="M138 155 L124 196 L132 214" fill="none" stroke="rgba(15,23,42,0.18)" stroke-width="2.2" stroke-linecap="round" />
      <path d="M106 161 L114 161 L116 194 L110 204 L104 194 Z" fill="${accent}" />
      <rect x="134" y="190" width="26" height="14" rx="5" fill="rgba(255,255,255,0.20)" />
      <text x="147" y="200" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="800">${badgeText}</text>
    `;
  } else {
    torsoDetail = `
      <path d="M91 153 L110 191 L129 153 Z" fill="#fffaf4" />
      <path d="M83 155 L97 195 L91 214" fill="none" stroke="rgba(15,23,42,0.14)" stroke-width="2.2" stroke-linecap="round" />
      <path d="M137 155 L123 195 L129 214" fill="none" stroke="rgba(15,23,42,0.14)" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="110" cy="175" r="3.8" fill="${accent}" />
      <rect x="134" y="190" width="27" height="14" rx="5" fill="rgba(15,23,42,0.26)" />
      <text x="147.5" y="200" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="800">${badgeText}</text>
    `;
  }

  const glassesType = appearance?.glasses || meta.glasses || 'none';
  let glassesSvg = '';
  if (glassesType === 'tech') {
    glassesSvg = `<g><rect x="73" y="83" width="31" height="24" rx="7" fill="rgba(56, 189, 248, 0.10)" stroke="#1e293b" stroke-width="2.4" /><rect x="116" y="83" width="31" height="24" rx="7" fill="rgba(56, 189, 248, 0.10)" stroke="#1e293b" stroke-width="2.4" /><line x1="104" y1="94" x2="116" y2="94" stroke="#1e293b" stroke-width="2.4" /><line x1="63" y1="93" x2="73" y2="93" stroke="#1e293b" stroke-width="2" /><line x1="147" y1="93" x2="157" y2="93" stroke="#1e293b" stroke-width="2" /></g>`;
  } else if (glassesType === 'round') {
    glassesSvg = `<g><circle cx="89" cy="95" r="14" fill="rgba(255,255,255,0.08)" stroke="#475569" stroke-width="2.1" /><circle cx="131" cy="95" r="14" fill="rgba(255,255,255,0.08)" stroke="#475569" stroke-width="2.1" /><line x1="103" y1="95" x2="117" y2="95" stroke="#475569" stroke-width="2.1" /><line x1="63" y1="94" x2="75" y2="94" stroke="#475569" stroke-width="1.8" /><line x1="145" y1="94" x2="157" y2="94" stroke="#475569" stroke-width="1.8" /></g>`;
  } else if (glassesType === 'executive') {
    glassesSvg = `<g><rect x="75" y="85" width="29" height="20" rx="6" fill="rgba(255, 255, 255, 0.08)" stroke="#78350f" stroke-width="2" /><rect x="116" y="85" width="29" height="20" rx="6" fill="rgba(255, 255, 255, 0.08)" stroke="#78350f" stroke-width="2" /><line x1="104" y1="94" x2="116" y2="94" stroke="#78350f" stroke-width="2" /><line x1="63" y1="93" x2="75" y2="93" stroke="#78350f" stroke-width="1.8" /><line x1="145" y1="93" x2="157" y2="93" stroke="#78350f" stroke-width="1.8" /></g>`;
  }

  let headsetSvg = '';
  if (meta.headset === 'studio') {
    headsetSvg = `<g><path d="M55 94 C53 43 79 24 110 24 C141 24 167 43 165 94" fill="none" stroke="#1e293b" stroke-width="7.5" stroke-linecap="round" /><rect x="49" y="80" width="14" height="33" rx="7" fill="${accent}" stroke="#0f172a" stroke-width="2.2" /><rect x="157" y="80" width="14" height="33" rx="7" fill="${accent}" stroke="#0f172a" stroke-width="2.2" /><path d="M162 110 Q152 128 126 129" fill="none" stroke="#334155" stroke-width="2.4" stroke-linecap="round" /></g>`;
  }

  const mouthPath =
    appearance?.smileMood === 'smile'
      ? `<path class="avatar-mouth-lip" d="M100 124 Q110 130 120 124" fill="none" stroke="${skin.earShadow}" stroke-width="2.3" stroke-linecap="round" />`
      : `<path class="avatar-mouth-lip" d="M103 125 Q110 127 117 125" fill="none" stroke="${skin.earShadow}" stroke-width="2.1" stroke-linecap="round" />`;

  return `
    <svg class="interviewer-svg" viewBox="10 2 200 210" role="img" aria-label="${esc(meta.avatarName)} — animated interviewer sitting at office desk">
      <defs>
        <radialGradient id="${prefix}-skin" cx="38%" cy="30%" r="68%">
          <stop offset="0%" stop-color="${skin.light}" />
          <stop offset="56%" stop-color="${skin.mid}" />
          <stop offset="100%" stop-color="${skin.shadow}" />
        </radialGradient>
        <radialGradient id="${prefix}-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${skin.blush}" stop-opacity="0.42" />
          <stop offset="100%" stop-color="${skin.blush}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="${prefix}-hair" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stop-color="${esc(p.hairA || '#4b352a')}" />
          <stop offset="100%" stop-color="${esc(p.hairB || '#221712')}" />
        </linearGradient>
        <linearGradient id="${prefix}-suit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${esc(p.suitA || '#fb7185')}" />
          <stop offset="100%" stop-color="${esc(p.suitB || '#be123c')}" />
        </linearGradient>
        <linearGradient id="${prefix}-neck" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${skin.mid}" />
          <stop offset="100%" stop-color="${skin.shadow}" />
        </linearGradient>
        <filter id="${prefix}-drop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.24" />
        </filter>
      </defs>
      <g class="avatar-hair-back">${hair.back}</g>
      <g class="avatar-torso" filter="url(#${prefix}-drop)">
        <path d="M16 218 C24 162 58 149 110 149 C162 149 196 162 204 218 Z" fill="url(#${prefix}-suit)" />
        <path d="M32 216 C42 174 68 159 94 157" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="3" stroke-linecap="round" />
        ${torsoDetail}
        <rect x="97" y="136" width="26" height="25" rx="11" fill="url(#${prefix}-neck)" />
      </g>
      <g class="avatar-head-group">
        <circle cx="62" cy="98" r="10.5" fill="${skin.mid}" />
        <path d="M58 95 Q61 98 59 102" fill="none" stroke="${skin.earShadow}" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="158" cy="98" r="10.5" fill="${skin.shadow}" />
        <path d="M162 95 Q159 98 161 102" fill="none" stroke="${skin.earShadow}" stroke-width="1.6" stroke-linecap="round" />
        <rect x="63" y="42" width="94" height="104" rx="45" fill="url(#${prefix}-skin)" />
        <ellipse cx="94" cy="59" rx="21" ry="8.5" fill="rgba(255,255,255,0.28)" transform="rotate(-10 94 59)" />
        <ellipse cx="81" cy="111" rx="11" ry="6" fill="url(#${prefix}-cheek)" />
        <ellipse cx="139" cy="111" rx="11" ry="6" fill="url(#${prefix}-cheek)" />
        ${hair.front}
        ${headsetSvg}
        <g class="avatar-face-eyes">
          <path class="avatar-brow-l" d="${browLeft}" fill="none" stroke="${esc(p.hairB || '#4b352a')}" stroke-width="3" stroke-linecap="round" />
          <path class="avatar-brow-r" d="${browRight}" fill="none" stroke="${esc(p.hairB || '#4b352a')}" stroke-width="3" stroke-linecap="round" />
          <g class="avatar-eyes-blink">
            <ellipse cx="89" cy="95" rx="9" ry="9.8" fill="#fefefe" />
            <g class="avatar-iris-l">
              <circle cx="89" cy="95.5" r="7" fill="${iris}" stroke="${irisRing}" stroke-width="1.2" />
              <circle cx="89" cy="95.5" r="3.9" fill="#0f172a" />
              <circle cx="91.6" cy="92.8" r="2.4" fill="#ffffff" />
              <circle cx="86.6" cy="98.2" r="1.1" fill="#ffffff" opacity="0.72" />
            </g>
            <path d="M80 91 Q89 83 98 91" fill="none" stroke="rgba(15,23,42,0.24)" stroke-width="1.7" stroke-linecap="round" />

            <ellipse cx="131" cy="95" rx="9" ry="9.8" fill="#fefefe" />
            <g class="avatar-iris-r">
              <circle cx="131" cy="95.5" r="7" fill="${iris}" stroke="${irisRing}" stroke-width="1.2" />
              <circle cx="131" cy="95.5" r="3.9" fill="#0f172a" />
              <circle cx="133.6" cy="92.8" r="2.4" fill="#ffffff" />
              <circle cx="128.6" cy="98.2" r="1.1" fill="#ffffff" opacity="0.72" />
            </g>
            <path d="M122 91 Q131 83 140 91" fill="none" stroke="rgba(15,23,42,0.24)" stroke-width="1.7" stroke-linecap="round" />
          </g>
        </g>
        <path d="M107.5 111 Q110 113.5 112.5 111" fill="none" stroke="${skin.earShadow}" stroke-width="1.6" stroke-linecap="round" />
        <g class="avatar-mouth-wrap">
          <path class="avatar-mouth-cavity" d="M101 124 Q110 124 119 124 Q110 125 101 124 Z" fill="#4c1d24" opacity="0" />
          <rect class="avatar-mouth-teeth" x="103" y="123.8" width="14" height="2" rx="1" fill="#f8fafc" opacity="0" />
          ${mouthPath}
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

function syncOfficeBackdrop(containerEl, appearance = null) {
  if (!containerEl) return;
  const fallbackOffice = OFFICE_BACKDROPS[0];
  const office = appearance?.office || fallbackOffice;
  const isFlipped = Boolean(appearance?.officeFlip);

  let bgEl = containerEl.querySelector('.stage-office-bg');
  if (!bgEl) {
    bgEl = document.createElement('div');
    bgEl.className = 'stage-office-bg';
    bgEl.setAttribute('aria-hidden', 'true');
    containerEl.prepend(bgEl);
  }
  bgEl.style.backgroundImage = `url('/assets/offices/${office.file}')`;
  bgEl.classList.toggle('is-flipped', isFlipped);
}

function mountDetailedCanvas(mountEl, roleLabel, stateGetter) {
  if (!mountEl) return null;
  let canvas = mountEl.querySelector('canvas.detailed-avatar-canvas');
  if (!canvas) {
    mountEl.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.className = 'detailed-avatar-canvas';
    canvas.setAttribute('role', 'img');
    mountEl.appendChild(canvas);
  }
  canvas.setAttribute('aria-label', `${roleLabel} — detailed studio interviewer avatar`);
  startDetailedAvatarLoop(canvas, stateGetter);
  return canvas;
}

export function renderAvatarVisual(force = false) {
  const meta = getActiveAgentMeta(state.lobbyCfg?.agentFile || state.activeSession?.agentFile);
  const voiceKey = state.lobbyCfg ? ($('#lobby-voice-select')?.value || meta.defaultVoice) : (state.activeSession?.voice || meta.defaultVoice);
  const gender = inferVoiceGender(voiceKey);
  const appearance = state.lobbyCfg?.appearance || state.activeSession?.appearance || null;
  const quality = state.user?.avatarQuality === 'detailed' ? 'detailed' : 'standard';
  const lobbyActive = !$('#view-lobby')?.classList.contains('inactive') && Boolean($('#lobby-settings-dialog')?.open);
  const arenaActive = !$('#view-arena')?.classList.contains('inactive');
  const key = `${quality}:${meta.id}:${gender}:${appearance?.sig || 'base'}:${lobbyActive ? 1 : 0}${arenaActive ? 1 : 0}`;

  if (force || key !== lastRenderedAvatarKey) {
    lastRenderedAvatarKey = key;
    const stateGetter = () => ({
      meta: getActiveAgentMeta(state.lobbyCfg?.agentFile || state.activeSession?.agentFile),
      gender: inferVoiceGender(state.lobbyCfg ? ($('#lobby-voice-select')?.value || meta.defaultVoice) : (state.activeSession?.voice || meta.defaultVoice)),
      appearance: state.lobbyCfg?.appearance || state.activeSession?.appearance || null,
      baseSmile: (state.lobbyCfg?.appearance || state.activeSession?.appearance)?.smileMood === 'smile' ? 0.36 : 0.14,
      getMode: () => avatarMode,
      getExpression: () => state.activeSession?.liveExpression || 'warm',
      getLipLevel: (now) => getSpeechLipLevel(now),
      getViseme: (now) => getSpeechViseme(now)
    });
    if (quality === 'detailed') {
      stopSvgAvatarLoopsExcept(new Set());
      const keep = new Set();
      if (arenaActive) {
        const c = mountDetailedCanvas($('#call-avatar-mount'), meta.avatarName, stateGetter);
        if (c) keep.add(c);
      }
      if (lobbyActive) {
        const c = mountDetailedCanvas($('#lobby-avatar-mount'), meta.avatarName, stateGetter);
        if (c) keep.add(c);
      }
      stopDetailedAvatarLoopsExcept(keep);
    } else {
      stopDetailedAvatarLoopsExcept(new Set());
      const keepSvgs = new Set();
      const mountSvg = (mountEl, prefix) => {
        if (!mountEl) return;
        mountEl.innerHTML = buildCharacterSvgHtml(meta, prefix, gender, appearance);
        const svg = mountEl.querySelector('svg.interviewer-svg');
        if (svg) {
          startSvgAvatarLoop(svg, stateGetter);
          keepSvgs.add(svg);
        }
      };
      if (arenaActive) mountSvg($('#call-avatar-mount'), 'call');
      if (lobbyActive) mountSvg($('#lobby-avatar-mount'), 'lobby');
      stopSvgAvatarLoopsExcept(keepSvgs);
    }
  }
  const p = appearance || meta.palette || {};
  const stage = $('#interviewer-stage');
  if (stage) {
    stage.style.setProperty('--stage-bg-a', p.bgA || '#1e293b');
    stage.style.setProperty('--stage-bg-b', p.bgB || '#020617');
    syncOfficeBackdrop(stage.querySelector('.call-video-canvas'), appearance);
  }
  const lobbyBox = $('#lobby-avatar-viewport');
  if (lobbyBox) {
    lobbyBox.style.setProperty('--stage-bg-a', p.bgA || '#ffffff');
    lobbyBox.style.setProperty('--stage-bg-b', p.bgB || '#dbeafe');
    syncOfficeBackdrop(lobbyBox, appearance);
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
  const topicLabels = getTopicUiLabels(state.catalog?.effectiveArchKey || 'general');
  $('#avatar-role-badge').textContent = isLogic
    ? (state.activeSession?.guestMode ? '🧑 Guest · 🧩 Logic' : '🧩 Logic Puzzle')
    : isTutor
      ? (state.activeSession?.guestMode ? '🧑 Guest Practice' : '🗣️ Practice')
      : `${meta.code} · ${topicLabels[meta.topic] || meta.topic}`;
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
