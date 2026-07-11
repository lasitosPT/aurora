# Changelog

## 0.4.0

Motion & visuals batch — the aurorae from [auroralib.com](https://auroralib.com) as components.

- `aurora-nebula` — animated aurora-borealis backdrop as a tiny raw-WebGL fragment shader
  (~2 kB, no 3D library): `color`/`color2`/`color3`, `speed`, `glow`, `still`; DPR capped at 2,
  pauses off-screen and in hidden tabs, still frame under `prefers-reduced-motion`
- `aurora-reveal` — scroll-into-view fade/rise for any content, optional `stagger` for children
  (IntersectionObserver, no scroll listeners)
- `aurora-counter` — count-up number on scroll into view; re-tweens when `value` changes;
  `from`, `duration`, `decimals`; emits `aurora-complete`
- `aurora-cursor` — trailing cursor glow ring that grows over interactive elements; fine
  pointers only, never hides the system cursor; themed via `--aurora-cursor-*`
- `aurora-particles` (`aurora/three`) — drifting GPU particle field with additive glow,
  two-tone gradient and pointer parallax: `count`, `color`, `color2`, `size`, `speed`
- new `whenVisible` helper exported from the package root

## 0.3.0

Forms batch — all three are form-associated via `ElementInternals`, so they submit
natively with a surrounding `<form>`.

- `aurora-input` — text field with an animated focus underline; re-emits `input` / `change`
- `aurora-switch` — animated toggle with `role="switch"`; submits `value` (default `on`) when checked
- `aurora-slider` — draggable, keyboard-accessible range slider; emits `input` while sliding, `change` on release

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
