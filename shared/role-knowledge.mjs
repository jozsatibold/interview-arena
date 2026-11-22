/**
 * Universal Senior Role Knowledge Base Aggregator (32 Tech-Company Roles)
 * Injects battle-tested domain depth into AI interviewers, debrief scorecards, and Candidate Playbooks
 * with strict tier-aware budgets so Small/Medium/Large LLMs never suffer mid-rubric truncation.
 */

import { KB_EXECUTIVE } from './kb-executive.mjs';
import { KB_PRODUCT_GTM } from './kb-product-gtm.mjs';
import { KB_ENGINEERING_CORE } from './kb-engineering-core.mjs';
import { KB_ENGINEERING_INFRA } from './kb-engineering-infra.mjs';
import { KB_MOBILE_SYSTEMS } from './kb-mobile-systems.mjs';
import { KB_STARTUP_ENTERPRISE } from './kb-startup-enterprise.mjs';

export const ROLE_KNOWLEDGE_BASES = {
  ...KB_EXECUTIVE,
  ...KB_PRODUCT_GTM,
  ...KB_ENGINEERING_CORE,
  ...KB_ENGINEERING_INFRA,
  ...KB_MOBILE_SYSTEMS,
  ...KB_STARTUP_ENTERPRISE
};

export function getRoleKnowledgeBase(archKey = 'general') {
  const key = String(archKey || 'general').trim();
  return ROLE_KNOWLEDGE_BASES[key] || ROLE_KNOWLEDGE_BASES.general;
}

function clipText(str, max) {
  const clean = String(str || '').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Format dense, tier-budgeted senior domain knowledge for the AI interviewer system prompt.
 * - small (1B-8B): <= 620 chars (round rubric + #1 model + 2 clipped probes + #1 red flag)
 * - medium (9B-35B): <= 1850 chars (mandate + rubric + 3 models + 3 probes + 3 red flags)
 * - large (36B+): full untruncated mandate, all mental models, probe ladders & red flags
 */
export function formatKnowledgeForInterviewer({ archKey = 'general', topic = 'Technical', tier = 'medium', compact = false } = {}) {
  const kb = getRoleKnowledgeBase(archKey);
  const effTier = compact ? 'small' : tier;
  const roundFocus = kb.roundRubrics?.[topic] || kb.roundRubrics?.Technical || kb.mandate;

  if (effTier === 'small') {
    const probes = (kb.probeLadders || [])
      .slice(0, 2)
      .map((p) => `- If "${clipText(p.claim, 48)}" -> ${clipText(p.probe, 110)}`)
      .join('\n');
    const flag = kb.redFlags?.[0] ? `Red Flag: ${clipText(kb.redFlags[0], 105)}` : '';
    return [
      `RUBRIC (${topic}): ${clipText(roundFocus, 170)}`,
      `KEY MODEL: ${clipText(kb.mentalModels?.[0] || '', 130)}`,
      `PROBES:\n${probes}`,
      flag
    ].filter(Boolean).join('\n');
  }

  if (effTier === 'medium') {
    const models = (kb.mentalModels || []).slice(0, 3).map((m) => `- ${clipText(m, 175)}`).join('\n');
    const probes = (kb.probeLadders || []).slice(0, 3).map((p) => `- If "${clipText(p.claim, 58)}": ${clipText(p.probe, 145)}`).join('\n');
    const flags = (kb.redFlags || []).slice(0, 3).map((f) => `- ${clipText(f, 115)}`).join('\n');
    return [
      `SENIOR BAR: ${clipText(kb.mandate, 190)}`,
      `ROUND FOCUS (${topic}): ${clipText(roundFocus, 210)}`,
      `FRAMEWORKS:\n${models}`,
      `PROBING FOLLOW-UP LADDER:\n${probes}`,
      `ANTI-PATTERNS / RED FLAGS:\n${flags}`
    ].join('\n\n');
  }

  const models = (kb.mentalModels || []).map((m) => `- ${m}`).join('\n');
  const probes = (kb.probeLadders || []).map((p) => `- If candidate says "${p.claim}": ${p.probe}`).join('\n');
  const flags = (kb.redFlags || []).map((f) => `- ${f}`).join('\n');

  return [
    `SENIOR HIRING BAR: ${kb.mandate}`,
    `THIS ROUND FOCUS (${topic}): ${roundFocus}`,
    `DOMAIN FRAMEWORKS & BENCHMARKS TO TEST:\n${models}`,
    `PROBING FOLLOW-UP LADDER (Do NOT accept buzzwords—push one layer deeper):\n${probes}`,
    `ANTI-PATTERNS / RED FLAGS TO CATCH:\n${flags}`
  ].join('\n\n');
}

/**
 * Format role-specific Top 5% evaluation bar for final Scorecard grading (/api/chat finish).
 * When compact=true (Small 1B-8B tier), trims cleanly to avoid 4096 num_ctx overflow;
 * Medium/Large tiers keep full untruncated depth.
 */
export function formatKnowledgeForDebrief({ archKey = 'general', topic = 'Technical', compact = false } = {}) {
  const kb = getRoleKnowledgeBase(archKey);
  const roundFocus = kb.roundRubrics?.[topic] || kb.roundRubrics?.Technical || kb.mandate;
  if (compact) {
    const flags = (kb.redFlags || []).slice(0, 2).map((f) => clipText(f, 110)).join(' | ');
    return `=== SENIOR RUBRIC (${String(archKey).toUpperCase()} · ${topic}) ===
Top 5% Bar: ${clipText(kb.mandate, 170)}
Round Criteria: ${clipText(roundFocus, 180)}
Red Flags (penalize if seen): ${flags}`;
  }
  const models = (kb.mentalModels || []).slice(0, 3).join(' | ');
  const flags = (kb.redFlags || []).slice(0, 3).join(' | ');
  const phrases = (kb.powerPhrases || []).slice(0, 2).join(' | ');

  return `=== SENIOR ROLE GRADING RUBRIC (${String(archKey).toUpperCase()} · ${topic}) ===
Top 5% Bar: ${kb.mandate}
Round Evaluation Criteria: ${roundFocus}
Expected Senior Mental Models: ${models}
Automatic Penalty Red Flags (drop score if seen): ${flags}
Reference Executive/Senior Phrasing Style: ${phrases}`;
}
