import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const JS_DIRS = ['.', 'server', 'shared', 'app', 'app/modules', 'scripts', 'tests'];
const IGNORE_DIRS = new Set(['data', 'zonos3', 'node_modules', '.git', '.agents']);

async function collectJsFiles() {
  const files = [];
  for (const relDir of JS_DIRS) {
    const absDir = path.join(ROOT, relDir);
    let entries = [];
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (ent.isDirectory() && IGNORE_DIRS.has(ent.name)) continue;
      if (ent.isFile() && /\.(mjs|js)$/.test(ent.name)) {
        files.push(path.join(absDir, ent.name));
      }
    }
  }
  return files.sort();
}

async function main() {
  const files = await collectJsFiles();
  const errors = [];
  const warnings = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);

    // 1. Node syntax validation
    try {
      await execFileAsync(process.execPath, ['--no-warnings=ExperimentalWarning', '--check', file]);
    } catch (err) {
      errors.push(`[SYNTAX] ${rel}: ${err.stderr || err.message}`);
      continue;
    }

    const src = await fs.readFile(file, 'utf8');
    const lines = src.split('\n');

    // 2. Enterprise modularity soft cap (exclude static data catalogs & lint/test scripts)
    const isDataCatalog = ['logic-puzzles.mjs', 'personalities.mjs', 'server/config.mjs'].includes(rel);
    if (!isDataCatalog && !rel.startsWith('scripts/') && !rel.startsWith('tests/') && lines.length > 850) {
      warnings.push(`[MODULARITY] ${rel} has ${lines.length} lines (>850); consider splitting into focused components.`);
    }

    // 3. Security anti-pattern checks (skip scripts/lint.mjs itself)
    if (rel !== 'scripts/lint.mjs') {
      if (/\beval\s*\(|new\s+Function\s*\(/.test(src)) {
        errors.push(`[SECURITY] ${rel}: Avoid eval() or new Function()`);
      }
      if (/from\s+['"]node:child_process['"]/.test(src) && /\bexec\s*\(/.test(src)) {
        errors.push(`[SECURITY] ${rel}: Use execFile/spawn with argument arrays instead of shell-interpolated exec()`);
      }
      if (/db\.(prepare|exec)\s*\(\s*`[^`]*\$\{/.test(src)) {
        errors.push(`[SECURITY] ${rel}: Possible SQL template interpolation; use parameterized '?' queries`);
      }
      if (/\bconsole\.log\b/.test(src) && rel.startsWith('app/')) {
        warnings.push(`[HYGIENE] ${rel}: Remove stray console.log in production client code`);
      }
    }

    // 4. Server-to-client secret leak check for logic puzzles
    if (rel === 'logic-puzzles.mjs' || rel === 'server/chat-service.mjs') {
      if (rel === 'logic-puzzles.mjs' && /sanitizeLogicPuzzleForClient[\s\S]*solutionGuide/.test(src)) {
        errors.push(`[SECURITY] ${rel}: solutionGuide must never appear in sanitizeLogicPuzzleForClient()`);
      }
    }

    // 5. Verify no un-escaped innerHTML sinks for untrusted user message text
    if (rel.startsWith('app/')) {
      const dangerousInline = src.match(/\.innerHTML\s*=\s*`\$\{(?!svgHtml|avatarHtml)[a-zA-Z0-9_.]+\}`/g);
      if (dangerousInline) {
        errors.push(`[SECURITY] ${rel}: Unescaped raw template expression assigned to innerHTML: ${dangerousInline.join(', ')}`);
      }
    }
  }

  // 6. Verify pnpm hygiene across docs & config
  for (const doc of ['README.md', 'package.json']) {
    const content = await fs.readFile(path.join(ROOT, doc), 'utf8').catch(() => '');
    if (/\bnpm\s+(run|start|test|install|audit)\b/.test(content)) {
      errors.push(`[TOOLING] ${doc}: Use pnpm instead of npm commands`);
    }
  }

  // 7. Verify Styles & Mobile-First CSS guardrails
  const css = await fs.readFile(path.join(ROOT, 'app/styles.css'), 'utf8').catch(() => '');
  if (!css.includes('prefers-reduced-motion')) {
    warnings.push('[A11Y] app/styles.css: Include prefers-reduced-motion media query for animated components');
  }

  for (const w of warnings) console.warn(`⚠️  ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`❌ ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✅ Lint passed across ${files.length} JS/MJS modules (${warnings.length} warnings).`);
}

main();
