# Mandatory Ticket Verification & Quality Gate

Every development ticket or bug fix is considered **INCOMPLETE** until all applicable gates pass after the final edit:

1. **Automated Verification Command (Required on every code change):**
   ```bash
   pnpm run verify
   ```
   This runs:
   - `pnpm run check` (`node --check` across all `.mjs` and `.js` modules)
   - `pnpm run lint` (`scripts/lint.mjs`: modularity caps, security sinks, secret-leak checks, `pnpm` hygiene, CSS accessibility checks)
   - `pnpm test` (`node --test tests/*.test.mjs`)

2. **New Logic Must Have Tests:**
   - When adding or modifying logic in `server/`, `shared/`, `logic-puzzles.mjs`, `personalities.mjs`, or `role-adapter.mjs`, add corresponding `node:test` assertions in `tests/`.

3. **UI & Runtime Verification (When modifying `app/`, `server/`, or API routes):**
   - Restart or verify the server on `http://127.0.0.1:3333`.
   - Verify changed UI flows (including narrow mobile viewport checks when CSS/layout changes) with **0 console errors, 0 page errors, and 0 unexpected 4xx/5xx responses**.
