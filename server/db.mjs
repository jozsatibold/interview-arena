import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  DATA_DIR,
  DB_FILE,
  STATE_FILE,
  CUSTOM_INTERVIEWS_FILE,
  DEFAULT_STATE,
  DEFAULT_STUDENT_MEMORY
} from './config.mjs';

let dbInstance = null;

export function withTransaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const res = fn();
    db.exec('COMMIT');
    return res;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch {}
    throw err;
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      xp INTEGER NOT NULL DEFAULT 0,
      gems INTEGER NOT NULL DEFAULT 150,
      streak INTEGER NOT NULL DEFAULT 0,
      last_practice_date TEXT,
      streak_freezes INTEGER NOT NULL DEFAULT 2,
      selected_model TEXT NOT NULL DEFAULT 'lfm2.5:8b',
      planner_model TEXT NOT NULL DEFAULT '',
      vision_model TEXT NOT NULL DEFAULT '',
      preferred_voice TEXT NOT NULL DEFAULT '',
      tts_engine TEXT NOT NULL DEFAULT 'auto',
      zonos_voice TEXT NOT NULL DEFAULT 'AmericanFemale',
      default_auto_speak INTEGER NOT NULL DEFAULT 1,
      default_continuous_flow INTEGER NOT NULL DEFAULT 1,
      power_ups_json TEXT NOT NULL,
      completed_days_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      date TEXT NOT NULL,
      topic TEXT NOT NULL,
      agent_file TEXT,
      jd_file TEXT,
      day INTEGER,
      sub_scores_json TEXT NOT NULL,
      total_score REAL NOT NULL,
      percentile TEXT,
      verdict TEXT
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      category TEXT NOT NULL,
      original TEXT NOT NULL,
      better TEXT NOT NULL,
      reason_hu TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      mastered INTEGER NOT NULL DEFAULT 0,
      topic TEXT NOT NULL,
      last_seen TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS target_interviews (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      planner_model TEXT NOT NULL,
      company TEXT NOT NULL,
      role_title TEXT NOT NULL,
      jd_text TEXT NOT NULL,
      fit_summary_json TEXT NOT NULL,
      study_pack_json TEXT NOT NULL,
      rounds_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cv_versions (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      version_label TEXT NOT NULL,
      filename TEXT NOT NULL,
      created_at TEXT NOT NULL,
      planner_model TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      daily_path_json TEXT NOT NULL,
      generated_jds_json TEXT NOT NULL DEFAULT '[]',
      agent_overrides_json TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS student_memory (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hobbies_json TEXT NOT NULL DEFAULT '[]',
      facts_json TEXT NOT NULL DEFAULT '[]',
      topic_scores_json TEXT NOT NULL DEFAULT '[]',
      cognitive_map_json TEXT NOT NULL DEFAULT '{}',
      recent_angles_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS logic_puzzles (
      id TEXT PRIMARY KEY,
      difficulty TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      constraints_json TEXT NOT NULL DEFAULT '[]',
      scratchpad_template TEXT NOT NULL DEFAULT '',
      hints_json TEXT NOT NULL DEFAULT '[]',
      solution_guide TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_order ON sessions (sort_order ASC);
    CREATE INDEX IF NOT EXISTS idx_mistakes_order ON mistakes (sort_order ASC);
    CREATE INDEX IF NOT EXISTS idx_targets_order ON target_interviews (sort_order ASC);
    CREATE INDEX IF NOT EXISTS idx_cv_active ON cv_versions (is_active DESC, sort_order ASC);
  `);

  const cols = new Set(db.prepare('PRAGMA table_info(user_profile)').all().map((c) => c.name));
  if (!cols.has('planner_model')) db.exec("ALTER TABLE user_profile ADD COLUMN planner_model TEXT NOT NULL DEFAULT ''");
  if (!cols.has('vision_model')) db.exec("ALTER TABLE user_profile ADD COLUMN vision_model TEXT NOT NULL DEFAULT ''");
  if (!cols.has('default_auto_speak')) db.exec('ALTER TABLE user_profile ADD COLUMN default_auto_speak INTEGER NOT NULL DEFAULT 1');
  if (!cols.has('default_continuous_flow')) db.exec('ALTER TABLE user_profile ADD COLUMN default_continuous_flow INTEGER NOT NULL DEFAULT 1');

  const cvCols = new Set(db.prepare('PRAGMA table_info(cv_versions)').all().map((c) => c.name));
  if (!cvCols.has('generated_jds_json')) db.exec("ALTER TABLE cv_versions ADD COLUMN generated_jds_json TEXT NOT NULL DEFAULT '[]'");
  if (!cvCols.has('agent_overrides_json')) db.exec("ALTER TABLE cv_versions ADD COLUMN agent_overrides_json TEXT NOT NULL DEFAULT '{}'");

  const hasProfile = db.prepare('SELECT 1 FROM user_profile WHERE id = 1').get();
  if (!hasProfile) {
    let seedState = structuredClone(DEFAULT_STATE);
    if (existsSync(STATE_FILE)) {
      try {
        seedState = { ...seedState, ...JSON.parse(readFileSync(STATE_FILE, 'utf8')) };
      } catch {}
    }
    writeFullStateSync(db, seedState);
  }

  const targetCount = db.prepare('SELECT COUNT(*) AS cnt FROM target_interviews').get()?.cnt || 0;
  if (targetCount === 0 && existsSync(CUSTOM_INTERVIEWS_FILE)) {
    try {
      const legacy = JSON.parse(readFileSync(CUSTOM_INTERVIEWS_FILE, 'utf8'));
      if (Array.isArray(legacy) && legacy.length > 0) {
        writeCustomInterviewsSync(db, legacy);
      }
    } catch {}
  }

  dbInstance = db;
  return dbInstance;
}

export function writeFullStateSync(db, state) {
  withTransaction(db, () => {
    db.prepare(`
      INSERT INTO user_profile (
        id, xp, gems, streak, last_practice_date, streak_freezes,
        selected_model, planner_model, vision_model, preferred_voice, tts_engine, zonos_voice,
        default_auto_speak, default_continuous_flow, power_ups_json, completed_days_json
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        xp = excluded.xp,
        gems = excluded.gems,
        streak = excluded.streak,
        last_practice_date = excluded.last_practice_date,
        streak_freezes = excluded.streak_freezes,
        selected_model = excluded.selected_model,
        planner_model = excluded.planner_model,
        vision_model = excluded.vision_model,
        preferred_voice = excluded.preferred_voice,
        tts_engine = excluded.tts_engine,
        zonos_voice = excluded.zonos_voice,
        default_auto_speak = excluded.default_auto_speak,
        default_continuous_flow = excluded.default_continuous_flow,
        power_ups_json = excluded.power_ups_json,
        completed_days_json = excluded.completed_days_json
    `).run(
      Number(state.xp || 0),
      Number(state.gems ?? 150),
      Number(state.streak || 0),
      state.lastPracticeDate ?? null,
      Number(state.streakFreezes ?? 2),
      String(state.selectedModel || 'lfm2.5:8b'),
      String(state.plannerModel || ''),
      String(state.visionModel || ''),
      String(state.preferredVoice || ''),
      String(state.ttsEngine || 'auto'),
      String(state.zonosVoice || 'AmericanFemale'),
      state.defaultAutoSpeak === false ? 0 : 1,
      state.defaultContinuousFlow === false ? 0 : 1,
      JSON.stringify(state.powerUps || DEFAULT_STATE.powerUps),
      JSON.stringify(Array.isArray(state.completedDays) ? state.completedDays : [])
    );

    db.prepare('DELETE FROM sessions').run();
    const insSession = db.prepare(`
      INSERT INTO sessions (id, sort_order, date, topic, agent_file, jd_file, day, sub_scores_json, total_score, percentile, verdict)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (state.sessions || []).forEach((s, idx) => {
      insSession.run(
        String(s.id || `s-${idx}`),
        idx,
        String(s.date || ''),
        String(s.topic || ''),
        s.agentFile || null,
        s.jdFile || null,
        s.day != null ? Number(s.day) : null,
        JSON.stringify(s.subScores || {}),
        Number(s.totalScore || 0),
        s.percentile || null,
        s.verdict || null
      );
    });

    db.prepare('DELETE FROM mistakes').run();
    const insMistake = db.prepare(`
      INSERT INTO mistakes (id, sort_order, category, original, better, reason_hu, count, mastered, topic, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (state.mistakes || []).forEach((m, idx) => {
      insMistake.run(
        String(m.id || `m-${idx}`),
        idx,
        String(m.category || 'B2-to-Senior'),
        String(m.original || ''),
        String(m.better || ''),
        String(m.reasonHu || ''),
        Number(m.count || 1),
        m.mastered ? 1 : 0,
        String(m.topic || 'HR'),
        String(m.lastSeen || '')
      );
    });
  });
}

export function writeCustomInterviewsSync(db, list) {
  withTransaction(db, () => {
    db.prepare('DELETE FROM target_interviews').run();
    const ins = db.prepare(`
      INSERT INTO target_interviews (
        id, sort_order, created_at, planner_model, company, role_title, jd_text,
        fit_summary_json, study_pack_json, rounds_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (list || []).forEach((p, idx) => {
      ins.run(
        String(p.id),
        idx,
        String(p.createdAt || ''),
        String(p.plannerModel || ''),
        String(p.company || ''),
        String(p.roleTitle || ''),
        String(p.jdText || ''),
        JSON.stringify(p.fitSummary || {}),
        JSON.stringify(p.studyPack || {}),
        JSON.stringify(p.rounds || [])
      );
    });
  });
}

export async function ensureState() {
  const db = getDb();
  const row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  if (!row) return structuredClone(DEFAULT_STATE);

  const sessions = db
    .prepare('SELECT * FROM sessions ORDER BY sort_order ASC')
    .all()
    .map((r) => ({
      id: r.id,
      date: r.date,
      topic: r.topic,
      agentFile: r.agent_file,
      jdFile: r.jd_file,
      day: r.day,
      subScores: JSON.parse(r.sub_scores_json || '{}'),
      totalScore: r.total_score,
      percentile: r.percentile,
      verdict: r.verdict
    }));

  const mistakes = db
    .prepare('SELECT * FROM mistakes ORDER BY sort_order ASC')
    .all()
    .map((r) => ({
      id: r.id,
      category: r.category,
      original: r.original,
      better: r.better,
      reasonHu: r.reason_hu,
      count: r.count,
      mastered: Boolean(r.mastered),
      topic: r.topic,
      lastSeen: r.last_seen
    }));

  return {
    xp: row.xp,
    gems: row.gems,
    streak: row.streak,
    lastPracticeDate: row.last_practice_date,
    streakFreezes: row.streak_freezes,
    selectedModel: row.selected_model,
    plannerModel: row.planner_model || '',
    visionModel: row.vision_model || '',
    preferredVoice: row.preferred_voice,
    ttsEngine: row.tts_engine,
    zonosVoice: row.zonos_voice,
    defaultAutoSpeak: row.default_auto_speak !== 0,
    defaultContinuousFlow: row.default_continuous_flow !== 0,
    powerUps: { ...DEFAULT_STATE.powerUps, ...JSON.parse(row.power_ups_json || '{}') },
    completedDays: JSON.parse(row.completed_days_json || '[]'),
    sessions,
    mistakes
  };
}

export async function saveState(state) {
  writeFullStateSync(getDb(), state);
}

export async function ensureCustomInterviews() {
  const db = getDb();
  return db
    .prepare('SELECT * FROM target_interviews ORDER BY sort_order ASC')
    .all()
    .map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      plannerModel: r.planner_model,
      company: r.company,
      roleTitle: r.role_title,
      jdText: r.jd_text,
      fitSummary: JSON.parse(r.fit_summary_json || '{}'),
      studyPack: JSON.parse(r.study_pack_json || '{}'),
      rounds: JSON.parse(r.rounds_json || '[]')
    }));
}

export async function saveCustomInterviews(list) {
  writeCustomInterviewsSync(getDb(), list);
}

function mapCvRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    versionLabel: r.version_label,
    filename: r.filename,
    createdAt: r.created_at,
    plannerModel: r.planner_model,
    rawText: r.raw_text,
    profile: JSON.parse(r.profile_json || '{}'),
    dailyPath: JSON.parse(r.daily_path_json || '[]'),
    generatedJds: JSON.parse(r.generated_jds_json || '[]'),
    agentOverrides: JSON.parse(r.agent_overrides_json || '{}'),
    isActive: Boolean(r.is_active)
  };
}

export async function ensureCvVersions() {
  const db = getDb();
  return db.prepare('SELECT * FROM cv_versions ORDER BY is_active DESC, sort_order ASC').all().map(mapCvRow);
}

export async function getActiveCv() {
  const versions = await ensureCvVersions();
  return versions.find((v) => v.isActive) || versions[0] || null;
}

export function insertAndActivateCvSync(cv) {
  const db = getDb();
  withTransaction(db, () => {
    db.prepare('UPDATE cv_versions SET is_active = 0').run();
    db.prepare(`
      INSERT INTO cv_versions (
        id, sort_order, version_label, filename, created_at, planner_model,
        raw_text, profile_json, daily_path_json, generated_jds_json, agent_overrides_json, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      cv.id,
      cv.sortOrder,
      cv.versionLabel,
      cv.filename,
      cv.createdAt,
      cv.plannerModel,
      cv.rawText,
      JSON.stringify(cv.profile),
      JSON.stringify(cv.dailyPath),
      JSON.stringify(cv.generatedJds),
      JSON.stringify(cv.agentOverrides)
    );
  });
}

export function updateCvGeneratedJdsSync(cvId, generatedJds) {
  getDb()
    .prepare('UPDATE cv_versions SET generated_jds_json = ? WHERE id = ?')
    .run(JSON.stringify(generatedJds), cvId);
}

export async function activateCvVersion(id) {
  const db = getDb();
  withTransaction(db, () => {
    db.prepare('UPDATE cv_versions SET is_active = 0').run();
    db.prepare('UPDATE cv_versions SET is_active = 1 WHERE id = ?').run(id);
  });
  return ensureCvVersions();
}

export async function deleteCvVersion(id) {
  const db = getDb();
  withTransaction(db, () => {
    db.prepare('DELETE FROM cv_versions WHERE id = ?').run(id);
    const active = db.prepare('SELECT id FROM cv_versions WHERE is_active = 1').get();
    if (!active) {
      const first = db.prepare('SELECT id FROM cv_versions ORDER BY sort_order ASC LIMIT 1').get();
      if (first) db.prepare('UPDATE cv_versions SET is_active = 1 WHERE id = ?').run(first.id);
    }
  });
  return ensureCvVersions();
}

export function getStudentMemorySync() {
  const row = getDb().prepare('SELECT * FROM student_memory WHERE id = 1').get();
  if (!row) return structuredClone(DEFAULT_STUDENT_MEMORY);
  return {
    hobbies: JSON.parse(row.hobbies_json || '[]'),
    facts: JSON.parse(row.facts_json || '[]'),
    topicScores: JSON.parse(row.topic_scores_json || '[]'),
    cognitiveMap: { ...DEFAULT_STUDENT_MEMORY.cognitiveMap, ...JSON.parse(row.cognitive_map_json || '{}') },
    recentAngles: JSON.parse(row.recent_angles_json || '[]'),
    updatedAt: row.updated_at || ''
  };
}

export function saveStudentMemorySync(mem) {
  const clean = {
    hobbies: Array.isArray(mem.hobbies) ? [...new Set(mem.hobbies.map((s) => String(s).trim()).filter(Boolean))].slice(0, 14) : [],
    facts: Array.isArray(mem.facts) ? [...new Set(mem.facts.map((s) => String(s).trim()).filter(Boolean))].slice(0, 14) : [],
    topicScores: Array.isArray(mem.topicScores) ? mem.topicScores.slice(0, 16) : [],
    cognitiveMap: { ...DEFAULT_STUDENT_MEMORY.cognitiveMap, ...(mem.cognitiveMap || {}) },
    recentAngles: Array.isArray(mem.recentAngles) ? mem.recentAngles.slice(0, 8) : [],
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  };
  getDb()
    .prepare(`
      INSERT INTO student_memory (id, hobbies_json, facts_json, topic_scores_json, cognitive_map_json, recent_angles_json, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        hobbies_json = excluded.hobbies_json,
        facts_json = excluded.facts_json,
        topic_scores_json = excluded.topic_scores_json,
        cognitive_map_json = excluded.cognitive_map_json,
        recent_angles_json = excluded.recent_angles_json,
        updated_at = excluded.updated_at
    `)
    .run(
      JSON.stringify(clean.hobbies),
      JSON.stringify(clean.facts),
      JSON.stringify(clean.topicScores),
      JSON.stringify(clean.cognitiveMap),
      JSON.stringify(clean.recentAngles),
      clean.updatedAt
    );
  return clean;
}

export function resetStudentMemorySync() {
  getDb().prepare('DELETE FROM student_memory WHERE id = 1').run();
  return getStudentMemorySync();
}

export function getSavedLogicPuzzlesSync() {
  return getDb()
    .prepare('SELECT * FROM logic_puzzles ORDER BY created_at DESC')
    .all()
    .map((r) => ({
      id: r.id,
      difficulty: r.difficulty,
      durationMinutes: Number(r.duration_minutes || 10),
      category: r.category,
      title: r.title,
      prompt: r.prompt,
      constraints: JSON.parse(r.constraints_json || '[]'),
      scratchpadTemplate: r.scratchpad_template || '',
      hints: JSON.parse(r.hints_json || '[]'),
      solutionGuide: r.solution_guide || '',
      isCustom: true,
      createdAt: r.created_at
    }));
}

export function saveCustomLogicPuzzleSync(puzzle) {
  getDb()
    .prepare(`
      INSERT INTO logic_puzzles (id, difficulty, duration_minutes, category, title, prompt, constraints_json, scratchpad_template, hints_json, solution_guide, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      puzzle.id,
      puzzle.difficulty,
      Number(puzzle.durationMinutes || 10),
      puzzle.category,
      puzzle.title,
      puzzle.prompt,
      JSON.stringify(puzzle.constraints || []),
      puzzle.scratchpadTemplate || '',
      JSON.stringify(puzzle.hints || []),
      puzzle.solutionGuide || '',
      puzzle.createdAt || new Date().toISOString()
    );
  return puzzle;
}
