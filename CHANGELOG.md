# Changelog

## 0.2.0

Overlays batch.

- `aurora-modal` — animated dialog with backdrop, Escape / backdrop-click to close, `open` attribute and `show()` / `hide()` methods, `aurora-open` / `aurora-close` events
- `aurora-tooltip` — hover/focus tooltip with `text` and `position` (top/bottom/left/right)
- `aurora-accordion` — collapsible panel with animated height
- `aurora-tabs` + `aurora-tab-panel` — tabbed interface with an animated active indicator, `aurora-tab-change` event
- Shared `escapeHtml` helper is now exported from the package root

## 0.1.0

Initial release.

- Framework-agnostic Web Components with self-contained Shadow DOM styling
- Core components (GSAP): `aurora-button`, `aurora-magnetic`, `aurora-text`, `aurora-marquee`, `aurora-tilt`
- 3D component (Three.js): `aurora-scene`, on the `aurora/three` entry so Three.js is opt-in
- CSS-variable theming, `prefers-reduced-motion` support
- ESM + CJS + type declarations via tsup; Vitest (happy-dom) tests; CI
