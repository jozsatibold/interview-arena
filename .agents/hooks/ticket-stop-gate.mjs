import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

const input = readStdinJson();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Prevent infinite continuation loops or re-triggering on errors/cancel
if (input.continuationActive || input.terminationReason !== 'NO_TOOL_CALL') {
  process.stdout.write(JSON.stringify({ decision: 'stop' }));
  process.exit(0);
}

try {
  execFileSync('pnpm', ['--dir', projectRoot, 'run', 'verify'], {
    cwd: projectRoot,
    stdio: 'pipe',
    timeout: 20000
  });
  process.stdout.write(JSON.stringify({ decision: 'stop' }));
} catch (err) {
  const details = `${err.stdout?.toString() || ''}\n${err.stderr?.toString() || ''}`.trim().slice(0, 1200);
  process.stdout.write(JSON.stringify({
    decision: 'continue',
    reason: `Ticket Quality Gate failed (\`pnpm run verify\`). Fix all syntax, lint, or test errors before finishing:\n${details}`
  }));
}
