import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

const input = readStdinJson();
const targetPath = String(input?.toolCall?.args?.Path || '');

if (/\.(?:mjs|js)$/.test(targetPath) && fs.existsSync(targetPath)) {
  try {
    execFileSync(process.execPath, ['--no-warnings=ExperimentalWarning', '--check', targetPath], { stdio: 'pipe' });
  } catch (err) {
    process.stderr.write(`Syntax check failed for ${targetPath}: ${err.stderr?.toString() || err.message}\n`);
  }
}

process.stdout.write('{}');
