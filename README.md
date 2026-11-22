# 🦉 Interview Coach Arena

**A 100% local, privacy-first AI interview simulator covering 32 IT startup & enterprise roles, English fluency coaching, and timed logic brainteasers.**

Run realistic mock video & voice interviews tailored to your own CV—or switch instantly to any of **32 tech-company roles** (from CEO, CFO, CTO, COO, CRO, PM, UX Designer, TPM, CSM, and People Ops to Frontend, Backend, Mobile, Systems, Data, DevOps, QA, and Security)—powered by built-in **Senior Role Knowledge Bases**, **20 Language/Mobile/Web/Cloud Stack KBs**, **Ollama**, **ZONOS3-Mini**, **Whisper**, and **SQLite** with zero cloud uploads.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13-339933?logo=nodedotjs&logoColor=white)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20external%20packages-success)
![Local AI](https://img.shields.io/badge/Inference-100%25%20Local%20(Ollama)-orange)

---

## ✨ Key Features

- **🏢 Universal Tech-Company Role Coverage (32 Startup & Enterprise Roles)**
  - Automatic CV role detection **plus** an instant **Target Role** switcher (`Auto (From Active CV)` or any of 32 specialized tracks persisted in SQLite) across 5 departments:
    - **Executive & C-Suite:** CEO / Founder / GM, COO / VP Ops, CTO / VP Eng, CFO / VP Finance, CRO / VP Sales / Enterprise GTM
    - **Leadership, Delivery & Field:** Engineering Manager, Tech Lead / Staff+, TPM / Scrum Master / Delivery Lead, Solutions Architect / Sales Eng
    - **Product, Design & Growth:** Product Manager, Product Owner / Scrum, Product / UX Designer (*Figma Variables/Auto Layout/Dev Mode, FigJam, Maze, Dovetail, ProtoPie/Rive, Storybook, Stark WCAG 2.2 AA*), Growth & Product Marketing (PMM)
    - **Customer Success & People Ops:** Customer Success / TAM / Support Eng, People Ops / HRBP / Tech Recruiter
    - **Engineering, Mobile, Data & Security:** Frontend / Full-Stack TS, Java / JVM & Spring, .NET / C#, Python / Backend & AI, PHP / Laravel & Symfony, Go (Golang), Rust, C / C++20 Systems & Embedded, iOS (Swift & Objective-C), Android (Kotlin & Jetpack Compose), Cross-Platform Mobile (React Native / Flutter / Cordova), Flutter / Dart, QA / SDET, DevOps / SRE / Cloud, Data / ML / Analytics, Security / AppSec / CISO, Senior Software Engineer
  - Dynamic topic filters, interviewer personas, **Fake Job** briefs, **20-Morning Training Path**, Scorecard KPIs, and no-code guardrails automatically adapt to every non-coding and technical role.
- **📚 Built-In Senior Knowledge Bases & Interactive Role Playbook (32 Roles + 20 Tech Stacks)**
  - Every role includes a curated senior hiring rubric (`mandate`, core frameworks/formulas/benchmarks, *"If candidate says X → probe Y"* follow-up ladders, red flags, round-by-round evaluation rubrics, and senior phrasing examples) injected into both live interviewer turns and final Top 5% Scorecard debrief grading.
  - **20 Built-In Tech-Stack Micro-KBs** (*TypeScript/JS, Node.js, React/Next.js, Vue 3/Nuxt, Lit/Web Components, Angular/RxJS, Java & Spring Boot, C# & .NET Core, Python/FastAPI/AI, Go, Rust/Tokio, C/C++20, Swift/SwiftUI, Objective-C, Kotlin/Android Compose, React Native JSI/Fabric, Cordova/Ionic/Capacitor, Flutter/Dart, SQL/PostgreSQL, AWS/Kubernetes/Terraform*) automatically matched from CV + JD for technical tracks—with tier-budgeted formatting (`Small 1B–8B`, `Medium 9B–35B`, `Large 36B+`) guaranteeing zero rubric truncation.
  - Open **📚 Role Playbook** directly from the 20-Day Path or Pre-Call Lobby to study any role's frameworks, probe traps, red flags, and all 20 tech stacks before joining a call.
- **🎥 Realistic Video/Voice Call Arena & Streamlined Green Room Lobby**
  - Clean Google Meet-style **Green Room Lobby** with live self-camera preview, instant mic/camera toggles, role JD brief, `📚 Prep KB` shortcut, and `⚙️ Settings` modal (11 configurable interviewer personality dimensions, ZONOS3 voice presets, call duration, Exam Mode).
  - Full-screen call stage featuring **Standard** and **Detailed Realistic HD** animated avatars with lip-sync visemes, posture lean, listening nods, live captions (`CC`), **Hands-Free VAD / Push-to-Talk / Barge-In**, subtle studio room-tone audio, **Role-Aware Screen Share** artifacts (Board/FinOps/Funnel/QBR/RAID/PoC/Figma/Concurrency cases), and post-call **Speech Metrics** (WPM, talk ratio, filler words).
  - **Low-Latency Voice Pipeline:** Streams LLM replies sentence-by-sentence directly into **ZONOS3-Mini** neural TTS while transcribing microphone audio locally with **Whisper Large-v3-Turbo**.
  - Silent **Live English Coach** overlay (or deferred **Real Interview / Exam Mode**) with grammar/senior phrasing upgrades and a **"🔄 Say It Again"** spoken retry drill.
- **📄 Any-Role CV Onboarding & Target Company Prep**
  - Upload a resume (`.pdf`, `.docx`, `.md`, `.txt`, or image screenshot via Vision OCR) on first launch, or paste target job ads/screenshots (`Cmd+V` / drag & drop) in **Target Interviews** to extract requirements, analyze gaps, and generate a custom multi-round prep pack.
- **🗣️ Practice Studio, Timed Logic Puzzles & Anonymous Guest Mode**
  - **English Conversation Mode** with automatic **Learning & Thinking Map** tracking and proportional anti-sycophancy feedback.
  - **12+ Timed Logic Puzzles** (**⚡ 5m**, **🎯 10m**, **🔥 15m**) with an on-demand **✨ AI Puzzle Generator** (`solutionGuide` stays strictly server-side) and a **Shared Live Scratchpad** inspected in real time by the AI tutor.
  - **Guest Mode (`🧑 Guest Mode`):** Practice anonymously without reading or mutating the owner's CV, XP, streaks, or memory.
- **🏆 Gamification, Power-Up Shop & Local SQLite Persistence**
  - Tracks streaks, XP, Gems, growth curves, and mastered mistakes locally in `data/arena.db` (`node:sqlite` WAL mode), plus unlockable Power-Ups (*Anti-Freeze 2m Shield*, *Senior Power-Verb Hint*, *2x XP Boost*, *Streak Freeze*).

---

## 🛠️ Prerequisites

1. **Node.js `>= 22.13.0`** (required for built-in `node:sqlite` and native ES modules — **zero external dependencies**, optional `pnpm` for scripts).
2. **[Ollama](https://ollama.com/download)** installed and running locally on `http://127.0.0.1:11434`.
3. **Recommended Local Models:**
   ```bash
   # Fast & smart Mixture-of-Experts chat/logic model (recommended if RAM permits)
   ollama pull qwen3.6:35b-a3b-q8_0

   # Or a lightweight 8B–9B dense conversational model
   ollama pull qwen3.5:9b

   # Optional: local Vision OCR model for JD/CV screenshots
   ollama pull qwen3-vl:8b
   ```
4. **Optional Voice Engines (Browser Web Speech API fallback works out-of-the-box):**
   - **Natural Neural TTS ([Zyphra/ZONOS3-Mini](https://huggingface.co/Zyphra/ZONOS3-Mini)):** On macOS Apple Silicon, `./setup-zonos3.sh` (or clicking the **ZONOS3 Setup** button inside **Settings**) clones, compiles the GGML Metal server, downloads weights, and serves on `:1919`.
   - **High-Accuracy Tech STT (`whisper.cpp`):** Install via `brew install whisper-cpp`, download a model (e.g., `ggml-large-v3-turbo.bin` to `~/Models/whisper/`), and the server auto-starts `whisper-server` on `:1818` if present.
   - *(macOS CV PDF parsing uses built-in `/usr/bin/swift` PDFKit and `/usr/bin/textutil` for `.docx`/`.rtf`.)*

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/interview-coach-arena.git
cd interview-coach-arena

# 2. Make sure Ollama is running
ollama serve

# 3. Start Interview Coach Arena (no pnpm install required!)
./start.sh
# or:
pnpm start
```

Open **`http://localhost:3333`** in Chrome/Chromium (recommended for Web Speech + MediaRecorder live voice streaming).

- If **no CV** exists in `data/arena.db`, the app automatically opens the **Onboarding Wizard** so you can upload your CV and build your personalized workspace.
- Alternatively, switch **Target Role** to any of the 32 built-in startup/enterprise roles, open **📚 Role Playbook** to study its Senior Knowledge Base, or launch **🗣️ Practice → Guest Mode** right away.

---

## ⚙️ Configuration (Environment Variables)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3333` | HTTP server port (`127.0.0.1`) |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Local Ollama API endpoint |
| `ZONOS_HOST` | `http://127.0.0.1:1919` | ZONOS3-Mini TTS server URL |
| `WHISPER_HOST` | `http://127.0.0.1:1818` | Local `whisper-server` STT endpoint |
| `WHISPER_MODEL` | `~/Models/whisper/ggml-large-v3-turbo.bin` | Path to local Whisper GGML model file |

---

## 🏗️ Architecture

Built cleanly with **zero build tools** and **zero third-party dependencies** using native ES modules on both Node.js and the browser:

```text
interview-prep/
├── server.mjs                    # Thin HTTP router, static & /shared asset server
├── server/
│   ├── config.mjs                # App constants, model presets, agent & tutor catalogs
│   ├── db.mjs                    # SQLite WAL schema & repositories (profile, CVs, memory, puzzles)
│   ├── ollama.mjs                # Ollama streaming client, JSON extractor & model rankers
│   ├── pacing.mjs                # Phased conversation pacing & role-specific topic scope contracts
│   ├── tutor-memory.mjs          # English Tutor cognitive map, memory tracker & system prompts
│   ├── media-daemons.mjs         # ZONOS3-Mini TTS & Whisper STT lifecycle & audio endpoints
│   ├── document-service.mjs      # PDF/DOCX/Vision OCR parsing, CV analyzer & JD pack generator
│   └── chat-service.mjs          # Interview, English Tutor & Logic Scratchpad orchestration
├── shared/
│   ├── role-archetypes.mjs       # Core role detection & universal 32-role archetype registry
│   ├── role-archetypes-extra.mjs # Grouped dropdown taxonomy, UI topic labels & extended roles
│   ├── role-knowledge.mjs        # Tier-budgeted Senior Knowledge Base aggregator & debrief grader
│   ├── kb-executive.mjs          # Senior KBs: CEO, COO, CTO, CFO, CRO, EM
│   ├── kb-product-gtm.mjs        # Senior KBs: PM, PO, Product/UX Design, Growth/PMM, Tech Lead, SA
│   ├── kb-engineering-core.mjs   # Senior KBs: Frontend, Java, .NET, Python, PHP, Flutter
│   ├── kb-engineering-infra.mjs  # Senior KBs: DevOps/SRE, QA/SDET, Data/ML, Security/CISO, General
│   ├── kb-mobile-systems.mjs     # Senior KBs: Go, Rust, iOS (Swift/Obj-C), Cross-Platform Mobile
│   ├── kb-startup-enterprise.mjs # Senior KBs: Android (Kotlin), C/C++20, TPM, CSM/TAM, People Ops
│   ├── kb-tech-stacks.mjs        # 20 built-in Language, Mobile, Web, SQL & Cloud micro-KBs
│   ├── interview-artifacts.mjs   # Role-pinned Screen Share briefs (Board, FinOps, Funnel, Code, etc.)
│   ├── model-tiers.mjs           # Small / Medium / Large LLM auto-detection & context budgets
│   ├── speech-metrics.mjs        # Live WPM, talk ratio & filler-word telemetry
│   ├── transcript.mjs            # Shared ASR transcript normalizer
│   ├── viseme.mjs                # Hybrid phonetic viseme timeline for lip-sync
│   ├── company.mjs               # Conflict-free fictional employer generator
│   └── expression.mjs            # Emotional expression normalization
├── app/
│   ├── index.html                # Single-page app shell & native <dialog> modals
│   ├── styles.css                # Responsive design tokens, video call stage & playbook styles
│   ├── components.js             # Lightweight Custom Elements (<int-button>, <int-card>, etc.)
│   ├── app.js                    # SPA router & bootstrap entrypoint
│   └── modules/                  # Modular frontend feature layers (avatar, avatar-detailed,
│                                 # avatar-motion, call-arena, call-audio, call-ui, call-vad,
│                                 # voice-media, screen-share, scratchpad, lobby, dashboard,
│                                 # role-playbook, practice, targets, stats-shop, cv-onboarding, state)
├── agents/                       # Baseline prompt directives for 15 interviewer variations
├── job-descriptions/             # Baseline job description briefs
├── cheatsheets/                  # Anti-freeze & C1 phrasing reference sheets
├── scripts/lint.mjs              # Zero-dependency syntax, modularity & security linter
├── tests/unit.test.mjs           # Node native unit test suite
├── logic-puzzles.mjs             # Curated 5/10/15m logic puzzles + scratchpad templates
├── personalities.mjs             # 11-dimension dynamic interviewer personality engine
├── role-adapter.mjs              # Dynamic role adaptation, Fake JD & 20-Day Path engine
├── setup-zonos3.sh               # Optional Apple Silicon Metal ZONOS3-Mini installer
└── start.sh                      # Startup script
```

### Verification Commands

```bash
# Run full syntax check, modularity/security lint, and unit test suite
pnpm run verify

# Or run individual stages:
pnpm run check
pnpm run lint
pnpm test
```

---

## 🔒 Privacy & Publishing Notes

- **All runtime data stays local:** Uploaded CVs, chat sessions, mistake history, Learning & Thinking Maps, and custom generated target packs are stored strictly in `data/arena.db` (ignored by `.gitignore`).
- **Before publishing a fork or push:** Verify you do not commit anything inside `data/` or personal resume files outside `.gitignore`. Also customize or sanitize baseline seed prompts in `00-candidate-profile-and-core-rules.md`, `server/config.mjs` (`COMPACT_CANDIDATE_PROFILE`, `BASELINE_CV_PROFILE`), and `progress-log.md` if you prefer generic seed defaults instead of the author's sample baseline profile.

---

## 📜 License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for the full license text.
