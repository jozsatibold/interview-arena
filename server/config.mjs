import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, '..');

export const PORT = Number(process.env.PORT || 3333);
export const OLLAMA_BASE = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
export const ZONOS_BASE = process.env.ZONOS_HOST || 'http://127.0.0.1:1919';
export const WHISPER_BASE = process.env.WHISPER_HOST || 'http://127.0.0.1:1818';
export const WHISPER_MODEL =
  process.env.WHISPER_MODEL || path.join(process.env.HOME || '', 'Models', 'whisper', 'ggml-large-v3-turbo.bin');

export const WHISPER_TECH_PROMPT =
  'Senior software engineering interview about Java, Spring Boot, Hibernate, Kafka, C#, .NET, ASP.NET Core, Entity Framework, PHP, Laravel, Symfony, Flutter, Dart, Riverpod, BLoC, QA automation, Playwright, Cypress, Selenium, RestAssured, PyTest, k6, Angular, React, TypeScript, RxJS, NgRx, Node.js, FastAPI, Kubernetes, Terraform, SQL, CI/CD, and system design.';

export const APP_DIR = path.join(ROOT_DIR, 'app');
export const SHARED_DIR = path.join(ROOT_DIR, 'shared');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const DB_FILE = path.join(DATA_DIR, 'arena.db');
export const STATE_FILE = path.join(DATA_DIR, 'user-state.json');
export const CUSTOM_INTERVIEWS_FILE = path.join(DATA_DIR, 'custom-interviews.json');

export const RECOMMENDED_MODELS = [
  {
    id: 'hf.co/LiquidAI/LFM2.5-2.6B-GGUF',
    label: 'LFM2.5 2.6B (Ultra-Fast 220 tok/s — Punches 4x above size)',
    sizeHint: '~1.8 GB',
    ramHint: '4+ GB RAM'
  },
  {
    id: 'hf.co/LiquidAI/LFM2-8B-A1B-GGUF',
    label: 'LFM2 8B-A1B MoE (Only 1B active params — Fast & Smart)',
    sizeHint: '~5.2 GB',
    ramHint: '16 GB RAM'
  },
  {
    id: 'hf.co/LiquidAI/LFM2.5-24B-A2B-GGUF',
    label: 'LFM2.5 24B-A2B MoE (2B active params — Beats 35B models)',
    sizeHint: '~15.0 GB',
    ramHint: '24+ GB RAM'
  },
  {
    id: 'hf.co/LiquidAI/LFM2.5-1.2B-Thinking-GGUF',
    label: 'LFM2.5 1.2B Thinking (~900 MB compact reasoning)',
    sizeHint: '~0.9 GB',
    ramHint: '4 GB RAM'
  },
  {
    id: 'qwen3.5:9b',
    label: 'Qwen 3.5 9B (Fast English Reasoning & JSON Coaching)',
    sizeHint: '~6.6 GB',
    ramHint: '16 GB RAM'
  },
  {
    id: 'llama3.1:8b',
    label: 'Llama 3.1 8B (Strong Conversational English)',
    sizeHint: '~4.9 GB',
    ramHint: '8+ GB RAM'
  },
  {
    id: 'qwen2.5:7b',
    label: 'Qwen 2.5 7B (Reliable JSON & Multilingual)',
    sizeHint: '~4.7 GB',
    ramHint: '8+ GB RAM'
  }
];

export const MODEL_ALIASES = {
  'lfm2.5:2.6b': 'hf.co/LiquidAI/LFM2.5-2.6B-GGUF',
  'lfm2.5:8b': 'hf.co/LiquidAI/LFM2-8B-A1B-GGUF',
  'lfm2.5:24b': 'hf.co/LiquidAI/LFM2.5-24B-A2B-GGUF',
  'lfm2.5-thinking': 'hf.co/LiquidAI/LFM2.5-1.2B-Thinking-GGUF'
};

export const AGENT_META = [
  {
    id: '01-hr-recruiter-screening.md',
    topic: 'HR',
    persona: 'hr',
    code: '01A',
    title: 'Internal Fintech Talent Partner',
    defaultJd: 'jd-01-senior-frontend-fintech-bnpl.md',
    avatarName: 'Maya',
    defaultVoice: 'AmericanFemale',
    gender: 'female',
    hairStyle: 'bob',
    glasses: 'none',
    headset: 'earpiece',
    tie: false,
    badgeText: 'HR',
    palette: { suitA: '#fb7185', suitB: '#be123c', hairA: '#6b3e26', hairB: '#381e12', bgA: '#fff1f2', bgB: '#ffe4e6', accent: '#f43f5e' }
  },
  {
    id: '01b-hr-agency-headhunter.md',
    topic: 'HR',
    persona: 'hr',
    code: '01B',
    title: 'Fast-Paced UK/DACH Agency Headhunter',
    defaultJd: 'jd-01-senior-frontend-fintech-bnpl.md',
    avatarName: 'Rupert',
    defaultVoice: 'BritishMale',
    gender: 'male',
    hairStyle: 'quiff',
    glasses: 'executive',
    headset: 'earpiece',
    tie: true,
    badgeText: 'UK',
    palette: { suitA: '#0ea5e9', suitB: '#0369a1', hairA: '#475569', hairB: '#1e293b', bgA: '#f0f9ff', bgB: '#bae6fd', accent: '#8b5cf6' }
  },
  {
    id: '01c-hr-founder-vp-chemistry.md',
    topic: 'HR',
    persona: 'business',
    code: '01C',
    title: 'Startup Founder / VP Chemistry Call',
    defaultJd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md',
    avatarName: 'Chloe',
    defaultVoice: 'Savannah en American F 1',
    gender: 'female',
    hairStyle: 'ponytail',
    glasses: 'round',
    headset: 'none',
    tie: false,
    badgeText: 'Founder',
    palette: { suitA: '#10b981', suitB: '#047857', hairA: '#d97706', hairB: '#92400e', bgA: '#ecfdf5', bgB: '#a7f3d0', accent: '#f59e0b' }
  },
  {
    id: '02-behavioral-leadership-star.md',
    topic: 'Behavioral',
    persona: 'business',
    code: '02A',
    title: 'Engineering Manager — STAR Leadership',
    defaultJd: 'jd-03-frontend-tech-lead-growth.md',
    avatarName: 'Marcus',
    defaultVoice: 'AmericanMale',
    gender: 'male',
    hairStyle: 'parted',
    glasses: 'executive',
    headset: 'none',
    tie: true,
    badgeText: 'STAR',
    palette: { suitA: '#1e293b', suitB: '#0f172a', hairA: '#292524', hairB: '#0c0a09', bgA: '#fefce8', bgB: '#fde68a', accent: '#f59e0b' }
  },
  {
    id: '02b-behavioral-product-and-growth.md',
    topic: 'Behavioral',
    persona: 'business',
    code: '02B',
    title: 'Product Director — Growth & UX ROI',
    defaultJd: 'jd-03-frontend-tech-lead-growth.md',
    avatarName: 'Imogen',
    defaultVoice: 'Imogen en British F 1',
    gender: 'female',
    hairStyle: 'bun',
    glasses: 'round',
    headset: 'none',
    tie: false,
    badgeText: 'ROI',
    palette: { suitA: '#0d9488', suitB: '#115e59', hairA: '#9a3412', hairB: '#431407', bgA: '#f0fdfa', bgB: '#99f6e4', accent: '#fbbf24' }
  },
  {
    id: '03-technical-deep-dive-architecture.md',
    topic: 'Technical',
    persona: 'tech',
    code: '03A',
    title: 'Performance, 12KB Widgets & CDN',
    defaultJd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md',
    avatarName: 'Alex',
    defaultVoice: 'Wyatt en American M 1',
    gender: 'male',
    hairStyle: 'spiky',
    glasses: 'tech',
    headset: 'studio',
    tie: false,
    badgeText: '12KB',
    palette: { suitA: '#334155', suitB: '#0f172a', hairA: '#3b2f2f', hairB: '#181111', bgA: '#0f172a', bgB: '#1e293b', accent: '#38bdf8' }
  },
  {
    id: '03b-tech-angular-nx-rxjs.md',
    topic: 'Technical',
    persona: 'tech',
    code: '03B',
    title: 'Angular, RxJS, NgRx & Nx Monorepo',
    defaultJd: 'jd-01-senior-frontend-fintech-bnpl.md',
    avatarName: 'Elena',
    defaultVoice: 'BritishFemale',
    gender: 'female',
    hairStyle: 'ponytail',
    glasses: 'tech',
    headset: 'studio',
    tie: false,
    badgeText: 'RxJS',
    palette: { suitA: '#581c87', suitB: '#3b0764', hairA: '#1e1b4b', hairB: '#09071a', bgA: '#1e1b4b', bgB: '#312e81', accent: '#e879f9' }
  },
  {
    id: '03c-tech-nodejs-payments-testing.md',
    topic: 'Technical',
    persona: 'tech',
    code: '03C',
    title: 'Node.js, Stripe/Bambora & Playwright',
    defaultJd: 'jd-01-senior-frontend-fintech-bnpl.md',
    avatarName: 'Cillian',
    defaultVoice: 'Cillian en Irish M 1',
    gender: 'male',
    hairStyle: 'quiff',
    glasses: 'none',
    headset: 'studio',
    tie: false,
    badgeText: 'Node',
    palette: { suitA: '#14532d', suitB: '#052e16', hairA: '#b45309', hairB: '#78350f', bgA: '#064e3b', bgB: '#022c22', accent: '#34d399' }
  },
  {
    id: '03d-tech-bug-triage-and-pr-review.md',
    topic: 'Technical',
    persona: 'tech',
    code: '03D',
    title: 'Interactive Bug Triage & PR Review',
    defaultJd: 'jd-01-senior-frontend-fintech-bnpl.md',
    avatarName: 'Jett',
    defaultVoice: 'Jett en energetic M 1',
    gender: 'male',
    hairStyle: 'spiky',
    glasses: 'tech',
    headset: 'studio',
    tie: false,
    badgeText: 'PR',
    palette: { suitA: '#27272a', suitB: '#18181b', hairA: '#18181b', hairB: '#09090b', bgA: '#1c1917', bgB: '#292524', accent: '#fb923c' }
  },
  {
    id: '04-live-coding-anti-freeze-trainer.md',
    topic: 'Live Coding',
    persona: 'tech',
    code: '04A',
    title: 'Anti-Freeze Coding — Async & RxJS',
    defaultJd: 'jd-01-senior-frontend-fintech-bnpl.md',
    avatarName: 'Lucas',
    defaultVoice: 'AmericanMale',
    gender: 'male',
    hairStyle: 'parted',
    glasses: 'round',
    headset: 'studio',
    tie: false,
    badgeText: '{ }',
    palette: { suitA: '#1d4ed8', suitB: '#1e3a8a', hairA: '#451a03', hairB: '#270e02', bgA: '#0f172a', bgB: '#172554', accent: '#60a5fa' }
  },
  {
    id: '04b-live-coding-data-state-analytics.md',
    topic: 'Live Coding',
    persona: 'tech',
    code: '04B',
    title: 'Anti-Freeze Coding — Analytics & State',
    defaultJd: 'jd-03-frontend-tech-lead-growth.md',
    avatarName: 'Nora',
    defaultVoice: 'Savannah en American F 1',
    gender: 'female',
    hairStyle: 'bun',
    glasses: 'round',
    headset: 'studio',
    tie: false,
    badgeText: 'fn()',
    palette: { suitA: '#3f3f46', suitB: '#18181b', hairA: '#78350f', hairB: '#451a03', bgA: '#111827', bgB: '#1f2937', accent: '#facc15' }
  },
  {
    id: '04c-live-coding-widgets-dom-maps.md',
    topic: 'Live Coding',
    persona: 'tech',
    code: '04C',
    title: 'Anti-Freeze Coding — Widgets, Flags & Maps',
    defaultJd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md',
    avatarName: 'Leo',
    defaultVoice: 'Wyatt en American M 1',
    gender: 'male',
    hairStyle: 'quiff',
    glasses: 'tech',
    headset: 'earpiece',
    tie: false,
    badgeText: 'DOM',
    palette: { suitA: '#155e75', suitB: '#083344', hairA: '#312e81', hairB: '#1e1b4b', bgA: '#082f49', bgB: '#0c4a6e', accent: '#22d3ee' }
  },
  {
    id: '05-system-design-fintech-saas.md',
    topic: 'System Design',
    persona: 'tech',
    code: '05',
    title: 'System Design (6 Fintech & SaaS Cases)',
    defaultJd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md',
    avatarName: 'Victor',
    defaultVoice: 'BritishMale',
    gender: 'male',
    hairStyle: 'parted',
    glasses: 'executive',
    headset: 'none',
    tie: false,
    badgeText: 'SYS',
    palette: { suitA: '#4c1d95', suitB: '#2e1065', hairA: '#64748b', hairB: '#334155', bgA: '#1e1b4b', bgB: '#2e1065', accent: '#a78bfa' }
  },
  {
    id: '06-salary-contract-negotiation.md',
    topic: 'Negotiation',
    persona: 'business',
    code: '06A',
    title: 'Internal Scope & Rate Review',
    defaultJd: 'jd-04-internal-role-reclassification.md',
    avatarName: 'Claire',
    defaultVoice: 'BritishFemale',
    gender: 'female',
    hairStyle: 'bob',
    glasses: 'executive',
    headset: 'none',
    tie: false,
    badgeText: '€55+',
    palette: { suitA: '#881337', suitB: '#4c0519', hairA: '#a16207', hairB: '#713f12', bgA: '#fffbeb', bgB: '#fef3c7', accent: '#f59e0b' }
  },
  {
    id: '06b-negotiation-eu-b2b-contracts.md',
    topic: 'Negotiation',
    persona: 'business',
    code: '06B',
    title: 'EU B2B Contract Negotiation (55-70€/h)',
    defaultJd: 'jd-01-senior-frontend-fintech-bnpl.md',
    avatarName: 'Henrik',
    defaultVoice: 'Cillian en Irish M 1',
    gender: 'male',
    hairStyle: 'quiff',
    glasses: 'executive',
    headset: 'none',
    tie: true,
    badgeText: '€65+',
    palette: { suitA: '#0f172a', suitB: '#020617', hairA: '#cbd5e1', hairB: '#94a3b8', bgA: '#f8fafc', bgB: '#e2e8f0', accent: '#0ea5e9' }
  }
];

export const COMPACT_CANDIDATE_PROFILE = `Candidate: Senior Software Engineer (EU remote / B2B or full-time, B2->C1 English, structured analytical problem-solver).
Focus areas: End-to-end product architecture, frontend/backend performance optimization, payment reliability, automated testing, and technical leadership.
Targets: Market-aligned Senior/Lead compensation and clear engineering scope.`;

export const ZONOS_PRESET_VOICES = [
  { key: 'AmericanFemale', label: '♀ American Female (Maya)', gender: 'female', matchers: ['AmericanFemale', 'Savannah'] },
  { key: 'BritishFemale', label: '♀ British Female (Elena / Claire)', gender: 'female', matchers: ['BritishFemale', 'Imogen'] },
  { key: 'Savannah en American F 1', label: '♀ Savannah (Chloe / Nora)', gender: 'female', matchers: ['Savannah'] },
  { key: 'Imogen en British F 1', label: '♀ Imogen (UK Director)', gender: 'female', matchers: ['Imogen'] },
  { key: 'AmericanMale', label: '♂ American Male (Marcus / Lucas)', gender: 'male', matchers: ['AmericanMale', 'Wyatt', 'Jett'] },
  { key: 'BritishMale', label: '♂ British Male (Rupert / Victor)', gender: 'male', matchers: ['Rupert', 'Cillian', 'BritishMale'] },
  { key: 'Wyatt en American M 1', label: '♂ Wyatt (Alex / Leo)', gender: 'male', matchers: ['Wyatt'] },
  { key: 'Cillian en Irish M 1', label: '♂ Cillian (Irish Tech / CTO)', gender: 'male', matchers: ['Cillian'] },
  { key: 'Jett en energetic M 1', label: '♂ Jett (Energetic Eng)', gender: 'male', matchers: ['Jett'] }
];

export const MORNING_PATH = [
  { day: 1, title: 'Fintech HR Pitch', topic: 'HR', agent: '01-hr-recruiter-screening.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 2, title: 'Widget Bundle & CDN', topic: 'Technical', agent: '03-technical-deep-dive-architecture.md', jd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md' },
  { day: 3, title: 'Anti-Freeze Async Kata', topic: 'Live Coding', agent: '04-live-coding-anti-freeze-trainer.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 4, title: 'Embedded Widget Design', topic: 'System Design', agent: '05-system-design-fintech-saas.md', jd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md' },
  { day: 5, title: 'Scope & Rate Review', topic: 'Negotiation', agent: '06-salary-contract-negotiation.md', jd: 'jd-04-internal-role-reclassification.md' },
  { day: 6, title: 'UK/DACH Agency Call', topic: 'HR', agent: '01b-hr-agency-headhunter.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 7, title: 'Angular, RxJS & Nx', topic: 'Technical', agent: '03b-tech-angular-nx-rxjs.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 8, title: 'Funnel Analytics Kata', topic: 'Live Coding', agent: '04b-live-coding-data-state-analytics.md', jd: 'jd-03-frontend-tech-lead-growth.md' },
  { day: 9, title: 'Team Lead STAR Drill', topic: 'Behavioral', agent: '02-behavioral-leadership-star.md', jd: 'jd-03-frontend-tech-lead-growth.md' },
  { day: 10, title: 'Beat Lowball €45/h', topic: 'Negotiation', agent: '06b-negotiation-eu-b2b-contracts.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 11, title: 'Founder Chemistry Call', topic: 'HR', agent: '01c-hr-founder-vp-chemistry.md', jd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md' },
  { day: 12, title: 'Node & Stripe Reliability', topic: 'Technical', agent: '03c-tech-nodejs-payments-testing.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 13, title: 'Feature Flag & Map Kata', topic: 'Live Coding', agent: '04c-live-coding-widgets-dom-maps.md', jd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md' },
  { day: 14, title: 'Resilient Checkout Design', topic: 'System Design', agent: '05-system-design-fintech-saas.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 15, title: 'Executive Raise Pushback', topic: 'Negotiation', agent: '06-salary-contract-negotiation.md', jd: 'jd-04-internal-role-reclassification.md' },
  { day: 16, title: 'Growth PM & UX ROI', topic: 'Behavioral', agent: '02b-behavioral-product-and-growth.md', jd: 'jd-03-frontend-tech-lead-growth.md' },
  { day: 17, title: 'Bug Triage & PR Review', topic: 'Technical', agent: '03d-tech-bug-triage-and-pr-review.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 18, title: 'RxJS Promo Stream Kata', topic: 'Live Coding', agent: '04-live-coding-anti-freeze-trainer.md', jd: 'jd-01-senior-frontend-fintech-bnpl.md' },
  { day: 19, title: '10k-Pin Map / LLM Design', topic: 'System Design', agent: '05-system-design-fintech-saas.md', jd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md' },
  { day: 20, title: 'Nordic CTO Close (€65/h)', topic: 'Negotiation', agent: '06b-negotiation-eu-b2b-contracts.md', jd: 'jd-02-senior-fullstack-ecommerce-widget-saas.md' }
];

export const POWERUP_CATALOG = [
  {
    id: 'antiFreezeShield',
    icon: '🧊',
    name: 'Anti-Freeze 2m Shield',
    description: 'Starts a calm 2-minute Analysis Phase countdown timer in Arena before coding or architecture.',
    xpCost: 100,
    gemCost: 30
  },
  {
    id: 'seniorHint',
    icon: '💡',
    name: 'Senior Power-Verb Hint',
    description: 'Reveals 5 curated C1 Senior framing & time-buying phrases on-demand in your call.',
    xpCost: 120,
    gemCost: 35
  },
  {
    id: 'doubleXpRetry',
    icon: '🔄',
    name: '2x XP Session Boost',
    description: 'Doubles ALL XP earned from answers, Say-It-Again retries, and final scorecard in that call.',
    xpCost: 150,
    gemCost: 45
  },
  {
    id: 'streakFreeze',
    icon: '🛡️',
    name: 'Streak Freeze',
    description: 'Protects your daily practice streak automatically if you ever miss a day.',
    xpCost: 200,
    gemCost: 60
  }
];

export const TUTOR_CATALOG = {
  teachers: [
    {
      id: 'tutor-sarah',
      name: 'Ms. Sarah',
      avatarName: 'Sarah',
      accent: 'American English',
      voice: 'AmericanFemale',
      specialty: 'Warm Conversation & Clear Grammar Rules',
      bio: 'Patient, upbeat American English teacher who loves natural storytelling and explains grammar logic simply without judgment.',
      gender: 'female',
      hairStyle: 'layered',
      glasses: 'round',
      headset: 'none',
      palette: { suitA: '#059669', suitB: '#065f46', hairA: '#65432e', hairB: '#362114', iris: '#4d6b43', ring: '#2d4226', bgA: '#ecfdf5', bgB: '#d1fae5', accent: '#34d399' }
    },
    {
      id: 'tutor-claire',
      name: 'Ms. Claire',
      avatarName: 'Claire',
      accent: 'British English',
      voice: 'BritishFemale',
      specialty: 'Tense Precision, Prepositions & Polished Tone',
      bio: 'Encouraging Oxford-style British tutor who catches subtle tense slips, article habits, and explains why native phrasing clicks.',
      gender: 'female',
      hairStyle: 'bob',
      glasses: 'executive',
      headset: 'none',
      palette: { suitA: '#be123c', suitB: '#881337', hairA: '#8b3e24', hairB: '#4a1d0d', iris: '#2e6395', ring: '#1a3b5c', bgA: '#fff1f2', bgB: '#ffe4e6', accent: '#fb7185' }
    },
    {
      id: 'tutor-hannah',
      name: 'Ms. Hannah',
      avatarName: 'Hannah',
      accent: 'Relaxed Neutral US',
      voice: 'Savannah en American F 1',
      specialty: 'Everyday Idioms, Word Order & Confidence',
      bio: 'Friendly modern speaking coach focused on helping you stop translating in your head and sound relaxed in daily & work chats.',
      gender: 'female',
      hairStyle: 'ponytail',
      glasses: 'none',
      headset: 'earpiece',
      palette: { suitA: '#0d9488', suitB: '#115e59', hairA: '#d4a64a', hairB: '#8f671e', iris: '#8d5b24', ring: '#543310', bgA: '#f0fdfa', bgB: '#ccfbf1', accent: '#5eead4' }
    }
  ],
  topics: [
    { id: 'fresh-rotate', label: '🎲 Fresh Diverse Topic (Auto-Picks Something New Each Time)', prompt: 'Automatically rotate to a fresh, interesting topic we have not explored recently, gently connecting hobbies only as natural analogies' },
    { id: 'small-talk', label: '🗣️ Free Conversation & Storytelling', prompt: 'Friendly casual conversation about daily life, hobbies, travel, routines, and telling stories naturally' },
    { id: 'tenses', label: '⏰ Tenses Clinic (Present Perfect vs Past)', prompt: 'Practice talking about work history and past events while fixing for/since and Present Perfect vs Past Simple mistakes' },
    { id: 'prepositions', label: '🎯 Prepositions, Articles & Word Order', prompt: 'Spot and explain natural prepositions (on/at/in, for/since), articles (a/an/the), and natural English word order' },
    { id: 'work-english', label: '💼 Calm Work & Tech Explanations', prompt: 'Practice explaining everyday work, bugs, teamwork, and opinions smoothly and conversationally without interview pressure' }
  ],
  levels: [
    { id: 'B1-B2', label: 'B1 → B2 Confidence Builder' },
    { id: 'B2-C1', label: 'B2 → C1 Natural Fluency' },
    { id: 'C1-C2', label: 'C1 → C2 Idiomatic Polish' }
  ]
};

export const TUTOR_ROTATION_ANGLES = [
  'Travel surprises, navigating unfamiliar cities & weird local food',
  'Why some daily habits stick effortlessly while others fall apart',
  'City architecture, walkability & places that immediately change your mood',
  'Books, films or series that aged surprisingly well vs terribly',
  'How automation and AI change everyday creative skills & craftsmanship',
  'Weekend recharging: quiet solo projects vs chaotic social plans',
  'Physical endurance, pacing & learning any sport or skill from scratch',
  'Cooking experiments, street food & funny kitchen disasters',
  'Live music, soundtracks & why songs anchor specific memories',
  'Weird cultural habits people only notice after visiting another country',
  'Retro games, childhood hobbies & how we used to solve boredom',
  'Deep focus vs context-switching in modern work & life',
  'Surprising science, space, or biology facts that shift perspective',
  'Minimalism vs collecting gear — things we actually use every week',
  'Memorable teamwork moments: great mentors vs frustrating bottlenecks',
  'Short hypothetical dilemmas: where would you live for 6 months and why?'
];

export const DEFAULT_STUDENT_MEMORY = {
  hobbies: [],
  facts: [],
  topicScores: [],
  cognitiveMap: {
    thinkingStyle: 'Observing your style as we chat...',
    explanationPreference: 'Balanced rules + concrete examples',
    tonePreference: 'Grounded, natural & proportional (no fake hype)',
    summary: 'Start an English Tutor session so your teacher can map your interests, topics, and thinking style automatically.'
  },
  recentAngles: [],
  updatedAt: ''
};

export const DEFAULT_STATE = {
  xp: 0,
  gems: 150,
  streak: 0,
  lastPracticeDate: null,
  streakFreezes: 2,
  selectedModel: 'lfm2.5:8b',
  plannerModel: '',
  visionModel: '',
  preferredVoice: '',
  ttsEngine: 'auto',
  zonosVoice: 'AmericanFemale',
  defaultAutoSpeak: true,
  defaultContinuousFlow: true,
  powerUps: {
    antiFreezeShield: 3,
    seniorHint: 4,
    doubleXpRetry: 2
  },
  completedDays: [],
  sessions: [],
  mistakes: [
    {
      id: 'seed-1',
      category: 'B2-to-Senior',
      original: 'I made the widget smaller.',
      better: "I trimmed the widget's bundle footprint by 83% (70 KB down to 12 KB).",
      reasonHu: 'Grammatically valid, but too plain for a €65/h Senior role. Use "trimmed the bundle footprint" to signal engineering depth.',
      count: 2,
      mastered: false,
      topic: 'Technical',
      lastSeen: 'Seed tip'
    },
    {
      id: 'seed-2',
      category: 'B2-to-Senior',
      original: 'I made the test project for interviews.',
      better: 'I designed the frontend technical assessment and currently lead candidate interviews.',
      reasonHu: 'Never say "make a test" — "designed the technical assessment" and "lead interviews" convey executive authority.',
      count: 2,
      mastered: false,
      topic: 'HR',
      lastSeen: 'Seed tip'
    },
    {
      id: 'seed-3',
      category: 'Anti-Freeze',
      original: 'I froze / I need time before coding.',
      better: 'Before writing any code, may I take two minutes to clarify edge cases and outline the steps in comments?',
      reasonHu: 'Never stay silent under live coding pressure. This sentence frames your analytical thinking as a strength.',
      count: 3,
      mastered: false,
      topic: 'Live Coding',
      lastSeen: 'Seed tip'
    },
    {
      id: 'seed-4',
      category: 'NDA-Safety',
      original: 'Our internal conversion rate went from X% to Y%.',
      better: 'Through funnel telemetry analysis, we drove a double-digit relative conversion uplift.',
      reasonHu: 'Protect confidential baselines: avoid sharing raw internal conversion figures externally; frame impact in percentage points or relative uplift.',
      count: 1,
      mastered: false,
      topic: 'Behavioral',
      lastSeen: 'Seed tip'
    }
  ]
};

export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};
