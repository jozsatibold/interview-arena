import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  detectRoleArchetype,
  normalizeAgentOverrides,
  getAdaptedAgents,
  normalizeGeneratedJds,
  formatFakeJdAsMarkdown,
  getActiveJobDescriptions,
  normalizeCvDailyPath,
  buildCvAnalysisPrompt,
  buildFakeJobPrompt
} from '../role-adapter.mjs';
import {
  ROOT_DIR,
  DATA_DIR,
  AGENT_META,
  MORNING_PATH,
  COMPACT_CANDIDATE_PROFILE
} from './config.mjs';
import {
  ensureCvVersions,
  getActiveCv,
  insertAndActivateCvSync,
  updateCvGeneratedJdsSync,
  upsertCustomInterviewSync
} from './db.mjs';
import {
  fetchOllamaChat,
  consumeNdjsonBody,
  stripThinkBlocks,
  parseJsonObjectStrict,
  pickRecommendedPlannerModels,
  pickVisionModels,
  estimateModelDurationSec,
  summarizeMdPrompt
} from './ollama.mjs';
import { getSetupStatus } from './media-daemons.mjs';

const execFileAsync = promisify(execFile);

function createProgressEmitter(startedAt, chosenModelGetter, onProgress) {
  return (ev) => {
    if (typeof onProgress !== 'function') return;
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    const pct = Math.max(1, Math.min(100, Number(ev.percent ?? 10)));
    const baseSec = estimateModelDurationSec(chosenModelGetter());
    let etaSeconds = ev.etaSeconds;
    if (etaSeconds == null) {
      if (pct >= 96) etaSeconds = 1;
      else if (pct > 24 && elapsedSeconds >= 3) {
        etaSeconds = Math.max(2, Math.min(180, Math.round((elapsedSeconds * (100 - pct)) / Math.max(pct - 12, 8))));
      } else {
        etaSeconds = Math.max(3, Math.round(baseSec - elapsedSeconds));
      }
    }
    onProgress({ ...ev, elapsedSeconds, etaSeconds });
  };
}

async function resolveAnalyzerModel(explicitModel = '') {
  if (explicitModel) return explicitModel;
  const st = await getSetupStatus();
  return pickRecommendedPlannerModels(st.installedModels || [])[0]?.name || 'qwen3.5:9b';
}

export async function extractPdfWithMacOs(pdfPath) {
  const swiftCache = path.join(DATA_DIR, 'swift-cache');
  await fs.mkdir(swiftCache, { recursive: true });
  const { stdout } = await execFileAsync(
    '/usr/bin/swift',
    [
      '-e',
      'import Foundation; import PDFKit; let p = CommandLine.arguments[1]; if let d = PDFDocument(url: URL(fileURLWithPath: p)), let s = d.string { print(s) }',
      pdfPath
    ],
    {
      env: {
        ...process.env,
        CLANG_MODULE_CACHE_PATH: swiftCache,
        SWIFT_MODULE_CACHE_PATH: swiftCache
      },
      timeout: 25000,
      maxBuffer: 8 * 1024 * 1024
    }
  );
  return stdout.trim();
}

export async function extractTextFromImage({ imageBase64, visionModel, kind = 'jd' }) {
  const cleanB64 = String(imageBase64 || '').replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
  if (!cleanB64) throw new Error('Missing image data');

  let chosenModel = visionModel;
  if (!chosenModel) {
    const st = await getSetupStatus();
    chosenModel = pickVisionModels(st.installedModels || [])[0]?.name || 'qwen3-vl:8b';
  }

  const promptText =
    kind === 'cv'
      ? 'Extract ALL text verbatim from this CV / resume image cleanly in Markdown/plain text. Preserve name, contact/location, experience dates, companies, metrics, tech stack, and education.'
      : 'Extract ALL text verbatim from this job description screenshot cleanly in plain text/Markdown. Preserve company name, role title, stack/requirements, responsibilities, and compensation/location if visible. Return only the extracted job description text.';

  const res = await fetchOllamaChat(
    {
      model: chosenModel,
      keep_alive: '5m',
      stream: false,
      options: { temperature: 0.1 },
      messages: [{ role: 'user', content: promptText, images: [cleanB64] }]
    },
    90000
  );
  const data = await res.json();
  return {
    extractedText: stripThinkBlocks(data?.message?.content || '').trim(),
    modelUsed: chosenModel
  };
}

export async function extractJdFromImage(opts) {
  return extractTextFromImage({ ...opts, kind: 'jd' });
}

export async function extractDocumentText({ filename = 'cv.txt', base64Data = '', plainText = '', visionModel = '' }) {
  const cleanPaste = String(plainText || '').trim();
  if (cleanPaste.length >= 40 && !base64Data) return cleanPaste;

  const rawB64 = String(base64Data || '').replace(/^data:[^;]+;base64,/, '').trim();
  if (!rawB64) {
    if (cleanPaste.length >= 20) return cleanPaste;
    throw new Error('Please upload a CV file or paste at least 40 characters of CV text.');
  }

  const ext = path.extname(filename || 'cv.txt').toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    const res = await extractTextFromImage({ imageBase64: rawB64, visionModel, kind: 'cv' });
    return [cleanPaste, res.extractedText].filter(Boolean).join('\n\n');
  }
  if (!['.pdf', '.docx', '.doc', '.rtf', '.odt', '.html', '.htm'].includes(ext)) {
    const decoded = Buffer.from(rawB64, 'base64').toString('utf8').trim();
    const mergedText = [cleanPaste, decoded].filter(Boolean).join('\n\n').trim();
    if (mergedText.length < 40) {
      throw new Error(`Could not extract readable text from ${filename}. Try pasting CV text or uploading a text-based PDF/Markdown file.`);
    }
    return mergedText;
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'arena-cv-'));
  const tmpPath = path.join(tmpDir, `upload${ext}`);
  await fs.writeFile(tmpPath, Buffer.from(rawB64, 'base64'));
  try {
    let extracted = '';
    if (ext === '.pdf') {
      extracted = await extractPdfWithMacOs(tmpPath);
    } else {
      const { stdout } = await execFileAsync('/usr/bin/textutil', ['-convert', 'txt', '-stdout', tmpPath], {
        timeout: 20000,
        maxBuffer: 8 * 1024 * 1024
      });
      extracted = stdout.trim();
    }
    const merged = [cleanPaste, extracted].filter(Boolean).join('\n\n').trim();
    if (merged.length < 40) {
      throw new Error(`Could not extract readable text from ${filename}. Try pasting CV text or uploading a text-based PDF/Markdown file.`);
    }
    return merged;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function readStaticJds() {
  const jds = [];
  const jdDir = path.join(ROOT_DIR, 'job-descriptions');
  if (!existsSync(jdDir)) return jds;
  for (const file of (await fs.readdir(jdDir)).sort()) {
    if (!file.endsWith('.md')) continue;
    const content = await fs.readFile(path.join(jdDir, file), 'utf8').catch(() => '');
    const heading = content.split('\n')[0]?.replace(/^#\s*/, '') || file;
    jds.push({ id: file, title: heading, content });
  }
  return jds;
}

export async function resolveActiveJobDescriptions(activeCv) {
  if (!activeCv || activeCv.id === 'cv-baseline-1') {
    const staticJds = await readStaticJds();
    const customFake = Array.isArray(activeCv?.generatedJds) ? activeCv.generatedJds : [];
    return [...customFake.map((jd) => ({ ...jd, content: formatFakeJdAsMarkdown(jd) })), ...staticJds];
  }
  return getActiveJobDescriptions([], activeCv);
}

export async function buildCvResponseBundle(versions = null) {
  const list = versions || (await ensureCvVersions());
  const activeCv = list.find((v) => v.isActive) || list[0] || null;
  const needsOnboarding = list.length === 0 || !activeCv;
  return {
    needsOnboarding,
    activeCv,
    versions: list,
    morningPath: activeCv?.dailyPath?.length ? activeCv.dailyPath : MORNING_PATH,
    agents: getAdaptedAgents(AGENT_META, activeCv),
    jobDescriptions: await resolveActiveJobDescriptions(activeCv)
  };
}

export async function resolveTargetContext({ jdFile = 'jd-01-senior-frontend-fintech-bnpl.md', customInterviewId = null, customRoundId = null, day = null, companyName = '' }, maxChars = 1300) {
  if (customInterviewId) {
    const custom = (await ensureCustomInterviews()).find((c) => c.id === customInterviewId);
    if (custom) {
      const round = (custom.rounds || []).find((r) => r.id === customRoundId) || custom.rounds?.[0] || null;
      const mustKnow = (custom.studyPack?.mustKnowQuestions || [])
        .slice(0, 4)
        .map((q) => `- Q: ${q.question} (Target metric/angle: ${q.keyMetricToDrop || 'verified impact'})`)
        .join('\n');
      const roundBlock = round
        ? `CURRENT TARGET ROUND (${round.topic}): ${round.title}\nRound Focus: ${round.focus}\nTailored Guidance: ${round.tailoredPrompt}\nOpening Question: ${round.openerQuestion}`
        : '';
      return {
        jdPrompt: summarizeMdPrompt(
          `TARGET COMPANY: ${custom.company} — ${custom.roleTitle}\n${roundBlock}\nKey Stack: ${(custom.fitSummary?.keyStack || []).join(', ')}\nGap Areas to Probe: ${(custom.fitSummary?.gapStrategies || []).slice(0, 2).map((g) => g.gap || g).join('; ')}\nPrepared Q&A Focus:\n${mustKnow}\nOriginal JD:\n${summarizeMdPrompt(custom.jdText || '', 1100)}`,
          maxChars + 500
        ),
        openerHint: round?.openerQuestion || null
      };
    }
  }
  const activeCv = await getActiveCv();
  const dayStep = day ? (activeCv?.dailyPath || []).find((d) => Number(d.day) === Number(day)) : null;
  const dayFocusBlock = dayStep?.focus ? `\n\nCV-TAILORED DAY ${dayStep.day} FOCUS (${dayStep.title}):\n${dayStep.focus}` : '';

  const availableJds = await resolveActiveJobDescriptions(activeCv);
  const matchedJd = availableJds.find((j) => j.id === jdFile) || availableJds[0];
  let baseJdText = matchedJd?.content || '';
  if (!baseJdText) {
    const staticPath = path.join(ROOT_DIR, 'job-descriptions', path.basename(jdFile || 'jd-01-senior-frontend-fintech-bnpl.md'));
    if (existsSync(staticPath)) baseJdText = await fs.readFile(staticPath, 'utf8');
  }
  const cleanCompany = String(companyName || '').trim();
  if (cleanCompany) {
    baseJdText = baseJdText.replace(/^(#\s+[^\n]+?)\s+at\s+[^\n]+$/im, (_m, roleHeading) => `${roleHeading} at ${cleanCompany}`);
    const hasCompanyLine = /\*\*Company:\*\*/i.test(baseJdText);
    baseJdText = hasCompanyLine
      ? baseJdText.replace(/\*\*Company:\*\*[^\n]*/i, () => `**Company:** ${cleanCompany}`)
      : `**Company:** ${cleanCompany}\n${baseJdText}`;
  }
  return {
    jdPrompt: `${summarizeMdPrompt(baseJdText, maxChars)}${dayFocusBlock}`,
    openerHint: dayStep?.focus ? `Start Day ${dayStep.day} ("${dayStep.title}") naturally referencing their CV background and this focus: ${dayStep.focus}` : null
  };
}

export async function analyzeCvAndBuildDailyPath(
  { filename = 'updated-cv.md', base64Data = '', plainText = '', plannerModel = '', visionModel = '', notes = '', candidateName = '' },
  onProgress = null,
  externalSignal = null
) {
  let chosenModel = plannerModel;
  const emit = createProgressEmitter(Date.now(), () => chosenModel, onProgress);

  emit({
    stageKey: 'extract',
    percent: 8,
    message: `Extracting text & structure from ${filename || 'uploaded CV'}...`,
    detail: 'Parsing PDF / document text locally with zero cloud upload'
  });
  const rawText = await extractDocumentText({ filename, base64Data, plainText, visionModel });
  chosenModel = await resolveAnalyzerModel(chosenModel);

  emit({
    stageKey: 'profile',
    percent: 18,
    message: `Extracted ${rawText.length} characters · Warming up ${chosenModel}...`,
    detail: 'Identifying your role (QA / Java / .NET / PHP / Flutter / etc.), stack & career milestones'
  });

  const prompt = buildCvAnalysisPrompt({ rawText, notes, baseAgents: AGENT_META });
  const res = await fetchOllamaChat(
    {
      model: chosenModel,
      keep_alive: '5m',
      stream: true,
      format: 'json',
      options: { temperature: 0.35, num_predict: 5600 },
      messages: [{ role: 'user', content: prompt }]
    },
    240000,
    externalSignal
  );

  let rawAll = '';
  let lastStageKey = 'profile';
  let lastEmitAt = 0;

  if (res.body) {
    await consumeNdjsonBody(res.body, (obj) => {
      if (obj.message?.content) rawAll += obj.message.content;
      const now = Date.now();
      const clean = stripThinkBlocks(rawAll);
      const daysDetected = (clean.match(/"day"\s*:/g) || []).length;

      let stageKey = 'profile';
      let percent = Math.min(46, 22 + Math.floor(clean.length / 90));
      let message = `Analyzing CV profile, stack & fake jobs (${chosenModel})...`;

      if (clean.includes('"dailyPath"')) {
        stageKey = 'path';
        percent = Math.min(93, 52 + daysDetected * 2);
        message = daysDetected > 0
          ? `Generating role-tailored 20-Day Path (Day ${daysDetected} / 20)...`
          : 'Building role-tailored 20-Morning Interview Path...';
      } else if (clean.includes('"generatedJds"')) {
        stageKey = 'profile';
        percent = Math.min(52, 36 + Math.floor(clean.length / 180));
        message = 'Generating realistic Fake Job descriptions from CV...';
      }

      if (stageKey !== lastStageKey || now - lastEmitAt >= 260 || obj.done) {
        lastStageKey = stageKey;
        lastEmitAt = now;
        const dayPart = daysDetected > 0 ? ` · ${daysDetected}/20 days drafted` : '';
        emit({ stageKey, percent, message, detail: `${chosenModel} · ${clean.length} chars streamed${dayPart}` });
      }
    });
  }

  emit({
    stageKey: 'saving',
    percent: 96,
    message: 'Activating CV version, fake jobs & 20-Day Path in SQLite...',
    detail: `${rawAll.length} chars generated`
  });

  if (externalSignal?.aborted) throw new Error('CV analysis cancelled');
  const parsed = parseJsonObjectStrict(rawAll);
  if (!parsed || (!parsed.headline && !parsed.dailyPath && !parsed.generatedJds)) {
    throw new Error('Could not parse structured CV profile from the selected model. Please retry or pick a larger planner model.');
  }
  const existing = await ensureCvVersions();
  const maxOrder = existing.reduce((min, v) => Math.min(min, Number(v.sortOrder ?? 0)), 0);
  const nextNum = existing.length + 1;
  const fallbackName =
    String(candidateName || '').trim() ||
    String(rawText || '').split('\n').map((l) => l.trim()).find((l) => l.length >= 3 && l.length <= 48 && !/@|\d/.test(l)) ||
    'Candidate';
  const rawStack = Array.isArray(parsed.coreStack) && parsed.coreStack.length ? parsed.coreStack.map(String) : [];
  const archKey = detectRoleArchetype(rawText, { headline: parsed.headline, coreStack: rawStack });

  const profile = {
    candidateName: String(parsed.candidateName || fallbackName).trim(),
    headline: String(parsed.headline || 'Software Engineer').trim(),
    location: String(parsed.location || 'Remote (EU)').trim(),
    yearsExperience: String(parsed.yearsExperience || 'Mid / Senior').trim(),
    targetCompensation: String(parsed.targetCompensation || 'Competitive Market Rate').trim(),
    coreStack: rawStack,
    topAchievements: Array.isArray(parsed.topAchievements) ? parsed.topAchievements.map(String) : [],
    gapAreas: Array.isArray(parsed.gapAreas) ? parsed.gapAreas.map(String) : [],
    profilePrompt: String(parsed.profilePrompt || `Candidate: ${parsed.candidateName || fallbackName} (${parsed.headline || archKey}). CV Summary:\n${summarizeMdPrompt(rawText, 900)}`).trim()
  };

  insertAndActivateCvSync({
    id: `cv-${crypto.randomUUID()}`,
    sortOrder: maxOrder - 1,
    versionLabel: `v${nextNum} · ${filename || 'Updated CV'}`,
    filename: filename || 'updated-cv.txt',
    createdAt: new Date().toISOString().slice(0, 10),
    plannerModel: chosenModel,
    rawText,
    profile,
    dailyPath: normalizeCvDailyPath(parsed.dailyPath, MORNING_PATH, AGENT_META, archKey, profile),
    generatedJds: normalizeGeneratedJds(parsed.generatedJds, profile, rawText),
    agentOverrides: normalizeAgentOverrides(parsed.agentOverrides, archKey, profile, rawText)
  });

  const bundle = await buildCvResponseBundle();
  return { version: bundle.activeCv, ...bundle };
}

export async function generateFakeJobForActiveCv({ customFocus = '', plannerModel = '' } = {}) {
  const activeCv = await getActiveCv();
  if (!activeCv) throw new Error('No active CV found.');
  const chosenModel = await resolveAnalyzerModel(plannerModel);

  const prompt = buildFakeJobPrompt({ profile: activeCv.profile, rawText: activeCv.rawText, customFocus });
  const res = await fetchOllamaChat(
    {
      model: chosenModel,
      keep_alive: '5m',
      stream: false,
      format: 'json',
      options: { temperature: 0.55, num_predict: 1200 },
      messages: [{ role: 'user', content: prompt }]
    },
    120000
  );
  const data = await res.json();
  const parsed = parseJsonObjectStrict(data?.message?.content || '');
  if (!parsed || (!parsed.roleTitle && !parsed.company && !parsed.summary)) {
    throw new Error('Could not parse generated fake job JSON from model. Please try again.');
  }
  const normalized = normalizeGeneratedJds([parsed], activeCv.profile, activeCv.rawText)[0];
  const createdJd = {
    ...normalized,
    id: `fake-jd-${crypto.randomUUID()}`,
    title: `${normalized.roleTitle} — ${normalized.company}`
  };

  updateCvGeneratedJdsSync(activeCv.id, (current) => {
    const core = current.filter((j) => /^fake-jd-[123]$/.test(String(j?.id || '')));
    const extra = current.filter((j) => !/^fake-jd-[123]$/.test(String(j?.id || '')));
    return [createdJd, ...extra].slice(0, 6).concat(core).slice(0, 9);
  });
  return { createdJd, ...(await buildCvResponseBundle()) };
}

function normalizeGeneratedRounds(rawRounds, company, roleTitle) {
  const defaultRoster = [
    { topic: 'HR', agentId: '01-hr-recruiter-screening.md', title: 'Round 1: Recruiter & Culture Screen' },
    { topic: 'Technical', agentId: '03-technical-deep-dive-architecture.md', title: 'Round 2: Architecture & Core Stack Deep-Dive' },
    { topic: 'Live Coding', agentId: '04-live-coding-anti-freeze-trainer.md', title: 'Round 3: Verbal Problem Solving & System Drill' },
    { topic: 'Behavioral', agentId: '02-behavioral-leadership-star.md', title: 'Round 4: Leadership, Ownership & Product Impact' },
    { topic: 'Negotiation', agentId: '06b-negotiation-eu-b2b-contracts.md', title: 'Round 5: Rate, Scope & Offer Close' }
  ];
  const validIds = new Set(AGENT_META.map((a) => a.id));
  const input = Array.isArray(rawRounds) && rawRounds.length >= 3 ? rawRounds.slice(0, 6) : defaultRoster;

  return input.map((r, idx) => {
    const fallback = defaultRoster[idx % defaultRoster.length];
    const byTopic = AGENT_META.find((a) => a.topic.toLowerCase() === String(r.topic || '').toLowerCase());
    const agentId = validIds.has(r.agentId) ? r.agentId : (byTopic?.id || fallback.agentId);
    const meta = AGENT_META.find((a) => a.id === agentId);
    return {
      id: `round-${idx + 1}`,
      roundNumber: idx + 1,
      topic: meta?.topic || r.topic || fallback.topic,
      agentId,
      avatarName: meta?.avatarName || 'Interviewer',
      defaultVoice: meta?.defaultVoice || 'AmericanFemale',
      title: String(r.title || fallback.title).trim(),
      focus: String(r.focus || `Assess fit for ${roleTitle} at ${company}`).trim(),
      openerQuestion: String(r.openerQuestion || `Thanks for joining! What makes this ${roleTitle} role at ${company} a strong match for your experience?`).trim(),
      tailoredPrompt: String(r.tailoredPrompt || `Probe candidate's relevant metrics and concrete experience for ${roleTitle} at ${company}.`).trim()
    };
  });
}

export async function generateCustomInterviewPack(
  { company = '', roleTitle = '', jdText = '', plannerModel = '', notes = '' },
  onProgress = null,
  externalSignal = null
) {
  const cleanJd = String(jdText || '').trim();
  if (cleanJd.length < 30) throw new Error('Please paste a job description or upload a screenshot first.');

  const chosenModel = await resolveAnalyzerModel(plannerModel);
  const emit = createProgressEmitter(Date.now(), () => chosenModel, onProgress);

  emit({
    stageKey: 'fit',
    percent: 10,
    message: `Preparing profile & loading ${chosenModel}...`,
    detail: `Model: ${chosenModel} · Initializing local GPU inference`,
    chars: 0,
    roundsDetected: 0
  });

  const activeCv = await getActiveCv();
  const adaptedAgents = getAdaptedAgents(AGENT_META, activeCv);
  const candidateName = activeCv?.profile?.candidateName || 'the candidate';
  const agentDirectory = adaptedAgents.map((a) => `${a.id} (${a.topic}: ${a.title})`).join('\n');
  const fullProfile = await fs.readFile(path.join(ROOT_DIR, '00-candidate-profile-and-core-rules.md'), 'utf8').catch(() => COMPACT_CANDIDATE_PROFILE);
  const candidateContext = activeCv?.profile?.profilePrompt && activeCv.id !== 'cv-baseline-1'
    ? `${activeCv.profile.profilePrompt}\n\nFULL ACTIVE CV (${activeCv.filename}):\n${summarizeMdPrompt(activeCv.rawText, 2800)}`
    : summarizeMdPrompt(fullProfile, 3400);

  const prompt = `You are a Principal Engineering Career Strategist preparing ${candidateName} for a specific target job.
Analyze the Job Description against ${candidateName}'s verified profile and generate a COMPLETE, tailored Interview Series + Study Pack in English ONLY.

CANDIDATE VERIFIED PROFILE:
${candidateContext}

AVAILABLE INTERVIEWER AGENTS (choose matching agentId from this exact list):
${agentDirectory}

USER HINT / COMPANY: ${company || '(infer from JD)'}
USER HINT / ROLE: ${roleTitle || '(infer from JD)'}
EXTRA NOTES: ${notes || 'None'}

TARGET JOB DESCRIPTION:
${summarizeMdPrompt(cleanJd, 6000)}

Return ONE strict JSON object with EXACTLY this structure:
{
  "company": "Extracted or provided company name",
  "roleTitle": "Extracted or provided job title",
  "fitSummary": {
    "matchScore": 0-100,
    "headline": "1-sentence executive summary of positioning for this role",
    "keyStack": ["tech1", "tech2", "tech3", "tech4", "tech5"],
    "strongMatches": ["Verified metric/project from CV to spotlight 1", "Match 2", "Match 3"],
    "gapStrategies": [
      {"gap": "Skill/requirement in JD where candidate has lighter exposure", "reframe": "Exact C1 Senior English way to bridge & turn it into a strength"}
    ]
  },
  "studyPack": {
    "buzzwordsToUse": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
    "mustKnowQuestions": [
      {"question": "Specific interview question tailored to this company/JD", "seniorAnswer": "Concise 2-3 sentence C1 Senior English model answer using candidate's real metrics", "keyMetricToDrop": "e.g. latency cut / coverage / scale metric"}
    ],
    "questionsToAskThem": ["Smart Senior question 1 to ask this company", "Question 2", "Question 3"]
  },
  "rounds": [
    {
      "topic": "HR" | "Technical" | "Live Coding" | "Behavioral" | "System Design" | "Negotiation",
      "agentId": "Exact filename from AVAILABLE INTERVIEWER AGENTS",
      "title": "Short round title (e.g. Recruiter Screen — Fintech Fit)",
      "focus": "2-sentence interviewer objective tailored to this JD",
      "openerQuestion": "Natural first spoken interview question referencing this company/role",
      "tailoredPrompt": "Concrete follow-up topics & edge cases the live interviewer should probe"
    }
  ]
}
Include 4 to 5 rounds covering HR, Stack Technical, Coding/System problem solving, Leadership/Behavioral, and Offer Negotiation.`;

  const res = await fetchOllamaChat(
    {
      model: chosenModel,
      keep_alive: '5m',
      stream: true,
      format: 'json',
      options: { temperature: 0.35, num_predict: 3800 },
      messages: [{ role: 'user', content: prompt }]
    },
    240000,
    externalSignal
  );

  let rawAll = '';
  let lastStageKey = 'fit';
  let lastEmitAt = 0;

  if (res.body) {
    await consumeNdjsonBody(res.body, (obj) => {
      if (obj.message?.content) rawAll += obj.message.content;
      const now = Date.now();
      const clean = stripThinkBlocks(rawAll);
      const detectedCompany = clean.match(/"company"\s*:\s*"([^"]{2,60})"/)?.[1] || company || '';
      const roundsDetected = (clean.match(/"openerQuestion"\s*:/g) || []).length;
      const qaDetected = (clean.match(/"seniorAnswer"\s*:/g) || []).length;

      let stageKey = 'fit';
      let percent = Math.min(48, 22 + Math.floor(clean.length / 80));
      let message = detectedCompany
        ? `Analyzing ${detectedCompany} requirements & skill gaps...`
        : 'Analyzing Job Description requirements & skill fit...';

      if (clean.includes('"rounds"')) {
        stageKey = 'rounds';
        percent = Math.min(93, 72 + roundsDetected * 4);
        message = roundsDetected > 0 ? `Building custom interview round ${roundsDetected} / 5...` : 'Designing custom multi-round interview series...';
      } else if (clean.includes('"studyPack"') || clean.includes('"mustKnowQuestions"')) {
        stageKey = 'study';
        percent = Math.min(70, 50 + qaDetected * 6);
        message = qaDetected > 0 ? `Crafting tailored Senior Q&A #${qaDetected}...` : 'Generating company-specific study pack & Q&A...';
      }

      if (stageKey !== lastStageKey || now - lastEmitAt >= 260 || obj.done) {
        lastStageKey = stageKey;
        lastEmitAt = now;
        const compPart = detectedCompany ? ` · ${detectedCompany}` : '';
        const roundPart = roundsDetected > 0 ? ` · ${roundsDetected} rounds ready` : '';
        emit({ stageKey, percent, message, detail: `${chosenModel}${compPart} · ${clean.length} chars streamed${roundPart}` });
      }
    });
  }

  emit({
    stageKey: 'saving',
    percent: 96,
    message: 'Validating structured output & saving interview series...',
    detail: `${rawAll.length} chars received · Writing local pack`
  });

  if (externalSignal?.aborted) throw new Error('Custom interview generation cancelled');
  const parsed = parseJsonObjectStrict(rawAll);
  if (!parsed || (!parsed.company && !parsed.roleTitle && !parsed.fitSummary && !parsed.rounds)) {
    throw new Error('Could not parse structured interview pack from the selected model. Please retry.');
  }
  const finalCompany = String(company || parsed.company || 'Target Company').trim();
  const finalRole = String(roleTitle || parsed.roleTitle || 'Senior Engineer').trim();
  const rawScore = Number.parseFloat(parsed.fitSummary?.matchScore);
  const matchScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 85;
  const pack = {
    id: `ci-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString().slice(0, 10),
    plannerModel: chosenModel,
    company: finalCompany,
    roleTitle: finalRole,
    jdText: cleanJd,
    fitSummary: {
      matchScore,
      headline: parsed.fitSummary?.headline || `Strong senior match for ${finalRole} at ${finalCompany}.`,
      keyStack: Array.isArray(parsed.fitSummary?.keyStack) ? parsed.fitSummary.keyStack : [],
      strongMatches: Array.isArray(parsed.fitSummary?.strongMatches) ? parsed.fitSummary.strongMatches : [],
      gapStrategies: Array.isArray(parsed.fitSummary?.gapStrategies) ? parsed.fitSummary.gapStrategies : []
    },
    studyPack: {
      buzzwordsToUse: Array.isArray(parsed.studyPack?.buzzwordsToUse) ? parsed.studyPack.buzzwordsToUse : [],
      mustKnowQuestions: Array.isArray(parsed.studyPack?.mustKnowQuestions) ? parsed.studyPack.mustKnowQuestions : [],
      questionsToAskThem: Array.isArray(parsed.studyPack?.questionsToAskThem) ? parsed.studyPack.questionsToAskThem : []
    },
    rounds: normalizeGeneratedRounds(parsed.rounds, finalCompany, finalRole)
  };

  upsertCustomInterviewSync(pack);
  return pack;
}
