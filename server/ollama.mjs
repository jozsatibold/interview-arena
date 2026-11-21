import { OLLAMA_BASE } from './config.mjs';
import { detectModelParamBillions } from '../shared/model-tiers.mjs';

export function stripThinkBlocks(rawText) {
  return String(rawText || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '');
}

export async function consumeNdjsonBody(bodyStream, onObj) {
  if (!bodyStream) return;
  const decoder = new TextDecoder();
  let ndjsonBuf = '';
  const flushLine = (line) => {
    if (!line.trim()) return;
    try {
      onObj(JSON.parse(line));
    } catch {}
  };
  for await (const chunk of bodyStream) {
    ndjsonBuf += decoder.decode(chunk, { stream: true });
    const lines = ndjsonBuf.split('\n');
    ndjsonBuf = lines.pop() || '';
    for (const line of lines) flushLine(line);
  }
  ndjsonBuf += decoder.decode();
  if (ndjsonBuf.trim()) {
    for (const line of ndjsonBuf.split('\n')) flushLine(line);
  }
}

export function extractJsonSafe(rawText) {
  const trimmed = stripThinkBlocks(rawText).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {}
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
  }
  return {
    spokenEnglish: trimmed.replace(/```[\s\S]*?```/g, '').trim() || "Let's continue. Could you tell me more about your architectural approach?",
    coachPause: null,
    microTipHu: null,
    scorecard: null
  };
}

export const COACH_JSON_DELIMITER = '---COACH_JSON---';

export function findCoachMarker(txt) {
  const exact = txt.indexOf(COACH_JSON_DELIMITER);
  if (exact !== -1) return { idx: exact, markerLen: COACH_JSON_DELIMITER.length };
  const fallbackMatch =
    txt.match(/(?:\r?\n|\s+)(?:---+|```(?:json)?)\s*\{\s*"(?:coachPause|grammarFixes|scratchpadPin|microTipHu)"/i) ||
    txt.match(/(?:\r?\n|\s+)\{\s*"(?:coachPause|grammarFixes)"\s*:/i);
  if (fallbackMatch && fallbackMatch.index !== undefined) {
    return { idx: fallbackMatch.index, markerLen: fallbackMatch[0].indexOf('{') };
  }
  return { idx: -1, markerLen: 0 };
}

export async function fetchOllamaChat(payload, timeoutMs = 0) {
  const signal = timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;
  let res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keep_alive: '15m', think: false, ...payload }),
    signal
  });
  if (!res.ok) {
    const errText = await res.text();
    if (/think/i.test(errText)) {
      res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keep_alive: '15m', ...payload }),
        signal
      });
    } else {
      throw new Error(`Ollama error (${res.status}): ${errText}`);
    }
  }
  if (!res.ok) {
    throw new Error(`Ollama error (${res.status}): ${await res.text()}`);
  }
  return res;
}

let cachedInventoryByName = new Map();

export function getCachedModelMeta(modelName = '') {
  return cachedInventoryByName.get(String(modelName || '').trim()) || null;
}

export async function getOllamaTagInventory() {
  let ollamaRunning = false;
  let installedModels = [];
  let ollamaError = null;
  const bases = [...new Set([OLLAMA_BASE, 'http://127.0.0.1:11434', 'http://localhost:11434'])];
  for (const base of bases) {
    try {
      const resp = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2000) });
      if (resp.ok) {
        const data = await resp.json();
        ollamaRunning = true;
        ollamaError = null;
        installedModels = (data.models || []).map((m) => {
          const detected = detectModelParamBillions({
            name: m.name,
            parameterSize: m.details?.parameter_size || '',
            sizeBytes: m.size || 0
          });
          return {
            name: m.name,
            sizeGB: m.size ? (m.size / 1e9).toFixed(1) : '?',
            sizeBytes: m.size || 0,
            parameterSize: m.details?.parameter_size || '',
            detectedTier: detected.tier,
            detectedParamB: detected.paramB,
            detectionSource: detected.source
          };
        });
        cachedInventoryByName = new Map(installedModels.map((item) => [item.name, item]));
        break;
      }
      ollamaError = `HTTP ${resp.status}`;
    } catch (err) {
      ollamaError = err.message;
    }
  }
  return { ollamaRunning, installedModels, ollamaError };
}

export function pickRecommendedPlannerModels(installedModels) {
  const rankModel = (m) => {
    const n = m.name.toLowerCase();
    let score = 0;
    if (/35b|27b/.test(n)) score += 55;
    else if (/32b|30b|24b/.test(n)) score += 45;
    else if (/14b|12b|9b/.test(n)) score += 25;
    if (/qwen3\.8|qwen3\.6|qwopus/.test(n)) score += 35;
    else if (/ornith|lfm2\.5-24b|glm/.test(n)) score += 15;
    if (/embed|flux/.test(n)) score -= 100;
    if (/-vl\b|vision/.test(n)) score -= 10;
    return score;
  };
  return [...installedModels]
    .filter((m) => !/embed|flux/i.test(m.name))
    .sort((a, b) => rankModel(b) - rankModel(a));
}

export function pickVisionModels(installedModels) {
  return installedModels
    .filter((m) => /vl|vision|llava|minicpm-v|moondream|gemma3|gemma4|qwen3\.5|clef/i.test(m.name))
    .sort((a, b) => {
      const weight = (n) => (/qwen3-vl|vl\b/i.test(n) ? 4 : /vision|llava|clef/i.test(n) ? 3 : /gemma4|gemma3/i.test(n) ? 2 : 1);
      return weight(b.name) - weight(a.name);
    });
}

export function estimateModelDurationSec(modelName = '') {
  const n = String(modelName || '').toLowerCase();
  if (/35b|32b|27b|70b/.test(n)) return 62;
  if (/24b|14b|12b/.test(n)) return 42;
  if (/7b|8b|9b/.test(n)) return 26;
  return 18;
}

export function summarizeMdPrompt(text, maxChars = 1900) {
  const trimmed = String(text || '').trim();
  return trimmed.length > maxChars ? trimmed.slice(0, maxChars) : trimmed;
}
