# 🦉 Interview Coach Arena

**A 100% local, privacy-first AI interview simulator, English fluency coach, and timed logic brainteaser studio.**

Run realistic mock video & voice interviews tailored to your own CV, practice daily English conversation, or solve 5–15 minute analytical interview puzzles side-by-side with an AI tutor who can see and collaborate on a shared live scratchpad—all running locally on your machine via **Ollama**, **ZONOS3-Mini**, **Whisper**, and **SQLite** with zero cloud uploads.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13-339933?logo=nodedotjs&logoColor=white)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20external%20packages-success)
![Local AI](https://img.shields.io/badge/Inference-100%25%20Local%20(Ollama)-orange)

---

## ✨ Key Features

- **📄 Any-Role CV Onboarding & Tailored 20-Day Path**
  - Upload a resume (`.pdf`, `.docx`, `.md`, `.txt`, or image screenshot via Vision OCR) on first launch.
  - A live local analyzer extracts your stack, achievements, and target level, builds custom **Fake Job** briefs, adapts **15 interviewer personas** across 6 domains (HR, Behavioral, Technical, Live Coding, System Design, Negotiation), and generates a **20-Morning Training Path**.
- **🎥 Realistic Live Video/Voice Call Arena**
  - Pre-call **Green Room Lobby** for camera/mic preview, rolled interviewer mood presets (10 moods per topic), and ZONOS3 voice testing.
  - Dynamic **3D-styled SVG avatars** (animated thinking, listening, and speaking states).
  - **Low-Latency Voice Pipeline:** Streams the LLM response sentence-by-sentence directly into **ZONOS3-Mini** neural TTS while refining microphone recordings with **Whisper Large-v3-Turbo**.
  - Silent **Live English Coach** overlay providing instant grammar/senior phrasing popups and a **"🔄 Say It Again"** spoken retry drill without interrupting dialogue flow.
- **🗣️ Practice Studio & Anonymous Guest Mode**
  - **English Conversation Mode:** Guided daily English chat with automatic **Learning & Thinking Map** tracking (hobbies for analogies, topic scores, cognitive preferences) and proportional, anti-sycophancy feedback.
  - **Guest Mode (`🧑 Guest Mode`):** Practice anonymously on the same device—completely hides the owner's CV and Learning Map and ensures zero XP, streaks, mistakes, or memory notes are saved.
- **🧩 Timed Logic Puzzles & Collaborative Live Scratchpad**
  - Curated library of **12 classic & modern interview puzzles** across 3 timers (**⚡ 5 min Easy**, **🎯 10 min Medium**, **🔥 15 min Hard**) and 5 categories (*Deduction & Constraints*, *Timing & Optimization*, *Weighing & Binary Search*, *Fermi Estimation*, *Probability & Game Theory*).
  - **✨ AI Puzzle Generator:** Generate brand-new puzzles on demand for any difficulty and category (`solutionGuide` stays strictly hidden on the server).
  - **Shared Live Scratchpad:** Write tables, hypotheses, and calculation steps in the call arena while the AI tutor inspects your live edits, offers Socratic guidance without spoiling the answer, and pins optional board hints.
- **🎯 Target Company Prep (Screenshot OCR + Series Builder)**
  - Paste job descriptions or screenshots (`Cmd+V` / drag & drop) to extract requirements with local Vision OCR (`qwen3-vl`, `gemma4`, etc.), analyze skill gaps, and generate a tailored multi-round interview pack.
- **🏆 Gamification, Power-Up Shop & SQLite Persistence**
  - Track streaks, XP, Gems, growth curves, and mastered mistakes locally in `data/arena.db` (`node:sqlite` WAL mode), plus unlockable in-call Power-Ups (*Anti-Freeze 2m Shield*, *Senior Power-Verb Hint*, *2x XP Boost*, *Streak Freeze*).

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
- Alternatively, open **🗣️ Practice → Guest Mode** right away to try English conversation or Logic Puzzles without uploading a CV.

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
│   ├── media-daemons.mjs         # ZONOS3-Mini TTS & Whisper STT lifecycle & audio endpoints
│   ├── document-service.mjs      # PDF/DOCX/Vision OCR parsing, CV analyzer & JD pack generator
│   └── chat-service.mjs          # Interview, English Tutor & Logic Scratchpad orchestration
├── shared/
│   └── transcript.mjs            # Shared ASR transcript normalizer (used by server & browser)
├── app/
│   ├── index.html                # Single-page app shell & semantic modals
│   ├── styles.css                # Responsive design tokens, call stage & scratchpad layouts
│   ├── components.js             # Lightweight Custom Elements (<int-button>, <int-card>, etc.)
│   ├── app.js                    # SPA router & bootstrap entrypoint
│   └── modules/                  # Modular frontend feature layers (avatar, call-arena,
│                                 # voice-media, scratchpad, lobby, dashboard, practice,
│                                 # targets, stats-shop, cv-onboarding, state)
├── agents/                       # Prompt directives for 15 interviewer variations
├── job-descriptions/             # Baseline job description briefs
├── cheatsheets/                  # Anti-freeze & C1 phrasing reference sheets
├── logic-puzzles.mjs             # Curated 5/10/15m logic puzzles + scratchpad templates
├── personalities.mjs             # 10 dynamic interviewer moods per topic
├── role-adapter.mjs              # Dynamic role/archetype adaptation for uploaded CVs
├── setup-zonos3.sh               # Optional Apple Silicon Metal ZONOS3-Mini installer
└── start.sh                      # Startup script
```

### Verification Commands

```bash
# Syntax check all backend, shared, and frontend ES modules
pnpm run check
```

---

## 🔒 Privacy & Publishing Notes

- **All runtime data stays local:** Uploaded CVs, chat sessions, mistake history, Learning & Thinking Maps, and custom generated target packs are stored strictly in `data/arena.db` (ignored by `.gitignore`).
- **Before publishing a fork or push:** Verify you do not commit anything inside `data/` or personal resume files outside `.gitignore`. Also customize or sanitize baseline seed prompts in `00-candidate-profile-and-core-rules.md`, `server/config.mjs` (`COMPACT_CANDIDATE_PROFILE`, `BASELINE_CV_PROFILE`), and `progress-log.md` if you prefer generic seed defaults instead of the author's sample baseline profile.

---

## 📜 License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for the full license text.
