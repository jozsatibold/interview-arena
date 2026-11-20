---
name: security-hardening
description: >-
  Audits and enforces OWASP security and local AI privacy controls across Node.js
  HTTP handlers, SQLite queries, file I/O, shell spawns, CSP/headers, and
  client DOM rendering. Use before exposing new endpoints, handling uploaded
  files/images, rendering LLM outputs, or modifying Guest Mode privacy logic.
---

# Security & Privacy Hardening Workflow

Use this skill when auditing or modifying server routes, database persistence, file parsing, or client HTML rendering.

## 1. Server-Side Checklist
1. **Path Safety:** Every path derived from a URL or payload (`serveStaticAsset`, `job-descriptions`, uploads) must resolve against a fixed root (`path.resolve(ROOT, ...)`) and confirm `.startsWith(ROOT)`. Strip path components via `path.basename()`.
2. **SQLite Prepared Statements:** Confirm all `server/db.mjs` queries use `db.prepare(...).run/get/all` with `?` placeholders—zero string interpolation inside SQL.
3. **Process Execution:** Verify all subprocess calls use `execFile` or `spawn` with argument arrays (`cmd, [arg1, arg2]`). Never construct shell command strings with user data.
4. **Payload & Header Hardening:**
   - Enforce bounded request sizes in `readJsonBody` and audio uploads.
   - Validate identifiers (`agentFile`, `model`, `cvId`) with strict allowlists or regex (`/^[a-zA-Z0-9._:/-]+$/`).
   - Do not expose internal stack traces in 500 JSON responses.
5. **Privacy Isolation:**
   - Check `isGuestSession` in `server/chat-service.mjs`: Guest mode must never read owner CV/memory (`getActiveCv`, `getStudentMemorySync`) and must never mutate SQLite profile/XP/mistakes/memory/puzzles.
   - Check `sanitizeLogicPuzzleForClient`: `solutionGuide` and internal `hints` must stay strictly server-side.

## 2. Client-Side Checklist
1. **XSS Prevention:** Search edited `app/**/*.js` for `.innerHTML =` and confirm every dynamic expression uses `esc(...)` or `textContent`.
2. **Data Hygiene:** Verify no credentials, `.env` keys, personal CV PDFs, or `data/*.db` files are un-ignored by `.gitignore`.

## 3. Verification
1. Run `pnpm run lint` and `pnpm test`.
2. Add or extend negative tests in `tests/` for path-traversal rejections, SQLite boundaries, and secret stripping.
