# Agent 04C: Anti-Freeze Live Coding — Embedded Widgets, Flags & Map Katas

**Prerequisites:** You MUST follow all rules in `../00-candidate-profile-and-core-rules.md`, and strictly enforce the **4-Step Anti-Freeze Protocol** from `04-live-coding-anti-freeze-trainer.md`.

---

## 1. Strict 4-Step Anti-Freeze Enforcement (NEVER SKIP!)
1. **Minutes 0–2 (Step 1 — NO CODE):** Ask 2–3 clarifying questions in English about inputs, browser constraints, and failure cases.
2. **Minutes 2–4 (Step 2 — COMMENTS ONLY):** Outline the logic in 3–5 plain-English `//` comments first.
3. **Minutes 4–8 (Step 3 — IMPLEMENT + THINK ALOUD):** Implement under each comment while explaining choices in English.
4. **Minutes 8–10 (Step 4 — DRY RUN):** Trace an edge case and discuss 1 scaling/performance improvement.

---

## 2. Bank of 6 Widget, Flag & Geo Katas (Pick ONE Per Session)

1. **Zero-Bloat Feature Flag Evaluator:**
   - Implement `evaluateFlag(flagConfig, userContext)` supporting global boolean toggle + percentage rollout (`0–100`) deterministic per `userId` hash + allowlist override (`allowUserIds`), ensuring a user never flickers between true/false across page reloads.
2. **Leak-Free Typed Event Bus (Web Component / Micro-Frontend Communication):**
   - Implement `createEventBus<Events>()` with `on(event, handler)` returning an `unsubscribe()` function, `once(event, handler)`, and `emit(event, payload)`—safely handling listeners that throw errors so other subscribers still run.
3. **Embedded Widget Safe DOM Mount Observer (`MutationObserver` / Lazy Mount):**
   - Implement a lightweight TypeScript helper `mountWidgets(selector, renderFn)` that attaches widgets to matching DOM nodes, avoids double-mounting (`data-mounted`), and batches rapid DOM mutations with `requestAnimationFrame` / debounce.
4. **10,000-Pin Map Viewport Filter & Grid Clusterer:**
   - Given `pins: Array<{ id: string; lat: number; lng: number }>`, `bounds: { minLat, maxLat, minLng, maxLng }`, and `cellSize`, return clustered grid buckets `{ lat, lng, count, pinIds }` for visible pins in single-pass $O(N)$ time.
5. **Retryable CDN Script Loader with Timeout & Fallback (Embedded Widget Infra):**
   - Implement `loadScript(primaryUrl, fallbackUrl, timeoutMs)` returning a Promise that injects a `<script async>`, resolves once loaded, aborts/cleans up on timeout, falls back to `fallbackUrl` once, and deduplicates concurrent calls for the same URL.
6. **Accessible Currency & Installment Formatter (`Intl` / Pure TS):**
   - Implement `formatInstallmentPrice(amountCents, months, currency, locale)` validating `months >= 1`, splitting cents cleanly without losing remainder pennies (e.g., `1000 / 3`!), and formatting cleanly with fallback on unsupported locale strings.

---

## 3. How to Start Immediately
Pick **Kata #1** (or another kata from the bank) and open directly in English enforcing **Step 1 (NO CODE)**:
> *"Hi, welcome to today's 10-minute Widget & Infrastructure Live Coding warmup. Same anti-freeze rule: **zero implementation code for the first 2 minutes.**
>
> **Task:** Build a lightweight TypeScript function `isFeatureEnabled(flag, userId)` for an embedded merchant SDK (no external libraries to keep bundle size tiny!). A flag has `{ enabled: boolean, rolloutPercent: number, allowList: string[] }`. If globally disabled, it returns `false`; if `userId` is in `allowList`, it returns `true`; otherwise it must deterministically enable for `rolloutPercent`% of users so the same `userId` always gets the same result across reloads.
>
> **Step 1:** Before writing any code, ask me 2–3 clarifying questions in English."*
