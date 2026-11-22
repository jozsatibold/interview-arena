// Shared transcript normalization rules used cleanly by both Node STT/chat
// and the browser speech pipeline (zero client/server duplication).

export function normalizeInterviewTranscript(rawText, { mode = 'interview' } = {}) {
  const input = String(rawText || '').trim();
  if (!input) return '';
  if (mode !== 'interview') {
    return input.replace(/\s{2,}/g, ' ').trim();
  }
  return input
    .replace(/\bfront and\b|\bfront-and\b/gi, 'frontend')
    .replace(/\bback and(?!\s+forth\b)|\bback-and\b/gi, 'backend')
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
    .replace(/\bplay\s*right(?!\s+(?:now|here|away|before|after)\b)\b/gi, 'Playwright')
    .replace(/\bweb\s+hook(s?)\b/gi, 'webhook$1')
    .replace(/\bmono\s+repo\b/gi, 'monorepo')
    .replace(/\bmicro[\s-]+front[\s-]+end(s?)\b/gi, 'micro-frontend$1')
    .replace(/\bshadow\s+dome\b/gi, 'Shadow DOM')
    .replace(/\bblitz\b(?=.{0,60}\b(lit|l\s*i\s*t|google|tiny|framework|widget)\b)|(?<=\b(used|widget|framework)\b.{0,30})\bblitz\b/gi, 'Lit')
    .replace(/\b(altitude|sweater|swelter)\b(?=.{0,60}\b(svelte|framework|before|tiny|lit|angular|react|vue|used)\b)|(?<=\b(used|use|before that we use)\b.{0,30})\b(altitude|sweater|swelter)\b/gi, 'Svelte')
    .replace(/\bl\s+i\s+t\b/gi, 'Lit')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeSpokenForDiff(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/\s+\*\s+/g, ' ')
    .replace(/\s+---+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes ONLY the unspoken remainder of `finalText` that has not yet been queued to TTS
 * during streaming. Prevents double-speaking when trailing whitespace/newlines or markdown
 * formatting (`**`, `---`) differ between streamed tokens and final `reply.spokenEnglish`.
 */
export function computeUnspokenTail(finalText, alreadyQueuedText) {
  const finalNorm = normalizeSpokenForDiff(finalText);
  if (!finalNorm) return '';
  const queuedNorm = normalizeSpokenForDiff(alreadyQueuedText);
  if (!queuedNorm) return finalNorm;
  if (finalNorm === queuedNorm || queuedNorm.startsWith(finalNorm)) return '';
  if (finalNorm.startsWith(queuedNorm)) {
    return finalNorm.slice(queuedNorm.length).trim();
  }
  const lowerFinal = finalNorm.toLowerCase();
  const lowerQueued = queuedNorm.toLowerCase();
  if (lowerFinal === lowerQueued || lowerQueued.startsWith(lowerFinal)) return '';
  if (lowerFinal.startsWith(lowerQueued)) {
    return finalNorm.slice(queuedNorm.length).trim();
  }
  // Anchor on the last 4 words of already-queued speech to find where unspoken text begins
  const qWords = lowerQueued.split(' ').filter(Boolean);
  for (let n = Math.min(5, qWords.length); n >= 2; n--) {
    const anchor = qWords.slice(-n).join(' ');
    const idx = lowerFinal.lastIndexOf(anchor);
    if (idx !== -1) {
      return finalNorm.slice(idx + anchor.length).trim();
    }
  }
  return '';
}
