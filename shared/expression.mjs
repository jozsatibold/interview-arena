// Shared facial expression presets & validator used cleanly by both server LLM output parsing
// and the Detailed Realistic 2.5D avatar renderer (zero duplication).

export const EXPRESSION_PRESETS = {
  warm: { smileBias: 0.22, browRaiseL: -1.5, browRaiseR: -1.5, browSlant: -1.5, eyeSquint: 0, blushBoost: 0.06, headTiltBias: 0 },
  curious: { smileBias: 0.08, browRaiseL: -5.2, browRaiseR: 0.8, browSlant: 0, eyeSquint: -0.09, blushBoost: 0.02, headTiltBias: 0.042 },
  amused: { smileBias: 0.45, browRaiseL: -3.2, browRaiseR: -3.2, browSlant: -2.4, eyeSquint: 0.14, blushBoost: 0.16, headTiltBias: 0.022 },
  skeptical: { smileBias: -0.26, browRaiseL: 3.8, browRaiseR: -3.6, browSlant: 2.8, eyeSquint: 0.17, blushBoost: 0, headTiltBias: -0.032 },
  firm: { smileBias: -0.18, browRaiseL: 3.6, browRaiseR: 3.6, browSlant: 4.2, eyeSquint: 0.07, blushBoost: 0, headTiltBias: 0 }
};

export function normalizeExpression(raw) {
  const key = String(raw || '').trim().toLowerCase();
  return Object.hasOwn(EXPRESSION_PRESETS, key) ? key : 'warm';
}

export function getExpressionTargets(expression = 'warm') {
  const key = String(expression || '').trim().toLowerCase();
  return Object.hasOwn(EXPRESSION_PRESETS, key) ? EXPRESSION_PRESETS[key] : EXPRESSION_PRESETS.warm;
}
