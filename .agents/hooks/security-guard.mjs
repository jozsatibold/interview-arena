import fs from 'node:fs';

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

const input = readStdinJson();
const cmd = String(input?.toolCall?.args?.CommandLine || '');

// Block npm usage in favor of pnpm
if (/(?:^|[;&|\s])npm\s+(?:install|i|ci|run|start|test|audit)\b/.test(cmd)) {
  process.stdout.write(JSON.stringify({
    decision: 'deny',
    reason: 'This project uses pnpm instead of npm. Use `pnpm run ...` or `pnpm start`.'
  }));
  process.exit(0);
}

// Block destructive deletion of local SQLite database or runtime state
if (/\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+.*(?:data\/?|arena\.db)/i.test(cmd)) {
  process.stdout.write(JSON.stringify({
    decision: 'deny',
    reason: 'Blocked destructive deletion of local SQLite database (`data/arena.db`).'
  }));
  process.exit(0);
}

// Auto-allow safe local verification commands cleanly
if (/^pnpm(?:\s+--dir\s+[^\s]+)?\s+(?:run\s+(?:check|lint|verify)|test)\s*$/.test(cmd.trim())) {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

process.stdout.write(JSON.stringify({ decision: 'ask' }));
