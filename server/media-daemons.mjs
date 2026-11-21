import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ROOT_DIR,
  ZONOS_BASE,
  WHISPER_BASE,
  WHISPER_MODEL,
  WHISPER_TECH_PROMPT,
  RECOMMENDED_MODELS,
  ZONOS_PRESET_VOICES
} from './config.mjs';
import { getDb, getActiveCv } from './db.mjs';
import { getOllamaTagInventory, pickRecommendedPlannerModels, pickVisionModels } from './ollama.mjs';
import { normalizeInterviewTranscript } from '../shared/transcript.mjs';
import { detectModelParamBillions, LLM_CONTEXT_TIERS } from '../shared/model-tiers.mjs';

const execFileAsync = promisify(execFile);

let zonosSetupChild = null;
let zonosSetupLogs = [];
let zonosSetupStatus = 'idle'; // idle | running | done | error
let zonosSpeakersCache = { fetchedAt: 0, speakers: [] };
let whisperServerChild = null;

function pushZonosLog(line) {
  const clean = String(line || '').trimEnd();
  if (!clean) return;
  zonosSetupLogs.push(clean);
  if (zonosSetupLogs.length > 120) zonosSetupLogs.shift();
}

export async function commandExists(cmd) {
  try {
    const { stdout } = await execFileAsync('which', [cmd]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function fetchZonosSpeakers(force = false) {
  if (!force && Date.now() - zonosSpeakersCache.fetchedAt < 300000 && zonosSpeakersCache.speakers.length > 0) {
    return zonosSpeakersCache.speakers;
  }
  try {
    const res = await fetch(`${ZONOS_BASE}/v2/speakers`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data.speakers) ? data.speakers : [];
    zonosSpeakersCache = { fetchedAt: Date.now(), speakers: list };
    return list;
  } catch {
    return [];
  }
}

export async function resolveZonosSpeakerId(preferredVoice = 'AmericanFemale') {
  const speakers = await fetchZonosSpeakers();
  if (!speakers.length) return preferredVoice;

  const exactId = speakers.find((s) => s.id === preferredVoice);
  if (exactId) return exactId.id;

  const preset = ZONOS_PRESET_VOICES.find((p) => p.key === preferredVoice);
  const candidates = preset ? preset.matchers : [preferredVoice];
  for (const term of candidates) {
    const lower = term.toLowerCase();
    const hit = speakers.find(
      (s) => String(s.label || '').toLowerCase() === lower || String(s.label || '').toLowerCase().includes(lower)
    );
    if (hit) return hit.id;
  }
  const wantMale = /male/i.test(preferredVoice) && !/female/i.test(preferredVoice);
  const byGender = speakers.find((s) =>
    wantMale ? /\bmale\b|_\bm\b| m 1$/i.test(`${s.label} ${s.original_name}`) : /female|_f_| f 1$/i.test(`${s.label} ${s.original_name}`)
  );
  return byGender?.id || speakers[0].id;
}

export function getZonosLaunchPaths() {
  const zonosDir = path.join(ROOT_DIR, 'zonos3');
  const bin = path.join(zonosDir, 'servers', 'ggml', 'build', 'zonos3-server');
  const ggufDir = path.join(zonosDir, 'gguf');
  return {
    zonosDir,
    bin,
    backbone: path.join(ggufDir, 'backbone-ptq.gguf'),
    decoder: path.join(ggufDir, 'zac-keep2.gguf'),
    spkEncoder: path.join(ggufDir, 'spk-encoder.gguf'),
    voicesDir: path.join(zonosDir, 'assets', 'default_voices')
  };
}

export async function isZonosAlive() {
  try {
    const res = await fetch(`${ZONOS_BASE}/v2/health`, { signal: AbortSignal.timeout(900) });
    return res.ok;
  } catch {
    try {
      const res = await fetch(`${ZONOS_BASE}/`, { signal: AbortSignal.timeout(900) });
      return res.status < 500;
    } catch {
      return false;
    }
  }
}

export async function startZonosIfBuilt() {
  if (await isZonosAlive()) return true;
  const { bin, backbone, decoder, spkEncoder, voicesDir } = getZonosLaunchPaths();
  if (!existsSync(bin) || !existsSync(backbone) || !existsSync(decoder)) return false;
  if (zonosSetupChild && zonosSetupStatus === 'running') return false;

  const args = [backbone, '--zac', decoder, '--gpu', '--host', '127.0.0.1', '--port', '1919'];
  if (existsSync(spkEncoder)) args.push('--spk-encoder', spkEncoder);
  if (existsSync(voicesDir)) args.push('--tts-default-voices-dir', voicesDir);

  zonosSetupLogs = ['Launching local ZONOS3-Mini Metal TTS server on :1919...'];
  zonosSetupStatus = 'running';
  const child = spawn(bin, args, {
    cwd: path.join(ROOT_DIR, 'zonos3', 'servers', 'ggml'),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  zonosSetupChild = child;
  child.stdout?.on('data', (d) => d.toString().split('\n').forEach(pushZonosLog));
  child.stderr?.on('data', (d) => d.toString().split('\n').forEach(pushZonosLog));
  child.on('exit', (code) => {
    pushZonosLog(`ZONOS3 server exited with code ${code}`);
    zonosSetupStatus = code === 0 ? 'done' : 'error';
    zonosSetupChild = null;
  });
  child.unref();

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 400));
    if (await isZonosAlive()) {
      zonosSetupStatus = 'done';
      pushZonosLog('ZONOS3-Mini ready on http://127.0.0.1:1919');
      return true;
    }
  }
  return false;
}

export async function triggerZonosSetupOrStart() {
  if (await isZonosAlive()) {
    return { running: true, status: 'done', logs: ['ZONOS3-Mini already running on :1919'] };
  }
  const { bin, backbone, decoder } = getZonosLaunchPaths();
  if (existsSync(bin) && existsSync(backbone) && existsSync(decoder)) {
    const ready = await startZonosIfBuilt();
    return { running: ready, status: ready ? 'done' : zonosSetupStatus, logs: zonosSetupLogs };
  }
  if (!zonosSetupChild || zonosSetupStatus !== 'running') {
    zonosSetupLogs = ['Starting ZONOS3-Mini setup & server...'];
    zonosSetupStatus = 'running';
    const scriptPath = path.join(ROOT_DIR, 'setup-zonos3.sh');
    const child = spawn('bash', [scriptPath], {
      cwd: ROOT_DIR,
      env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` }
    });
    zonosSetupChild = child;
    child.stdout.on('data', (d) => d.toString().split('\n').forEach(pushZonosLog));
    child.stderr.on('data', (d) => d.toString().split('\n').forEach(pushZonosLog));
    child.on('exit', (code) => {
      pushZonosLog(`Process exited with code ${code}`);
      zonosSetupStatus = code === 0 ? 'done' : 'error';
      zonosSetupChild = null;
    });
  }
  return { started: true, status: zonosSetupStatus, logs: zonosSetupLogs };
}

export async function getZonosSetupLogsPayload() {
  const st = await getSetupStatus();
  return {
    running: st.zonosRunning,
    status: st.zonosRunning ? 'done' : zonosSetupStatus,
    logs: zonosSetupLogs
  };
}

export async function synthesizeZonosSpeech({ text, voice = 'AmericanFemale', prosody = 'warm' }) {
  const prosodyConditions = {
    warm: { speaking_rate: 14.0, fmax: 17600, loudness: -19.2 },
    brisk: { speaking_rate: 15.2, fmax: 16800, loudness: -19.6 },
    calm: { speaking_rate: 12.9, fmax: 15200, loudness: -21.0 },
    neutral: { speaking_rate: 14.2, fmax: 17000, loudness: -19.8 }
  }[prosody] || { speaking_rate: 14.0, fmax: 17600, loudness: -19.2 };

  const alive = (await isZonosAlive()) || (await startZonosIfBuilt());
  if (!alive) return null;

  const speakerId = await resolveZonosSpeakerId(voice);
  const zonosRes = await fetch(`${ZONOS_BASE}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'zonos3',
      input: text,
      voice: speakerId,
      response_format: 'wav',
      condition_values: prosodyConditions
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!zonosRes.ok) {
    const errTxt = await zonosRes.text().catch(() => '');
    throw new Error(`ZONOS3 TTS error (${zonosRes.status}): ${errTxt}`);
  }
  return {
    buffer: Buffer.from(await zonosRes.arrayBuffer()),
    contentType: zonosRes.headers.get('content-type') || 'audio/wav',
    speakerId: String(speakerId)
  };
}

export async function isWhisperAlive() {
  try {
    const res = await fetch(`${WHISPER_BASE}/`, { signal: AbortSignal.timeout(800) });
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function startWhisperIfPresent() {
  if (await isWhisperAlive()) return true;
  if (whisperServerChild) return false;
  const bin =
    (await commandExists('whisper-server')) ||
    (existsSync('/opt/homebrew/bin/whisper-server') ? '/opt/homebrew/bin/whisper-server' : null);
  if (!bin || !existsSync(WHISPER_MODEL)) return false;

  const args = [
    '-m', WHISPER_MODEL,
    '-l', 'en',
    '--host', '127.0.0.1',
    '--port', '1818',
    '--convert',
    '--prompt', WHISPER_TECH_PROMPT,
    '--carry-initial-prompt'
  ];
  const child = spawn(bin, args, { detached: true, stdio: 'ignore' });
  whisperServerChild = child;
  child.on('exit', () => { whisperServerChild = null; });
  child.unref();

  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 400));
    if (await isWhisperAlive()) return true;
  }
  return false;
}

export async function transcribeAudioBuffer(audioBuf, contentTypeHeader = 'audio/webm') {
  const alive = (await isWhisperAlive()) || (await startWhisperIfPresent());
  if (!alive) {
    const err = new Error('Local Whisper STT server not running on :1818');
    err.statusCode = 503;
    throw err;
  }
  const activeCv = await getActiveCv().catch(() => null);
  const stackPrompt = (activeCv?.profile?.coreStack || []).join(', ');
  const dynamicPrompt = stackPrompt ? `${WHISPER_TECH_PROMPT} Candidate stack: ${stackPrompt}.` : WHISPER_TECH_PROMPT;

  const mimeType = String(contentTypeHeader || 'audio/webm').split(';')[0].trim();
  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('file', new Blob([audioBuf], { type: mimeType }), `speech.${ext}`);
  form.append('temperature', '0.0');
  form.append('response_format', 'json');
  form.append('language', 'en');
  form.append('prompt', dynamicPrompt);

  const wRes = await fetch(`${WHISPER_BASE}/inference`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(45000)
  });
  if (!wRes.ok) {
    const err = new Error(`Whisper error (${wRes.status}): ${await wRes.text()}`);
    err.statusCode = 502;
    throw err;
  }
  const wData = await wRes.json();
  const rawText = String(wData.text || '').trim();
  return { text: normalizeInterviewTranscript(rawText), rawText, engine: 'whisper-large-v3-turbo' };
}

export async function getSetupStatus() {
  const [ollamaBin, whisperBin, parakeetBin, sayBin, ollamaTagInfo] = await Promise.all([
    commandExists('ollama').then((b) => b || (existsSync('/opt/homebrew/bin/ollama') ? '/opt/homebrew/bin/ollama' : existsSync('/usr/local/bin/ollama') ? '/usr/local/bin/ollama' : null)),
    commandExists('whisper-cli').then((b) => b || (existsSync('/opt/homebrew/bin/whisper-cli') ? '/opt/homebrew/bin/whisper-cli' : null)),
    commandExists('parakeet-cli').then((b) => b || (existsSync('/opt/homebrew/bin/parakeet-cli') ? '/opt/homebrew/bin/parakeet-cli' : null)),
    commandExists('say'),
    getOllamaTagInventory()
  ]);

  const [zonosRunning, whisperServerRunning] = await Promise.all([isZonosAlive(), isWhisperAlive()]);
  const { bin, backbone } = getZonosLaunchPaths();
  const zonosBuilt = existsSync(bin) && existsSync(backbone);
  const whisperModelReady = existsSync(WHISPER_MODEL);
  const targetsCount = getDb().prepare('SELECT COUNT(*) AS cnt FROM target_interviews').get()?.cnt || 0;

  return {
    ollamaInstalled: Boolean(ollamaBin),
    ollamaPath: ollamaBin,
    ollamaRunning: ollamaTagInfo.ollamaRunning,
    ollamaError: ollamaTagInfo.ollamaError,
    ollamaDownloadUrl: 'https://ollama.com/download',
    installedModels: ollamaTagInfo.installedModels,
    recommendedModels: RECOMMENDED_MODELS.map((r) => {
      const detected = detectModelParamBillions({ name: r.id, sizeGB: parseFloat(r.sizeHint) || null });
      return {
        ...r,
        detectedTier: detected.tier,
        detectedParamB: detected.paramB,
        detectionSource: detected.source
      };
    }),
    contextTiers: LLM_CONTEXT_TIERS,
    plannerModels: pickRecommendedPlannerModels(ollamaTagInfo.installedModels),
    visionModels: pickVisionModels(ollamaTagInfo.installedModels),
    zonosRunning,
    zonosBuilt,
    zonosUrl: ZONOS_BASE,
    zonosHfUrl: 'https://huggingface.co/Zyphra/ZONOS3-Mini',
    zonosPresets: ZONOS_PRESET_VOICES,
    whisperServerRunning,
    whisperModelReady,
    storage: {
      engine: 'node:sqlite (SQLite WAL)',
      dbFile: 'data/arena.db',
      targetsCount
    },
    voiceTools: {
      macosSay: Boolean(sayBin),
      whisperCli: Boolean(whisperBin),
      parakeetCli: Boolean(parakeetBin),
      browserSpeechNote: whisperServerRunning
        ? 'Whisper Large-v3-Turbo (:1818) active for accurate tech STT; ZONOS3-Mini (:1919) active for natural TTS.'
        : 'Web Speech API provides browser STT fallback; ZONOS3-Mini provides natural 44.1kHz neural TTS on :1919.'
    }
  };
}
