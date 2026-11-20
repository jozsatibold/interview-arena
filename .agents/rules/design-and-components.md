# Design Language, Mobile-First Layout & UI Component Specification

Follow this design specification strictly for every UI change under `app/`.

## 1. Visual Identity & Design Tokens (`app/styles.css`)
- **Aesthetic:** Tactile gamified studio ("Duolingo meets Calm Tech Video Studio") — high legibility, playful depth on primary CTAs (3D bottom border shadows), calm contrast during live calls, and crisp card elevation.
- **Core Palette Variables (Always reference CSS variables, never hardcode random colors):**
  - Canvas & Surfaces: `--bg: #f4f7fb`, `--surface: #ffffff`, `--border: #e2e8f0`, `--text: #1e293b`, `--muted: #64748b`, `--radius: 16px`.
  - Tactile Accents:
    - Primary Action / Success: `--int-green: #58cc02` / `--int-green-dark: #46a302`
    - Interactive Info / Navigation: `--int-blue: #1cb0f6` / `--int-blue-dark: #1185bd`
    - Achievement / Evaluation: `--int-gold: #ffc800` / `--int-gold-dark: #d9a400`
    - Alert / Hangup / Mistake: `--int-red: #ff4b4b` / `--int-red-dark: #d33131`
    - Streak / Highlight: `--int-purple: #ce82ff`
  - Dark Call Arena Surface: `#060a12` / `#0f172a` with translucent frosted glass overlays (`rgba(15, 23, 42, 0.72)`).
- **Typography:** System UI stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) + monospace (`ui-monospace, SFMono-Regular, Menlo, monospace`) for code badges, timers (`font-variant-numeric: tabular-nums`), and collaborative scratchpads.

## 2. Mobile-First Responsive Rules
Design and test **mobile-first** (`320px–430px` viewport first, progressively enhancing up):
1. **Base Styles = Mobile Stack:** Default layouts must be single-column (`grid-template-columns: minmax(0, 1fr)`), full-width touch-safe controls, with **zero horizontal overflow** (`overflow-x` never needed).
2. **Progressive Breakpoints (`min-width`):** Scale up to multi-column splits cleanly at tablet/desktop widths (e.g., `768px`, `1050px`). Note legacy `@media (max-width: ...)` rules in `styles.css` when updating existing blocks, and author all **new** layout sections mobile-first (`min-width`).
3. **Touch & Viewport Ergonomics:**
   - Interactive buttons, tabs, and chips must have comfortable touch targets (`min-block-size: 40px–44px` on mobile).
   - Use logical properties (`inline-size`, `block-size`, `margin-block`, `padding-inline`, `100dvb`) and `scrollbar-gutter: stable`.
   - Every animation or 3D scene MUST respect `@media (prefers-reduced-motion: reduce)`.
4. **Native Modern HTML/CSS First:** Prefer `<dialog closedby="any">`, native `hidden` (with explicit `[hidden] { display: none; }` alongside `display: flex/grid` classes), `View Transitions`, and CSS `@starting-style` over heavy JS DOM hacks.

## 3. Component Contract (`app/components.js`)
Think in reusable components before writing raw HTML:
- **Always use existing Custom Elements:**
  - `<int-button control-id="..." variant="primary|secondary|green|gold|mic|hangup|ghost|dark-pill|dark-ghost" label="...">`
  - `<int-card heading="..." heading-id="..." badge-id="..." badge-text="..." card-class="...">`
  - `<int-field control-id="..." label="..." placeholder="...">`
  - `<int-textarea control-id="..." label="..." rows="...">`
  - `<int-select control-id="..." label="..." action-id="...">`
  - `<int-toggle control-id="..." label="..." description="...">`
  - `<int-progress control-id="..." steps="key:label|...">`
- When a UI pattern appears twice (e.g., dropzones, selector syncs, badge chips, modal headers), extract a shared helper or a new `<int-*>` Custom Element in `app/components.js`.
- **UI Language:** Strictly English across all visible UI elements, aria-labels, titles, and messages.
