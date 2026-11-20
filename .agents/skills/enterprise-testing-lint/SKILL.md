---
name: enterprise-testing-lint
description: >-
  Maintains automated Node unit tests, security/modularity linting, and
  end-to-end verification gates using pnpm and built-in node:test. Use at the
  end of every ticket or when adding new tests and lint rules.
---

# Enterprise Testing & Verification Workflow

Every completed ticket must leave the codebase verified with zero syntax, lint, or test failures.

## 1. Run Full Verification Suite
From `interview-prep/`:
```bash
pnpm run verify
```
This executes sequentially:
1. `pnpm run check` (`node --check` on all `.mjs`/`.js` files across server, shared, app, scripts, and tests)
2. `pnpm run lint` (`scripts/lint.mjs`: syntax, module size cap, security pattern scan, `solutionGuide` leak guard, `pnpm` hygiene, reduced-motion CSS check)
3. `pnpm test` (`node --test tests/*.test.mjs`)

## 2. Authoring New Tests (`tests/*.test.mjs`)
- Keep tests fast (<1s), deterministic, and dependency-free using `node:test` and `node:assert/strict`.
- Never mutate `data/arena.db` during unit tests; test pure functions directly or pass isolated `:memory:` SQLite instances.
- Cover:
  - Positive & edge-case inputs
  - Security invariants (e.g., stripped fields, sanitized output)
  - Regression cases for any fixed bug

## 3. Live API & Browser E2E Verification
When modifying HTTP routes (`server.mjs`, `server/*`) or UI (`app/*`):
1. Ensure the server on `:3333` runs the latest code (`node --no-warnings=ExperimentalWarning server.mjs`).
2. Verify affected routes return expected status codes & payloads.
3. Verify affected UI views in Chrome (desktop & mobile width) with 0 console/page errors.
