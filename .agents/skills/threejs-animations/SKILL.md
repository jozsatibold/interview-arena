---
name: threejs-animations
description: >-
  Builds high-FPS, leak-free, bundler-free Three.js WebGL 3D animations and
  interactive visual scenes in vanilla ES modules with mobile GPU budgeting,
  reduced-motion accessibility, and proper WebGL disposal. Use whenever creating
  3D backgrounds, interactive 3D avatar/voice reactive orbs, particle fields, or
  Three.js visualizations in app/.
---

# Three.js High-Performance Vanilla ES Module Guide

Use this skill when adding Three.js 3D graphics or audio-reactive animations to Interview Coach Arena without adding npm build steps.

## 1. Zero-Bundler Setup (`importmap` in `app/index.html`)
Add a pinned ESM import map in `app/index.html` `<head>` (or load lazily only when a 3D view is activated):
```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
```
**Offline / WebGL Fallback Rule:** Wrap Three.js dynamic import and `new THREE.WebGLRenderer(...)` in `try/catch`. If the user runs offline or WebGL context creation fails, fall back cleanly to the SVG/CSS animated avatar or stage gradient without throwing console errors!

## 2. Architecture Pattern (`app/modules/three-*.js`)
Encapsulate every 3D scene in a clean lifecycle controller returning `{ mount, updateAudioLevel, setMood, resize, dispose }`:
1. **Renderer Settings (Mobile-First GPU Budget):**
   - Cap pixel ratio: `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))`
   - Tone mapping: `renderer.toneMapping = THREE.ACESFilmicToneMapping`
   - Use `powerPreference: 'high-performance'` (desktop) or `'default'` when battery-conscious.
2. **Batching & Smooth Animation:**
   - Use `THREE.InstancedMesh` with `instanceMatrix.setUsage(THREE.DynamicDrawUsage)` for multi-object particles/bars/fields (1 draw call instead of thousands).
   - Use a single `THREE.Clock` (`getDelta()` clamped to `<= 0.05` to avoid jump spikes after tab switch) + `requestAnimationFrame`.
   - When using `OrbitControls`, enable `controls.enableDamping = true` and call `controls.update()` inside the loop.
3. **Accessibility (`prefers-reduced-motion`) & Visibility Pausing:**
   - Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`: render a crisp static frame instead of continuous high-speed motion.
   - Pause the `requestAnimationFrame` loop whenever `document.hidden` is true or the host `.spa-view` has class `inactive`.
4. **Strict GPU Memory Disposal (No Leaks on View Switch):**
   - Always remove `ResizeObserver` / `resize` listeners, cancel `requestAnimationFrame`, call `controls.dispose()`, traverse `scene` to `.dispose()` every geometry, material (array-safe), and texture, call `scene.clear()`, and run `renderer.dispose()`.

## 3. Verification
1. Verify scene renders at 60 FPS with `0` WebGL/console warnings, suspends cleanly when switching SPA views, and degrades gracefully if Three.js CDN is unreachable.
2. Run `pnpm run verify`.
