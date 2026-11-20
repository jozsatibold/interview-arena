---
name: design-mobile-first
description: >-
  Guides mobile-first UI architecture, tactile CSS design tokens, accessibility,
  and Light-DOM Web Component authoring in app/components.js and app/styles.css.
  Use whenever building or modifying views, cards, dialogs, responsive layouts,
  or interactive controls.
---

# Mobile-First Design System & Component Workflow

Build UI changes strictly as composable components that match the Interview Coach Arena design language and work smoothly on both `375px` mobile screens and desktop monitors.

## 1. Component-First Checklist
1. Check `app/components.js` first to see if an existing custom element fits (`<int-button>`, `<int-card>`, `<int-field>`, `<int-textarea>`, `<int-select>`, `<int-toggle>`, `<int-progress>`).
2. If you need a new repeated UI pattern across two or more views, define a clean Light-DOM `<int-*>` Custom Element in `app/components.js` (so existing CSS tokens, `<label for>`, and `:focus-visible` apply automatically) and put feature logic in `app/modules/<feature>.js`.
3. Never hardcode duplicated DOM builders across feature modules.

## 2. Mobile-First Layout & CSS Tokens
- Author base styles for narrow viewports (`320px–430px`):
  - Single-column grids (`grid-template-columns: minmax(0, 1fr)`), wrapped toolbars (`flex-wrap: wrap`), zero horizontal scrollbars.
  - Touch-friendly interactive targets (`min-block-size: 40px` to `44px`, clear active states).
  - Use CSS logical properties (`inline-size`, `block-size`, `padding-inline`, `100dvb`, `scrollbar-gutter: stable`).
- Scale upward with `@media (min-width: 768px)` and `@media (min-width: 1050px)`.
- Always style hidden states explicitly (`my-component[hidden] { display: none; }`) whenever a rule sets `display: flex` or `display: grid`.
- Use existing theme variables (`--int-green`, `--int-blue`, `--int-gold`, `--int-red`, `--int-purple`, `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--radius`).
- Honor `@media (prefers-reduced-motion: reduce)` for transitions and animations.

## 3. Verification
1. Verify mobile (`390x844`) and desktop (`1280x800`) layouts in the browser subagent: zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`), zero overlapping buttons, readable contrast, and English-only UI copy.
2. Run `pnpm run verify`.
