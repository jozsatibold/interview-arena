// Shared transcript normalization rules used cleanly by both Node STT/chat
// and the browser speech pipeline (zero client/server duplication).

export function normalizeInterviewTranscript(rawText) {
  const input = String(rawText || '').trim();
  if (!input) return '';
  return input
    .replace(/\bfront and\b|\bfront-and\b/gi, 'frontend')
    .replace(/\bback and\b|\bback-and\b/gi, 'backend')
    .replace(/\bconfig\s+cat\b/gi, 'ConfigCat')
    .replace(/\btrack\s+js\b/gi, 'TrackJS')
    .replace(/\brx\s*js\b|\bare\s+xjs\b|\bex\s+js\b/gi, 'RxJS')
    .replace(/\bng\s*rx\b|\bn\s+g\s+r\s+x\b|\benergy\s+rx\b/gi, 'NgRx')
    .replace(/\bexhaust\s+map\b|\bexhastmap\b/gi, 'exhaustMap')
    .replace(/\bswitch\s+map\b/gi, 'switchMap')
    .replace(/\bnext\s+js\b/gi, 'Next.js')
    .replace(/\bnest\s+js\b/gi, 'NestJS')
    .replace(/\btype\s+script\b/gi, 'TypeScript')
    .replace(/\bjava\s+script\b/gi, 'JavaScript')
    .replace(/\bplay\s*right\b/gi, 'Playwright')
    .replace(/\bweb\s+hook(s?)\b/gi, 'webhook$1')
    .replace(/\bmono\s+repo\b/gi, 'monorepo')
    .replace(/\bmicro[\s-]+front[\s-]+end(s?)\b/gi, 'micro-frontend$1')
    .replace(/\bshadow\s+dome\b/gi, 'Shadow DOM')
    .replace(/\bsolar\s+system\b/gi, 'the system')
    .replace(/\brectangular\b/gi, 'Angular')
    .replace(/\bblitz\b(?=.{0,60}\b(lit|l\s*i\s*t|google|tiny|framework|widget)\b)|(?<=\b(used|widget|framework)\b.{0,30})\bblitz\b/gi, 'Lit')
    .replace(/\b(altitude|sweater|swelter)\b(?=.{0,60}\b(svelte|framework|before|tiny|lit|angular|react|vue|used)\b)|(?<=\b(used|use|before that we use)\b.{0,30})\b(altitude|sweater|swelter)\b/gi, 'Svelte')
    .replace(/\bl\s+i\s+t\b/gi, 'Lit')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
