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
  saveState,
  ensureCustomInterviews,
  saveCustomInterviews,
  activateCvVersion,
  deleteCvVersion,
  getStudentMemorySync,
  saveStudentMemorySync,
  resetStudentMemorySync
} from './server/db.mjs';
import { pickRecommendedPlannerModels, pickVisionModels } from './server/ollama.mjs';
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

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(res, status, data) {
  if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  if (!res.writableEnded) res.end(JSON.stringify(data));
}

async function streamNdjsonTask(res, runner) {
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.flushHeaders?.();
  const writeEvent = (obj) => {
    if (!res.writableEnded) res.write(JSON.stringify(obj) + '\n');
  };
  try {
    const result = await runner((ev) => writeEvent({ type: 'progress', ...ev }));
    writeEvent({ type: 'done', ...result });
  } catch (err) {
    writeEvent({ type: 'error', error: err.message });
  }
  if (!res.writableEnded) res.end();
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
  if (patch.selectedModel) state.selectedModel = patch.selectedModel;
  if (['auto', 'small', 'medium', 'large'].includes(patch.modelContextTier)) state.modelContextTier = patch.modelContextTier;
  if (patch.plannerModel !== undefined) state.plannerModel = patch.plannerModel;
  if (patch.visionModel !== undefined) state.visionModel = patch.visionModel;
  if (patch.preferredVoice !== undefined) state.preferredVoice = patch.preferredVoice;
  if (patch.ttsEngine) state.ttsEngine = patch.ttsEngine;
  if (patch.zonosVoice) state.zonosVoice = patch.zonosVoice;
  if (patch.defaultAutoSpeak !== undefined) state.defaultAutoSpeak = Boolean(patch.defaultAutoSpeak);
  if (patch.defaultContinuousFlow !== undefined) state.defaultContinuousFlow = Boolean(patch.defaultContinuousFlow);

  if (patch.usePowerUp && state.powerUps[patch.usePowerUp] > 0) {
    state.powerUps[patch.usePowerUp] -= 1;
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
    }
  }
  return null;
}

async function serveStaticAsset(pathname, res) {
  const isShared = pathname.startsWith('/shared/');
  const baseDir = isShared ? SHARED_DIR : APP_DIR;
  const relPath = isShared ? pathname.replace(/^\/shared/, '') : pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(baseDir, `.${relPath}`);
  if (!resolved.startsWith(baseDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (!existsSync(resolved)) {
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
      spawn(status.ollamaPath, ['serve'], { detached: true, stdio: 'ignore' }).unref();
      await new Promise((r) => setTimeout(r, 1500));
      return sendJson(res, 200, { started: true, status: await getSetupStatus() });
    }

    if (pathname === '/api/ollama/pull' && method === 'POST') {
      const body = await readJsonBody(req);
      let model = String(body.model || '').trim();
      if (MODEL_ALIASES[model]) model = MODEL_ALIASES[model];
      if (!model || !/^[a-zA-Z0-9._:/-]+$/.test(model)) return sendJson(res, 400, { error: 'Invalid model name.' });

      const pullRes = await fetch(`${OLLAMA_BASE}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: true })
      });
      if (!pullRes.ok) return sendJson(res, pullRes.status, { error: (await pullRes.text()) || `Ollama pull failed (${pullRes.status})` });

      res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.flushHeaders();
      if (!pullRes.body) return res.end(JSON.stringify({ status: 'error', error: 'No pull stream from Ollama' }) + '\n');
      for await (const chunk of pullRes.body) res.write(chunk);
      return res.end();
    }

    if (pathname === '/api/zonos/start' && method === 'POST') return sendJson(res, 200, await triggerZonosSetupOrStart());
    if (pathname === '/api/zonos/logs' && method === 'GET') return sendJson(res, 200, await getZonosSetupLogsPayload());

    if (pathname === '/api/catalog' && method === 'GET') {
      const bundle = await buildCvResponseBundle();
      const cheatsheetMd = await fs.readFile(path.join(ROOT_DIR, 'cheatsheets', 'anti-freeze-phrases-and-star-stories.md'), 'utf8');
      return sendJson(res, 200, {
        needsOnboarding: bundle.needsOnboarding,
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
      if (method === 'GET') return sendJson(res, 200, await buildCvResponseBundle());
      if (method === 'DELETE') {
        const targetId = url.searchParams.get('id');
        if (!targetId) return sendJson(res, 400, { error: 'Missing id' });
        return sendJson(res, 200, await buildCvResponseBundle(await deleteCvVersion(targetId)));
      }
    }
    if (pathname === '/api/cv/activate' && method === 'POST') {
      const { id } = await readJsonBody(req);
      if (!id) return sendJson(res, 400, { error: 'Missing CV id' });
      return sendJson(res, 200, await buildCvResponseBundle(await activateCvVersion(id)));
    }
    if (pathname === '/api/cv/fake-jobs' && method === 'POST') {
      return sendJson(res, 200, await generateFakeJobForActiveCv(await readJsonBody(req)));
    }
    if (pathname === '/api/cv/upload-stream' && method === 'POST') {
      const body = await readJsonBody(req);
      return await streamNdjsonTask(res, (onProg) => analyzeCvAndBuildDailyPath(body, onProg));
    }

    if (pathname === '/api/state') {
      if (method === 'GET') return sendJson(res, 200, await ensureState());
      if (method === 'POST') {
        const state = await ensureState();
        const err = applyStatePatch(state, await readJsonBody(req));
        if (err) return sendJson(res, err.status, { error: err.error });
        await saveState(state);
        return sendJson(res, 200, state);
      }
    }

    if (pathname === '/api/chat' && method === 'POST') return sendJson(res, 200, await handleChat(await readJsonBody(req)));
    if (pathname === '/api/chat/stream' && method === 'POST') return await handleChatStream(await readJsonBody(req), res);

    if (pathname === '/api/warmup' && method === 'POST') {
      const { model = 'qwen3.5:9b' } = await readJsonBody(req);
      fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [], keep_alive: '15m' })
      }).catch(() => {});
      fetchZonosSpeakers(false).catch(() => {});
      return sendJson(res, 200, { warming: model });
    }

    if (pathname === '/api/tts' && method === 'POST') {
      const { text, voice = 'AmericanFemale', engine = 'auto', prosody = 'warm' } = await readJsonBody(req);
      if (!text) return sendJson(res, 400, { error: 'Missing text' });
      if (engine !== 'browser') {
        try {
          const speech = await synthesizeZonosSpeech({ text, voice, prosody });
          if (speech) {
            res.writeHead(200, { 'Content-Type': speech.contentType, 'X-TTS-Engine': 'zonos3-mini', 'X-TTS-Speaker': speech.speakerId });
            return res.end(speech.buffer);
          }
        } catch (err) {
          return sendJson(res, 502, { error: err.message });
        }
      }
      return sendJson(res, 503, { error: 'ZONOS3-Mini unavailable; use browser TTS fallback.' });
    }

    if (pathname === '/api/stt' && method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const audioBuf = Buffer.concat(chunks);
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
        const list = (await ensureCustomInterviews()).filter((c) => c.id !== targetId);
        await saveCustomInterviews(list);
        return sendJson(res, 200, { deleted: targetId, interviews: list });
      }
    }
    if (pathname === '/api/jd/extract-image' && method === 'POST') return sendJson(res, 200, await extractJdFromImage(await readJsonBody(req)));
    if (pathname === '/api/custom-interviews/generate' && method === 'POST') {
      const pack = await generateCustomInterviewPack(await readJsonBody(req));
      return sendJson(res, 200, { pack, interviews: await ensureCustomInterviews() });
    }
    if (pathname === '/api/custom-interviews/generate-stream' && method === 'POST') {
      const body = await readJsonBody(req);
      return await streamNdjsonTask(res, async (onProg) => {
        const pack = await generateCustomInterviewPack(body, onProg);
        return { pack, interviews: await ensureCustomInterviews() };
      });
    }

    await serveStaticAsset(pathname, res);
  } catch (err) {
    if (!res.headersSent) sendJson(res, 500, { error: err.message });
    else if (!res.writableEnded) res.end();
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
