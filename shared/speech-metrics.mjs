/**
 * Shared Call Speech & Delivery Analytics Engine (`EXP-08`)
 * Computes objective WPM, filler word frequency, talk ratio, and turn length metrics.
 */

const FILLER_PATTERNS = [
  { key: 'um / uh', re: /\b(?:um+|uh+|er+|ah+)\b/gi },
  { key: 'like', re: /\blike\b/gi },
  { key: 'basically', re: /\bbasically\b/gi },
  { key: 'actually', re: /\bactually\b/gi },
  { key: 'you know', re: /\byou know\b/gi },
  { key: 'kind of / sort of', re: /\b(?:kind|sort) of\b/gi },
  { key: 'literally', re: /\bliterally\b/gi }
];

function countWords(text) {
  const clean = String(text || '').trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

export function computeCallSpeechMetrics({
  messages = [],
  userSpeakMs = 0,
  aiSpeakMs = 0,
  turnDurationsMs = []
} = {}) {
  const list = Array.isArray(messages) ? messages : [];
  const userTexts = list.filter((m) => m?.role === 'user').map((m) => String(m.content || ''));
  const aiTexts = list.filter((m) => m?.role === 'assistant').map((m) => String(m.content || ''));

  const userWords = userTexts.reduce((sum, t) => sum + countWords(t), 0);
  const aiWords = aiTexts.reduce((sum, t) => sum + countWords(t), 0);
  const userTurns = userTexts.length;

  const uMs = Math.max(0, Number(userSpeakMs || 0));
  const aMs = Math.max(0, Number(aiSpeakMs || 0));

  let wpm = null;
  let wpmBand = 'Typed mode';
  if (uMs >= 5000 && userWords >= 5) {
    wpm = Math.round(userWords / (uMs / 60000));
    if (wpm < 110) wpmBand = 'Deliberate (<110 WPM)';
    else if (wpm <= 165) wpmBand = 'Ideal (110–165 WPM)';
    else wpmBand = 'Fast (>165 WPM)';
  }

  const combinedUserText = userTexts.join(' ');
  const fillerCounts = [];
  let fillerCount = 0;
  for (const fp of FILLER_PATTERNS) {
    const matches = combinedUserText.match(fp.re);
    if (matches && matches.length > 0) {
      fillerCount += matches.length;
      fillerCounts.push({ label: fp.key, count: matches.length });
    }
  }
  fillerCounts.sort((a, b) => b.count - a.count);
  const fillersPer100Words = userWords > 0 ? Math.round((fillerCount / userWords) * 1000) / 10 : 0;

  let userTalkPct = 50;
  let aiTalkPct = 50;
  if (uMs + aMs >= 2000 && uMs > 0) {
    userTalkPct = Math.round((uMs / (uMs + aMs)) * 100);
    aiTalkPct = 100 - userTalkPct;
  } else if (userWords + aiWords > 0) {
    userTalkPct = Math.round((userWords / (userWords + aiWords)) * 100);
    aiTalkPct = 100 - userTalkPct;
  }

  const validTurns = (Array.isArray(turnDurationsMs) ? turnDurationsMs : [])
    .map((d) => Number(d || 0))
    .filter((d) => Number.isFinite(d) && d > 0);
  const avgTurnSec = validTurns.length
    ? Math.round(validTurns.reduce((s, d) => s + d, 0) / validTurns.length / 1000)
    : 0;
  const longestTurnSec = validTurns.length ? Math.round(Math.max(...validTurns) / 1000) : 0;

  return {
    userWords,
    aiWords,
    userTurns,
    userSpeakSec: Math.round(uMs / 1000),
    aiSpeakSec: Math.round(aMs / 1000),
    wpm,
    wpmBand,
    fillerCount,
    fillersPer100Words,
    topFillers: fillerCounts.slice(0, 3),
    userTalkPct,
    aiTalkPct,
    avgTurnSec,
    longestTurnSec
  };
}
