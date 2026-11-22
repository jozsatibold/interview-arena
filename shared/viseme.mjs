// Pure text-to-viseme timeline generator & sampler used by the hybrid lip-sync engine
// (browser Web Audio + Node unit tests, zero DOM dependency).

export function buildVisemeTimeline(text) {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return [];
  const frames = [];
  let cursor = 0;

  const pushFrame = (weight, open, width, round, close = false) => {
    frames.push({ start: 0, end: 0, weight, open, width, round, close });
  };

  while (cursor < s.length) {
    const ch = s[cursor];
    const next = s[cursor + 1] || '';
    const pair = ch + next;

    if (/[.!?;:]/.test(ch)) {
      pushFrame(3.0, 0, 0, 0, true, cursor);
      cursor += 1;
      continue;
    }
    if (ch === ',') {
      pushFrame(2.0, 0, 0, 0, true, cursor);
      cursor += 1;
      continue;
    }
    if (/\s/.test(ch)) {
      pushFrame(0.5, 0.04, 0, 0, false, cursor);
      cursor += 1;
      continue;
    }
    // Bilabial lip-seal consonants (m, b, p)
    if (ch === 'm' || ch === 'b' || ch === 'p') {
      pushFrame(0.75, 0, -0.08, 0, true, cursor);
      cursor += pair === ch + ch ? 2 : 1;
      continue;
    }
    // Labiodental (f, v)
    if (ch === 'f' || ch === 'v') {
      pushFrame(0.75, 0.14, 0.12, 0, false, cursor);
      cursor += pair === ch + ch ? 2 : 1;
      continue;
    }
    // Rounded digraphs & vowels/glides (oo, ou, ow, o, u, w, q)
    if (pair === 'oo' || pair === 'ou' || pair === 'ow') {
      pushFrame(1.4, 0.54, -0.4, 0.94, false, cursor);
      cursor += 2;
      continue;
    }
    if (ch === 'o' || ch === 'u' || ch === 'w' || ch === 'q') {
      pushFrame(1.25, 0.56, -0.34, 0.86, false, cursor);
      cursor += 1;
      continue;
    }
    // Wide spread digraphs & vowels (ee, ea, ie, i, e, y)
    if (pair === 'ee' || pair === 'ea' || pair === 'ie') {
      pushFrame(1.3, 0.42, 0.9, 0, false, cursor);
      cursor += 2;
      continue;
    }
    if (ch === 'i' || ch === 'e' || ch === 'y') {
      pushFrame(1.15, 0.44, 0.72, 0, false, cursor);
      cursor += 1;
      continue;
    }
    // Open jaw vowels (ai, ay, au, a)
    if (pair === 'ai' || pair === 'ay' || pair === 'au') {
      pushFrame(1.45, 0.86, 0.2, 0.14, false, cursor);
      cursor += 2;
      continue;
    }
    if (ch === 'a') {
      pushFrame(1.35, 0.88, 0.16, 0.12, false, cursor);
      cursor += 1;
      continue;
    }
    // Fricatives / alveolar consonants (sh, ch, th, s, z, etc.)
    if (pair === 'sh' || pair === 'ch' || pair === 'th') {
      pushFrame(0.85, 0.22, 0.36, 0.24, false, cursor);
      cursor += 2;
      continue;
    }
    if (/[a-z]/.test(ch)) {
      pushFrame(0.72, 0.24, 0.34, 0.06, false, cursor);
    }
    cursor += 1;
  }

  let total = 0;
  for (const f of frames) total += f.weight;
  if (total <= 0) return [];
  let acc = 0;
  for (const f of frames) {
    f.start = acc / total;
    acc += f.weight;
    f.end = acc / total;
  }
  return frames;
}

export function sampleVisemeTimeline(frames, u) {
  if (!frames.length) return { open: 0.45, width: 0.1, round: 0.1, close: false };
  const safeU = Number.isFinite(u) ? u : 0;
  const clamped = Math.max(0, Math.min(0.9999, safeU));
  let idx = frames.length - 1;
  for (let i = 0; i < frames.length; i++) {
    if (clamped <= frames[i].end) {
      idx = i;
      break;
    }
  }
  const cur = frames[idx];
  const next = frames[Math.min(frames.length - 1, idx + 1)];
  const span = Math.max(0.001, cur.end - cur.start);
  const localT = (clamped - cur.start) / span;
  const blend = localT > 0.7 ? (localT - 0.7) / 0.3 : 0;
  return {
    open: cur.open + (next.open - cur.open) * blend,
    width: cur.width + (next.width - cur.width) * blend,
    round: cur.round + (next.round - cur.round) * blend,
    close: cur.close && localT < 0.72
  };
}
