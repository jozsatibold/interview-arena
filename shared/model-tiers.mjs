/**
 * Shared LLM Size Detection & Context Optimization Tier Catalog
 * Used by both server (prompt budgeting / Ollama options) and client (model selector UI).
 */

export const LLM_CONTEXT_TIERS = {
  small: {
    id: 'small',
    emoji: '⚡',
    title: 'Small LLMs',
    rangeLabel: '1B–8B',
    summary: 'Compact context, tight 3-turn memory & lean instructions for fast, reliable 1B–8B inference.',
    budgets: {
      maxAgentChars: 700,
      maxJdChars: 550,
      maxProfileChars: 480,
      maxHistoryMsgs: 6,
      numCtx: 4096,
      numPredict: 260,
      repeatPenalty: 1.12,
      compactPrompt: true
    }
  },
  medium: {
    id: 'medium',
    emoji: '🧠',
    title: 'Medium LLMs',
    rangeLabel: '9B–35B',
    summary: 'Balanced CV/JD context, smooth multi-turn transitions & real-time coaching for 9B–35B models.',
    budgets: {
      maxAgentChars: 1650,
      maxJdChars: 1200,
      maxProfileChars: 950,
      maxHistoryMsgs: 12,
      numCtx: 8192,
      numPredict: 380,
      repeatPenalty: 1.05,
      compactPrompt: false
    }
  },
  large: {
    id: 'large',
    emoji: '🏔️',
    title: 'Large LLMs',
    rangeLabel: '36B+',
    summary: 'Deep full-CV & JD context, extended call history & nuanced trade-off follow-ups for 36B+ models.',
    budgets: {
      maxAgentChars: 2600,
      maxJdChars: 2000,
      maxProfileChars: 1600,
      maxHistoryMsgs: 24,
      numCtx: 16384,
      numPredict: 460,
      repeatPenalty: 1.02,
      compactPrompt: false
    }
  }
};

export function tierFromParamBillions(paramB) {
  if (!Number.isFinite(paramB) || paramB <= 0) return 'medium';
  if (paramB <= 8.5) return 'small';
  if (paramB <= 35.5) return 'medium';
  return 'large';
}

function parseParamToken(rawStr) {
  const s = String(rawStr || '').trim().toLowerCase();
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*(b|m)\b/);
  if (!m) return null;
  const num = Number(m[1]);
  if (!Number.isFinite(num) || num <= 0) return null;
  return m[2] === 'm' ? Number((num / 1000).toFixed(2)) : num;
}

/**
 * Scrape parameter size (billions) from Ollama details metadata, model name, or byte size.
 */
export function detectModelParamBillions({ name = '', parameterSize = '', sizeBytes = 0, sizeGB = null } = {}) {
  const fromMeta = parseParamToken(parameterSize);
  if (fromMeta) {
    return {
      paramB: fromMeta,
      source: 'metadata',
      tier: tierFromParamBillions(fromMeta)
    };
  }

  const lower = String(name || '').toLowerCase();
  // Match total parameter tag like :4b, -2.6b, :35b-a3b, :e4b, :70b, :500m (avoid matching -a3b active MoE count as primary)
  const nameMatches = [...lower.matchAll(/(?:^|[:\-_/\s])(a|e)?(\d+(?:\.\d+)?)\s*(b|m)(?=$|[:\-_.\s/])/g)];
  const primaryMatch = nameMatches.find((match) => match[1] !== 'a') || nameMatches[0];
  if (primaryMatch) {
    const rawNum = Number(primaryMatch[2]);
    const paramB = primaryMatch[3] === 'm' ? Number((rawNum / 1000).toFixed(2)) : rawNum;
    if (Number.isFinite(paramB) && paramB > 0) {
      return {
        paramB,
        source: 'name',
        tier: tierFromParamBillions(paramB)
      };
    }
  }

  if (/\b(?:tiny|nano|micro|mini)\b|[:-](?:mini|tiny|nano)\b/.test(lower)) {
    return { paramB: 3.8, source: 'name', tier: 'small' };
  }
  if (/[:-]small\b/.test(lower)) {
    return { paramB: 7, source: 'name', tier: 'small' };
  }
  if (/[:-]medium\b/.test(lower)) {
    return { paramB: 14, source: 'name', tier: 'medium' };
  }
  if (/[:-](?:large|xl)\b/.test(lower)) {
    return { paramB: 40, source: 'name', tier: 'large' };
  }

  const gb = Number(sizeBytes) > 0 ? Number(sizeBytes) / 1e9 : Number(sizeGB || 0);
  if (Number.isFinite(gb) && gb > 0) {
    if (gb <= 5.5) return { paramB: 4, source: 'size', tier: 'small' };
    if (gb <= 25) return { paramB: 14, source: 'size', tier: 'medium' };
    return { paramB: 40, source: 'size', tier: 'large' };
  }

  return { paramB: null, source: 'default', tier: 'medium' };
}

/**
 * Resolve effective context tier and numeric budgets for a chosen preference + model.
 */
export function resolveEffectiveContextTier({ preference = 'auto', modelName = '', modelMeta = null } = {}) {
  const cleanPref = ['auto', 'small', 'medium', 'large'].includes(String(preference || '').toLowerCase())
    ? String(preference).toLowerCase()
    : 'auto';

  const detected = detectModelParamBillions({
    name: modelName || modelMeta?.name || modelMeta?.id || '',
    parameterSize: modelMeta?.parameterSize || modelMeta?.details?.parameter_size || '',
    sizeBytes: modelMeta?.sizeBytes || modelMeta?.size || 0,
    sizeGB: modelMeta?.sizeGB || null
  });

  const effectiveTier = cleanPref === 'auto' ? detected.tier : cleanPref;
  const spec = LLM_CONTEXT_TIERS[effectiveTier] || LLM_CONTEXT_TIERS.medium;

  return {
    mode: cleanPref === 'auto' ? 'auto' : 'manual',
    preference: cleanPref,
    tier: spec.id,
    spec,
    budgets: spec.budgets,
    detected
  };
}
