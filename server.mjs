import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PERSONALITIES_BY_TOPIC,
  PERSONALITY_DIMENSIONS,
  FIXED_TUTOR_PERSONALITY,
  FIXED_LOGIC_PERSONALITY
} from './personalities.mjs';
import { ROLE_ARCHETYPES } from './shared/role-archetypes.mjs';
import { LOGIC_DIFFICULTIES, LOGIC_CATEGORIES } from './logic-puzzles.mjs';
import {
  ROOT_DIR,
  PORT,
  OLLAMA_BASE,
  ZONOS_BASE,
  WHISPER_BASE,
  APP_DIR,
  SHARED_DIR,
  MODEL_ALIASES,
  POWERUP_CATALOG,
  TUTOR_CATALOG,
  MIME_TYPES
} from './server/config.mjs';
import {
  ensureState,
  mutateStateSync,
  ensureCustomInterviews,
  deleteCustomInterviewSync,
  activateCvVersion,
  deleteCvVersion,
  getStudentMemorySync,
  saveStudentMemorySync,
  resetStudentMemorySync
} from './server/db.mjs';
import { pickRecommendedPlannerModels, pickVisionModels, resolveModelAlias } from './server/ollama.mjs';
import {
  getSetupStatus,
  startZonosIfBuilt,
  triggerZonosSetupOrStart,
  getZonosSetupLogsPayload,
  fetchZonosSpeakers,
  synthesizeZonosSpeech,
  startWhisperIfPresent,
  transcribeAudioBuffer
} from './server/media-daemons.mjs';
import {
  buildCvResponseBundle,
  analyzeCvAndBuildDailyPath,
  generateFakeJobForActiveCv,
  extractJdFromImage,
  generateCustomInterviewPack
} from './server/document-service.mjs';
import {
  handleChat,
  handleChatStream,
  listPublicLogicPuzzles,
  generateLogicPuzzleWithAi,
  getLogicPuzzleHint
} from './server/chat-service.mjs';

async function readBodyBuffer(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error('Payload too large');
      err.statusCode = 413;
      req.destroy();
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req, maxBytes = 1024 * 1024) {
  const buf = await readBodyBuffer(req, maxBytes);
  if (buf.length === 0) return {};
  const ctype = String(req.headers['content-type'] || '').toLowerCase();
  if (ctype && !ctype.includes('application/json')) {
    const err = new Error('Content-Type must be application/json');
    err.statusCode = 415;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(buf.toString('utf8'));
  } catch {
    const err = new Error('Invalid JSON request body');
    err.statusCode = 400;
    throw err;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const err = new Error('Request body must be a JSON object');
    err.statusCode = 400;
    throw err;
  }
  return parsed;
}

function sendJson(res, status, data) {
  if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  if (!res.writableEnded) res.end(JSON.stringify(data));
}

function isAllowedOrigin(req) {
  const host = String(req.headers.host || '').toLowerCase();
  const validHosts = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);
  if (host && !validHosts.has(host)) return false;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const secSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
    if (secSite === 'cross-site') return false;
    const origin = req.headers.origin;
    if (origin && origin !== `http://localhost:${PORT}` && origin !== `http://127.0.0.1:${PORT}`) {
      return false;
    }
  }
  return true;
}

async function streamNdjsonTask(req, res, runner) {
  const ac = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) ac.abort();
  });
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.flushHeaders?.();
  const writeEvent = (obj) => {
    if (!res.writableEnded && !res.destroyed) res.write(JSON.stringify(obj) + '\n');
  };
  try {
    const result = await runner((ev) => writeEvent({ type: 'progress', ...ev }), ac.signal);
    if (!ac.signal.aborted) writeEvent({ type: 'done', ...result });
  } catch (err) {
    if (!ac.signal.aborted) writeEvent({ type: 'error', error: err.message });
  }
  if (!res.writableEnded && !res.destroyed) res.end();
}

function cleanMdInline(s) {
  return String(s || '').replaceAll('**', '').replaceAll('`', '').replace(/^\*"?/, '').replace(/"?\*$/, '').replace(/^"|"$/g, '').trim();
}

function parseCheatsheet(md) {
  const upgrades = [];
  const phrases = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (m) upgrades.push({ basic: cleanMdInline(m[1]), senior: cleanMdInline(m[2]), noteHu: cleanMdInline(m[3]) });
    const p = line.match(/^\d+\.\s+\*"?(.+?)"?\*$/);
    if (p) phrases.push(cleanMdInline(p[1]));
  }
  return { upgrades, phrases };
}

function applyStatePatch(state, patch) {
  if (typeof patch.selectedModel === 'string' && patch.selectedModel.trim()) state.selectedModel = patch.selectedModel.trim().slice(0, 120);
  if (['auto', 'small', 'medium', 'large'].includes(patch.modelContextTier)) state.modelContextTier = patch.modelContextTier;
  if (typeof patch.plannerModel === 'string') state.plannerModel = patch.plannerModel.trim().slice(0, 120);
  if (typeof patch.visionModel === 'string') state.visionModel = patch.visionModel.trim().slice(0, 120);
  if (typeof patch.preferredVoice === 'string') state.preferredVoice = patch.preferredVoice.trim().slice(0, 120);
  if (['auto', 'zonos', 'browser'].includes(patch.ttsEngine)) state.ttsEngine = patch.ttsEngine;
  if (typeof patch.zonosVoice === 'string' && patch.zonosVoice.trim()) state.zonosVoice = patch.zonosVoice.trim().slice(0, 120);
  if (patch.defaultAutoSpeak !== undefined) state.defaultAutoSpeak = Boolean(patch.defaultAutoSpeak);
  if (patch.defaultContinuousFlow !== undefined) state.defaultContinuousFlow = Boolean(patch.defaultContinuousFlow);
  if (['standard', 'detailed'].includes(patch.avatarQuality)) state.avatarQuality = patch.avatarQuality;
  if (patch.defaultExamMode !== undefined) state.defaultExamMode = Boolean(patch.defaultExamMode);
  if (patch.showCaptions !== undefined) state.showCaptions = Boolean(patch.showCaptions);
  if (patch.callAmbientAudio !== undefined) state.callAmbientAudio = Boolean(patch.callAmbientAudio);
  if (['manual', 'ptt', 'handsfree'].includes(patch.micMode)) state.micMode = patch.micMode;
  if (['spotlight', 'split'].includes(patch.defaultLayout)) state.defaultLayout = patch.defaultLayout;
  if ([8, 12, 15, 25, 30, 45].includes(Number(patch.defaultDurationMinutes))) state.defaultDurationMinutes = Number(patch.defaultDurationMinutes);
  if (typeof patch.targetRoleTrack === 'string') {
    const cleanTrack = patch.targetRoleTrack.trim();
    if (cleanTrack === 'auto' || Object.hasOwn(ROLE_ARCHETYPES, cleanTrack)) {
      state.targetRoleTrack = cleanTrack;
    }
  }

  if (patch.usePowerUp) {
    const key = String(patch.usePowerUp);
    if (!Object.hasOwn(state.powerUps, key)) return { status: 400, error: `Unknown Power-Up: ${key}` };
    if ((state.powerUps[key] || 0) <= 0) return { status: 400, error: `No ${key} charges remaining.` };
    state.powerUps[key] -= 1;
    state.xp += 10;
  }
  if (patch.buyPowerUp) {
    const item = POWERUP_CATALOG.find((p) => p.id === patch.buyPowerUp);
    if (!item) return { status: 400, error: `Unknown Power-Up: ${patch.buyPowerUp}` };
    const currency = patch.currency === 'gems' ? 'gems' : 'xp';
    const cost = currency === 'gems' ? item.gemCost : item.xpCost;
    if (currency === 'xp') {
      if (state.xp < cost) return { status: 400, error: `Not enough XP (${state.xp}/${cost}) to buy ${item.name}.` };
      state.xp -= cost;
    } else {
      if (state.gems < cost) return { status: 400, error: `Not enough Gems (${state.gems}/${cost}) to buy ${item.name}.` };
      state.gems -= cost;
    }
    if (item.id === 'streakFreeze') state.streakFreezes = Number(state.streakFreezes || 0) + 1;
    else state.powerUps[item.id] = Number(state.powerUps[item.id] || 0) + 1;
  }
  if (patch.masterMistakeId) {
    const m = state.mistakes.find((item) => item.id === patch.masterMistakeId);
    if (m && !m.mastered) {
      m.mastered = true;
      state.xp += 25;
      state.gems += 10;
      return { masteredMistakeId: m.id };
    }
  }
  return null;
}

async function serveStaticAsset(pathname, res) {
  const isShared = pathname.startsWith('/shared/');
  const baseDir = isShared ? SHARED_DIR : APP_DIR;
  const relPath = isShared ? pathname.replace(/^\/shared/, '') : pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(baseDir, `.${relPath}`);
  const basePrefix = baseDir.endsWith(path.sep) ? baseDir : `${baseDir}${path.sep}`;
  if (resolved !== baseDir && !resolved.startsWith(basePrefix)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  const st = await fs.stat(resolved).catch(() => null);
  if (!st || !st.isFile()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const content = await fs.readFile(resolved);
  const ext = path.extname(resolved);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  if (!isAllowedOrigin(req)) {
    return sendJson(res, 403, { error: 'Forbidden host or cross-site origin' });
  }
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const { pathname } = url;
  const method = req.method;

  try {
    if (pathname === '/api/setup-status' && method === 'GET') {
      return sendJson(res, 200, await getSetupStatus());
    }

    if (pathname === '/api/ollama/start' && method === 'POST') {
      const status = await getSetupStatus();
      if (status.ollamaRunning) return sendJson(res, 200, { started: true, alreadyRunning: true });
      if (!status.ollamaPath) return sendJson(res, 400, { error: 'Ollama CLI is not installed yet.' });
      const child = spawn(status.ollamaPath, ['serve'], { detached: true, stdio: 'ignore' });
      child.on('error', () => {});
      child.unref();
      await new Promise((r) => setTimeout(r, 1500));
      return sendJson(res, 200, { started: true, status: await getSetupStatus() });
    }

    if (pathname === '/api/ollama/pull' && method === 'POST') {
      const body = await readJsonBody(req);
      let model = resolveModelAlias(String(body.model || '').trim());
      if (!model || !/^[a-zA-Z0-9._:/-]+$/.test(model)) return sendJson(res, 400, { error: 'Invalid model name.' });

      const ac = new AbortController();
      res.on('close', () => { if (!res.writableFinished) ac.abort(); });
      const pullRes = await fetch(`${OLLAMA_BASE}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: true }),
        signal: ac.signal
      });
      if (!pullRes.ok) return sendJson(res, pullRes.status, { error: (await pullRes.text()) || `Ollama pull failed (${pullRes.status})` });

      res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.flushHeaders();
      if (!pullRes.body) return res.end(JSON.stringify({ status: 'error', error: 'No pull stream from Ollama' }) + '\n');
      for await (const chunk of pullRes.body) {
        if (ac.signal.aborted || res.writableEnded || res.destroyed) break;
        res.write(chunk);
      }
      return !res.writableEnded && !res.destroyed && res.end();
    }

    if (pathname === '/api/zonos/start' && method === 'POST') return sendJson(res, 200, await triggerZonosSetupOrStart());
    if (pathname === '/api/zonos/logs' && method === 'GET') return sendJson(res, 200, await getZonosSetupLogsPayload());

    if (pathname === '/api/catalog' && method === 'GET') {
      const userState = await ensureState();
      const bundle = await buildCvResponseBundle(null, userState.targetRoleTrack || 'auto');
      const cheatsheetPath = path.join(ROOT_DIR, 'cheatsheets', 'anti-freeze-phrases-and-star-stories.md');
      const cheatsheetMd = existsSync(cheatsheetPath) ? await fs.readFile(cheatsheetPath, 'utf8').catch(() => '') : '';
      return sendJson(res, 200, {
        needsOnboarding: bundle.needsOnboarding,
        activeRoleTrack: bundle.activeRoleTrack,
        effectiveArchKey: bundle.effectiveArchKey,
        agents: bundle.agents,
        personalitiesByTopic: PERSONALITIES_BY_TOPIC,
        personalityDimensions: PERSONALITY_DIMENSIONS,
        fixedPersonas: {
          tutor: FIXED_TUTOR_PERSONALITY,
          logic: FIXED_LOGIC_PERSONALITY
        },
        jobDescriptions: bundle.jobDescriptions,
        morningPath: bundle.morningPath,
        activeCv: bundle.activeCv,
        cvVersions: bundle.versions,
        cheatsheet: parseCheatsheet(cheatsheetMd),
        powerUpCatalog: POWERUP_CATALOG,
        tutorCatalog: TUTOR_CATALOG,
        logicCatalog: { difficulties: LOGIC_DIFFICULTIES, categories: LOGIC_CATEGORIES, puzzles: listPublicLogicPuzzles(false) },
        studentMemory: getStudentMemorySync()
      });
    }

    if (pathname === '/api/practice/logic/generate' && method === 'POST') {
      const body = await readJsonBody(req);
      const state = await ensureState();
      const puzzle = await generateLogicPuzzleWithAi({
        model: body.model || state.plannerModel || state.selectedModel || 'qwen3.5:9b',
        difficulty: body.difficulty || '10min',
        category: body.category || 'Any',
        guestMode: Boolean(body.guestMode)
      });
      return sendJson(res, 200, { puzzle, puzzles: listPublicLogicPuzzles(Boolean(body.guestMode)) });
    }

    if (pathname === '/api/practice/logic/hint' && method === 'POST') {
      const body = await readJsonBody(req);
      return sendJson(res, 200, getLogicPuzzleHint(body.logicPuzzleId, body.step));
    }

    if (pathname === '/api/tutor/memory') {
      if (method === 'GET') return sendJson(res, 200, getStudentMemorySync());
      if (method === 'DELETE') return sendJson(res, 200, resetStudentMemorySync());
      if (method === 'POST') {
        const body = await readJsonBody(req);
        const mem = getStudentMemorySync();
        if (body.addHobby) {
          const h = String(body.addHobby).trim();
          if (h) mem.hobbies = [...new Set([...mem.hobbies, h])].slice(0, 14);
        }
        if (body.removeHobby) mem.hobbies = mem.hobbies.filter((x) => x !== body.removeHobby);
        if (body.removeFact) mem.facts = mem.facts.filter((x) => x !== body.removeFact);
        if (body.cognitiveMap && typeof body.cognitiveMap === 'object') mem.cognitiveMap = { ...mem.cognitiveMap, ...body.cognitiveMap };
        return sendJson(res, 200, saveStudentMemorySync(mem));
      }
    }

    if (pathname === '/api/cv') {
      const userState = await ensureState();
      const track = userState.targetRoleTrack || 'auto';
      if (method === 'GET') return sendJson(res, 200, await buildCvResponseBundle(null, track));
      if (method === 'DELETE') {
        const targetId = url.searchParams.get('id');
        if (!targetId) return sendJson(res, 400, { error: 'Missing id' });
        return sendJson(res, 200, await buildCvResponseBundle(await deleteCvVersion(targetId), track));
      }
    }
    if (pathname === '/api/cv/activate' && method === 'POST') {
      const { id } = await readJsonBody(req);
      if (!id) return sendJson(res, 400, { error: 'Missing CV id' });
      const userState = await ensureState();
      return sendJson(res, 200, await buildCvResponseBundle(await activateCvVersion(id), userState.targetRoleTrack || 'auto'));
    }
    if (pathname === '/api/cv/fake-jobs' && method === 'POST') {
      const body = await readJsonBody(req);
      const userState = await ensureState();
      return sendJson(res, 200, await generateFakeJobForActiveCv({ ...body, targetRoleTrack: body.targetRoleTrack || userState.targetRoleTrack || 'auto' }));
    }
    if (pathname === '/api/cv/upload-stream' && method === 'POST') {
      const body = await readJsonBody(req, 15 * 1024 * 1024);
      return await streamNdjsonTask(req, res, (onProg, signal) => analyzeCvAndBuildDailyPath(body, onProg, signal));
    }

    if (pathname === '/api/state') {
      if (method === 'GET') return sendJson(res, 200, await ensureState());
      if (method === 'POST') {
        const patch = await readJsonBody(req);
        const result = mutateStateSync((state) => {
          const out = applyStatePatch(state, patch);
          if (out?.status) return { abort: out };
          return out || {};
        });
        if (result?.abort) return sendJson(res, result.abort.status, { error: result.abort.error });
        return sendJson(res, 200, result.state);
      }
    }

    if (pathname === '/api/chat' && method === 'POST') return sendJson(res, 200, await handleChat(await readJsonBody(req, 2 * 1024 * 1024)));
    if (pathname === '/api/chat/stream' && method === 'POST') return await handleChatStream(await readJsonBody(req, 2 * 1024 * 1024), req, res);

    if (pathname === '/api/warmup' && method === 'POST') {
      const { model = 'qwen3.5:9b' } = await readJsonBody(req);
      const resolvedModel = resolveModelAlias(model);
      fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: resolvedModel, messages: [], keep_alive: '15m' })
      }).catch(() => {});
      fetchZonosSpeakers(false).catch(() => {});
      return sendJson(res, 200, { warming: resolvedModel });
    }

    if (pathname === '/api/tts' && method === 'POST') {
      const { text, voice = 'AmericanFemale', engine = 'auto', prosody = 'warm' } = await readJsonBody(req);
      if (!text) return sendJson(res, 400, { error: 'Missing text' });
      if (engine !== 'browser') {
        try {
          const speech = await synthesizeZonosSpeech({ text, voice, prosody });
          if (speech) {
            const safeSpeaker = String(speech.speakerId || '').replace(/[^\x20-\x7E]/g, '').slice(0, 64) || 'default';
            res.writeHead(200, { 'Content-Type': speech.contentType, 'X-TTS-Engine': 'zonos3-mini', 'X-TTS-Speaker': safeSpeaker });
            return res.end(speech.buffer);
          }
        } catch (err) {
          return sendJson(res, 502, { error: err.message });
        }
      }
      return sendJson(res, 503, { error: 'ZONOS3-Mini unavailable; use browser TTS fallback.' });
    }

    if (pathname === '/api/stt' && method === 'POST') {
      const audioBuf = await readBodyBuffer(req, 25 * 1024 * 1024);
      if (audioBuf.length < 200) return sendJson(res, 400, { error: 'Empty audio payload' });
      try {
        return sendJson(res, 200, await transcribeAudioBuffer(audioBuf, req.headers['content-type']));
      } catch (err) {
        return sendJson(res, err.statusCode || 502, { error: err.message });
      }
    }

    if (pathname === '/api/custom-interviews') {
      if (method === 'GET') {
        const [interviews, st] = await Promise.all([ensureCustomInterviews(), getSetupStatus()]);
        return sendJson(res, 200, {
          interviews,
          plannerModels: pickRecommendedPlannerModels(st.installedModels || []),
          visionModels: pickVisionModels(st.installedModels || [])
        });
      }
      if (method === 'DELETE') {
        const targetId = url.searchParams.get('id');
        if (!targetId) return sendJson(res, 400, { error: 'Missing id' });
        deleteCustomInterviewSync(targetId);
        return sendJson(res, 200, { deleted: targetId, interviews: await ensureCustomInterviews() });
      }
    }
    if (pathname === '/api/jd/extract-image' && method === 'POST') return sendJson(res, 200, await extractJdFromImage(await readJsonBody(req, 15 * 1024 * 1024)));
    if (pathname === '/api/custom-interviews/generate' && method === 'POST') {
      const pack = await generateCustomInterviewPack(await readJsonBody(req, 2 * 1024 * 1024));
      return sendJson(res, 200, { pack, interviews: await ensureCustomInterviews() });
    }
    if (pathname === '/api/custom-interviews/generate-stream' && method === 'POST') {
      const body = await readJsonBody(req, 2 * 1024 * 1024);
      return await streamNdjsonTask(req, res, async (onProg, signal) => {
        const pack = await generateCustomInterviewPack(body, onProg, signal);
        return { pack, interviews: await ensureCustomInterviews() };
      });
    }

    if (pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: `Unknown API route or unsupported method (${method} ${pathname})` });
    }

    await serveStaticAsset(pathname, res);
  } catch (err) {
    const code = err?.statusCode || 500;
    if (!res.headersSent) sendJson(res, code, { error: err.message });
    else if (!res.writableEnded && !res.destroyed) res.end();
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🦉 Interview Coach Arena running at: http://localhost:${PORT}\n`);
    startZonosIfBuilt().then((ok) => ok && console.log(`🎙️ ZONOS3-Mini Natural Voice ready at: ${ZONOS_BASE}`)).catch(() => {});
    startWhisperIfPresent().then((ok) => ok && console.log(`👂 Whisper Large-v3-Turbo STT ready at: ${WHISPER_BASE}`)).catch(() => {});
  });
}

export { server, getSetupStatus, ensureState };
