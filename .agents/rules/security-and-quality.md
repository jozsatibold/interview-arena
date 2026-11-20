# Enterprise Architecture, Security & Privacy Guardrails

## 1. Enterprise Code & Modularity Standards
- **Zero Duplication:** Never copy-paste helpers, API payloads, progress estimators, or form/dropzone wiring. Extract shared utilities (`shared/` for isomorphic code, `server/` for backend services, `app/modules/` + `app/components.js` for UI).
- **Single-Responsibility Modules:** Keep routes in `server.mjs` declarative and thin; keep SQL queries isolated inside `server/db.mjs`; keep prompt assembly inside `server/chat-service.mjs` / `role-adapter.mjs`.
- **Explicit Error Handling:** Never silently swallow critical errors on mutations or file I/O; return structured JSON errors `{ error: "..." }` with accurate HTTP status codes (`400`, `403`, `404`, `502`, `503`, `500`) without exposing raw stack traces.

## 2. Security & OWASP Hardening Rules (Mandatory)
1. **XSS & Safe DOM Rendering:**
   - NEVER insert untrusted strings (user chat, uploaded CV text, LLM responses, OCR output, custom company names) into `innerHTML` without wrapping EVERY dynamic value with `esc()` from `app/components.js`, or prefer `.textContent` / `document.createTextNode`.
2. **Path Traversal Protection:**
   - Any file read or static asset endpoint MUST normalize via `path.resolve(allowedRoot, ...)` and strictly verify `resolved.startsWith(allowedRoot)` before reading (`403 Forbidden` otherwise). Never construct paths with unvalidated user strings.
3. **SQLite Injection Prevention:**
   - Every `node:sqlite` query in `server/db.mjs` MUST use `db.prepare(...).run/get/all` with `?` positional parameters. Template-string SQL interpolation is strictly forbidden.
4. **Command Execution Safety:**
   - NEVER use `child_process.exec()` with string concatenation. Always use `execFile()` or `spawn()` with explicit argument arrays (`['-convert', 'txt', ...]`).
5. **Request Validation & Payload Hygiene:**
   - Validate all user-supplied IDs, model names (`/^[a-zA-Z0-9._:/-]+$/`), enums, and file extensions. Bound uploaded text and prompt slices cleanly.
6. **Domain Privacy & Data Isolation:**
   - **Guest Mode (`guestMode: true`):** Must NEVER read owner CV/student memory and must NEVER write XP, gems, streaks, mistakes, sessions, or logic puzzles to `data/arena.db`.
   - **Hidden Solution Keys:** `logic-puzzles.mjs` `solutionGuide` and internal server `hints` arrays must NEVER be returned in public catalog or puzzle generation responses (`sanitizeLogicPuzzleForClient` only).
   - **No Secrets / Local DB in Git:** Never commit `data/`, `*.db*`, `zonos3/`, or personal API tokens.
