/**
 * Invisible Server-Side Interview Script Session Store (SCRIPT-03)
 * Keeps the rolled scriptPlan strictly on the server behind an opaque `scriptSessionId` token
 * so the interview flow stays unpredictable and unmodifiable from the browser.
 */

import crypto from 'node:crypto';
import {
  resolveScriptComplexity,
  generateInterviewScript,
  advanceScriptState
} from '../shared/interview-script-engine.mjs';

export const MAX_SCRIPT_SESSIONS = 256;
export const SCRIPT_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const activeSessions = new Map();

function pruneSessions(now = Date.now()) {
  for (const [id, entry] of activeSessions.entries()) {
    if (!entry || now - entry.updatedAt > SCRIPT_SESSION_TTL_MS) {
      activeSessions.delete(id);
    }
  }
  while (activeSessions.size > MAX_SCRIPT_SESSIONS) {
    const oldestId = activeSessions.keys().next().value;
    if (!oldestId) break;
    activeSessions.delete(oldestId);
  }
}

function storeEntry(id, plan) {
  const now = Date.now();
  if (activeSessions.has(id)) activeSessions.delete(id);
  activeSessions.set(id, { plan, updatedAt: now });
  pruneSessions(now);
}

/**
 * Resolve an existing server-side script session or roll a fresh cohesive plan on call start.
 * If an unknown token arrives mid-call (e.g. after server restart), reconstruct a compatible
 * plan and fast-forward its cursor to match `userTurns` / `elapsedSeconds` smoothly.
 */
export function resolveOrCreateScriptSession({
  scriptSessionId = null,
  action = 'turn',
  topic = 'HR',
  archKey = 'general',
  targetDurationSeconds = 720,
  tierInfo = null,
  hasScreenShare = false,
  userTurns = 0,
  elapsedSeconds = null
} = {}) {
  const cleanId = typeof scriptSessionId === 'string' && scriptSessionId.trim() ? scriptSessionId.trim() : null;
  const complexity = resolveScriptComplexity(tierInfo);

  if (action !== 'start' && cleanId && activeSessions.has(cleanId)) {
    const existing = activeSessions.get(cleanId);
    if (existing && Date.now() - existing.updatedAt <= SCRIPT_SESSION_TTL_MS) {
      existing.updatedAt = Date.now();
      return { scriptSessionId: cleanId, plan: existing.plan, recovered: false };
    }
    activeSessions.delete(cleanId);
  }

  let plan = generateInterviewScript({
    topic,
    archKey,
    targetDurationSeconds,
    complexity,
    hasScreenShare
  });

  // Mid-call recovery (server restarted mid-call) — fast-forward safely without repeating greeting/intro
  if (action !== 'start' && userTurns > 0) {
    const steps = Math.min(Number(userTurns) || 1, Math.max(1, plan.beatIds.length - 1));
    for (let t = 1; t <= steps; t++) {
      plan = advanceScriptState(plan, {
        action: 'turn',
        userTurns: t,
        lastUserText: 'recovered mid-call context with sufficient length',
        elapsedSeconds: t === steps ? elapsedSeconds : null,
        targetDurationSeconds,
        archKey
      });
    }
  }

  const nextId = `ss_${crypto.randomUUID()}`;
  storeEntry(nextId, plan);
  return { scriptSessionId: nextId, plan, recovered: action !== 'start' };
}

export function updateScriptSessionPlan(scriptSessionId, updatedPlan) {
  if (!scriptSessionId || !updatedPlan) return;
  storeEntry(scriptSessionId, updatedPlan);
}

export function recordScriptBeatSignal(scriptSessionId, beatDone) {
  if (!scriptSessionId || typeof beatDone !== 'boolean') return;
  const entry = activeSessions.get(scriptSessionId);
  if (!entry?.plan) return;
  entry.plan = { ...entry.plan, lastBeatDone: beatDone };
  entry.updatedAt = Date.now();
}

export function clearScriptSession(scriptSessionId) {
  if (!scriptSessionId) return;
  activeSessions.delete(scriptSessionId);
}

export function getScriptSessionCount() {
  pruneSessions();
  return activeSessions.size;
}
