# Interview Coach Arena — Engineering & AI Agent Constitution

This repository (`interview-prep`) is a **100% local, privacy-first AI Interview Simulator, English Practice Studio, and Logic Brainteaser Arena**. All AI agents working in this codebase MUST follow these non-negotiable engineering standards.

## 1. Stack & Tooling Constraints
- **Package Manager:** Always use **`pnpm`** (`pnpm start`, `pnpm run check`, `pnpm run lint`, `pnpm test`, `pnpm run verify`). **NEVER run or recommend `npm`.**
- **Runtime:** Node.js `>= 22.13.0` (built-in `node:sqlite`, native ESM `.mjs`/`.js`, `node:test`).
- **Zero Build Tools / Zero Third-Party Runtime Packages:** Keep the core app free of bundlers and third-party runtime npm dependencies so `./start.sh` and `pnpm start` run cleanly out of the box. Browser libraries such as Three.js must load via explicit ESM `<script type="importmap">` with clean fallback when offline.
- **Language Policy:** All in-app UI labels, prompts, alerts, badges, and JSON feedback MUST be in **English**.

## 2. Component-First & Enterprise Modular Architecture
Think in clean, single-responsibility components and modules — **never dump features into monolithic files**:
- **`server.mjs`**: Thin HTTP router, static/`/shared` asset server, and lifecycle bootstrap only.
- **`server/`**: Domain-separated modules (`config.mjs`, `db.mjs`, `ollama.mjs`, `media-daemons.mjs`, `document-service.mjs`, `chat-service.mjs`).
- **`shared/`**: Isomorphic helpers (`transcript.mjs`) shared cleanly by both Node and the browser — never duplicate parsing, sanitization, or normalization logic across backend and frontend.
- **`app/components.js`**: Shared Tactile UI Light-DOM Web Components (`<int-button>`, `<int-card>`, `<int-field>`, `<int-textarea>`, `<int-select>`, `<int-toggle>`, `<int-progress>`). Reuse or extend these primitives instead of repeating raw markup.
- **`app/modules/`**: Modular UI controllers (`state.js`, `avatar.js`, `voice-media.js`, `scratchpad.js`, `call-arena.js`, `lobby.js`, `stats-shop.js`, `dashboard.js`, `targets.js`, `practice.js`, `cv-onboarding.js`).
- Keep non-catalog code files focused and cleanly bounded (target <= 600 lines; refactor if approaching 850 lines).

## 3. Mandatory Specialized Skills & Rules
Inspect `.agents/rules/` and activate the matching `.agents/skills/*/SKILL.md` whenever your ticket touches:
- UI layout, CSS, or Web Components -> **`.agents/skills/design-mobile-first/SKILL.md`**
- 3D WebGL scenes / Three.js animations -> **`.agents/skills/threejs-animations/SKILL.md`**
- Auth/privacy, file I/O, SQLite, inputs, headers, or LLM outputs -> **`.agents/skills/security-hardening/SKILL.md`**
- Tests, linters, and release checks -> **`.agents/skills/enterprise-testing-lint/SKILL.md`**

## 4. Mandatory Ticket Completion Gate
Before marking ANY coding ticket complete:
1. Write or update `node:test` unit tests in `tests/` for any new backend, shared, or pure domain logic.
2. Run **`pnpm run verify`** (`pnpm run check && pnpm run lint && pnpm test`) and ensure **0 errors**.
3. If UI or API endpoints changed, restart/verify the live server on `http://localhost:3333` with zero console/page errors.
