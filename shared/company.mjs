// Shared fictional interviewer company generator that avoids any company names
// mentioned in the candidate's uploaded CV.

export const FICTIONAL_COMPANY_POOL = [
  'Northbridge Pay',
  'Kestrel Cloud',
  'Looma Commerce',
  'Veridian Metrics',
  'Briarwood Systems',
  'Cobalt Ledger',
  'Halcyon Data',
  'Solstice Fintech',
  'Redwood Stack',
  'Driftline Software',
  'Oakridge Financial',
  'BrightCart Labs',
  'Mariner Platform',
  'SignalPeak AI',
  'Castlegate Digital',
  'HarborPay Europe',
  'SummitFlow SaaS',
  'Copperleaf Security',
  'BlueJay Telemetry',
  'AnchorPoint Systems',
  'Silverline Commerce',
  'AmberWave Analytics',
  'Alderwood Cloud',
  'Crestview Payments',
  'Ironbark Tech',
  'Fernbrook Digital',
  'NordicPulse SaaS',
  'Riverstone Labs',
  'QuarryData EU',
  'Meridian Checkout',
  'HorizonGate Tech',
  'SaffronFlow Platform',
  'LindenPay Europe',
  'Pinecone Logistics',
  'StarlingGrid Systems',
  'CedarWorks Tech'
];

const SYNTHETIC_PREFIXES = ['Alder', 'Boreal', 'Cobalt', 'Falcon', 'Harbor', 'Kestrel', 'Linden', 'Mariner', 'Oakhaven', 'Solstice', 'Timber', 'Veridian'];
const SYNTHETIC_SUFFIXES = ['Cloud', 'Systems', 'Pay', 'Metrics', 'Labs', 'Platform', 'Digital', 'Stack'];

function primaryBrandToken(companyName) {
  return String(companyName || '')
    .trim()
    .toLowerCase()
    .split(/[\s-]+/)[0] || '';
}

export function companyAppearsInText(companyName, text) {
  const hay = String(text || '').toLowerCase();
  if (!hay || !companyName) return false;
  const full = String(companyName).trim().toLowerCase();
  if (full && hay.includes(full)) return true;
  const token = primaryBrandToken(companyName);
  return token.length >= 4 && new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(hay);
}

export function pickRandomCompanyName(excludedText = '', avoidCompany = '') {
  const avoidLower = String(avoidCompany || '').trim().toLowerCase();
  const candidates = FICTIONAL_COMPANY_POOL.filter((name) => {
    if (avoidLower && name.toLowerCase() === avoidLower) return false;
    return !companyAppearsInText(name, excludedText);
  });

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  for (let i = 0; i < 24; i++) {
    const p = SYNTHETIC_PREFIXES[Math.floor(Math.random() * SYNTHETIC_PREFIXES.length)];
    const s = SYNTHETIC_SUFFIXES[Math.floor(Math.random() * SYNTHETIC_SUFFIXES.length)];
    const combo = `${p}${s} Group`;
    if (!companyAppearsInText(combo, excludedText)) return combo;
  }
  return 'Kestrel Horizon Systems';
}
