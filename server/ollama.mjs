import { OLLAMA_BASE, MODEL_ALIASES } from './config.mjs';
import { detectModelParamBillions } from '../shared/model-tiers.mjs';

let activeOllamaBase = OLLAMA_BASE;

export function resolveModelAlias(modelName = '') {
  const raw = String(modelName || '').trim();
  return MODEL_ALIASES[raw] || raw;
}

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
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      return;
    }
    if (parsed && typeof parsed === 'object' && parsed.error) {
      throw new Error(String(parsed.error));
    }
    onObj(parsed);
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

function isPlainObject(val) {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

function scanBalancedJsonObject(str) {
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        try {
          const parsed = JSON.parse(str.slice(start, i + 1));
          if (isPlainObject(parsed)) return parsed;
        } catch {}
        start = -1;
      }
    }
  }
  return null;
}

export function parseJsonObjectStrict(rawText) {
  const trimmed = stripThinkBlocks(rawText).trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (isPlainObject(parsed)) return parsed;
  } catch {}
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1].trim());
      if (isPlainObject(parsed)) return parsed;
    } catch {}
    const balancedFenced = scanBalancedJsonObject(fenced[1].trim());
    if (balancedFenced) return balancedFenced;
  }
  return scanBalancedJsonObject(trimmed);
}

export function extractJsonSafe(rawText) {
  const strict = parseJsonObjectStrict(rawText);
  if (strict) return strict;
  const trimmed = stripThinkBlocks(rawText).trim();
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
    txt.match(/(?:\r?\n|\s+)(?:---+|```(?:json)?)\s*\{\s*"(?:expression|coachPause|grammarFixes|scratchpadPin|microTipHu)"/i) ||
    txt.match(/(?:\r?\n|\s+)\{\s*"(?:expression|coachPause|grammarFixes|scratchpadPin|microTipHu)"\s*:/i);
  if (fallbackMatch && fallbackMatch.index !== undefined) {
    return { idx: fallbackMatch.index, markerLen: fallbackMatch[0].indexOf('{') };
  }
  return { idx: -1, markerLen: 0 };
}

export async function fetchOllamaChat(payload, timeoutMs = 0, externalSignal = null) {
  const timeoutSignal = timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : null;
  const signal = externalSignal && timeoutSignal
    ? AbortSignal.any([externalSignal, timeoutSignal])
    : (externalSignal || timeoutSignal || undefined);
  const resolvedPayload = {
    keep_alive: '15m',
    think: false,
    ...payload,
    model: resolveModelAlias(payload?.model || '')
  };
  let res = await fetch(`${activeOllamaBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resolvedPayload),
    signal
  });
  if (!res.ok) {
    const errText = await res.text();
    if (/think/i.test(errText)) {
      const { think: _omit, ...noThinkPayload } = resolvedPayload;
      res = await fetch(`${activeOllamaBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noThinkPayload),
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
  const resolved = resolveModelAlias(modelName);
  return cachedInventoryByName.get(resolved) || cachedInventoryByName.get(String(modelName || '').trim()) || null;
}

export async function getOllamaTagInventory() {
  let ollamaRunning = false;
  let installedModels = [];
  let ollamaError = null;
  const bases = [...new Set([activeOllamaBase, OLLAMA_BASE, 'http://127.0.0.1:11434', 'http://localhost:11434'])];
  for (const base of bases) {
    try {
      const resp = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2000) });
      if (resp.ok) {
        activeOllamaBase = base;
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
