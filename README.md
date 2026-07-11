# aurora

> A framework-agnostic library of animated UI components — Web Components powered by GSAP and Three.js.

[![CI](https://github.com/lasitosPT/aurora/actions/workflows/ci.yml/badge.svg)](https://github.com/lasitosPT/aurora/actions/workflows/ci.yml)
![GSAP](https://img.shields.io/badge/GSAP-3-88CE02?logo=greensock&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r185-000?logo=three.js&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

`aurora` ships as native **Web Components** (custom elements), so it works in **any** stack — React,
Vue, Svelte, or plain HTML — with no wrapper and no config. Styles are encapsulated in Shadow DOM and
themed with CSS variables; motion is powered by GSAP, and the 3D component uses Three.js.

## Install

```bash
npm install aurora
```

```ts
import 'aurora' // registers the core components
import 'aurora/three' // registers <aurora-scene> (pulls in Three.js only here)
```

Then use the elements anywhere:

```html
<aurora-text><h1>Motion, built in.</h1></aurora-text>

<aurora-magnetic strength="0.5">
  <aurora-button>Hover me</aurora-button>
</aurora-magnetic>

<aurora-tilt max="14">
  <div class="card">Tilt me toward your cursor.</div>
</aurora-tilt>

<aurora-marquee speed="80">GSAP · Three.js · Web Components · </aurora-marquee>

<aurora-scene color="#6d5cff" speed="1.2"></aurora-scene>
```

Because they're standard custom elements, you write them the same way in JSX, Vue templates, or HTML.

## Components

| Element            | Description                              | Attributes                                 |
| ------------------ | ---------------------------------------- | ------------------------------------------ |
| `aurora-button`    | Themeable button                         | `variant` (`primary`/`ghost`), `disabled`  |
| `aurora-magnetic`  | Content magnetically follows the cursor  | `strength` (default `0.4`)                 |
| `aurora-text`      | Word-by-word masked text reveal          | `stagger`, `delay`                         |
| `aurora-marquee`   | Seamless horizontal scroller             | `speed` (px/s, default `60`)               |
| `aurora-tilt`      | 3D tilt toward the cursor                | `max` degrees (default `12`)               |
| `aurora-modal`     | Animated dialog with backdrop            | `open`; `show()` / `hide()`                |
| `aurora-tooltip`   | Hover / focus tooltip                    | `text`, `position` (top/bottom/left/right) |
| `aurora-accordion` | Collapsible panel with animated height   | `label`, `open`; `show()` / `hide()`       |
| `aurora-tabs`      | Tabbed interface with animated indicator | `active`; wraps `aurora-tab-panel[label]`  |
| `aurora-scene` ⬦   | Animated 3D wireframe backdrop           | `color`, `detail`, `speed`                 |

⬦ imported from `aurora/three`.

### Overlays

```html
<button onclick="document.querySelector('#dialog').show()">Open</button>
<aurora-modal id="dialog">
  <h2>Hello</h2>
  <p>Press Escape or click the backdrop to close.</p>
</aurora-modal>

<aurora-tooltip text="Copied to clipboard" position="top">
  <aurora-button>Copy</aurora-button>
</aurora-tooltip>

<aurora-accordion label="What is aurora?">
  A framework-agnostic set of animated web components.
</aurora-accordion>

<aurora-tabs active="0">
  <aurora-tab-panel label="Overview">…</aurora-tab-panel>
  <aurora-tab-panel label="Install">…</aurora-tab-panel>
</aurora-tabs>
```

## Theming

Every component reads CSS custom properties (with sensible fallbacks). Set them on `:root` or on any
ancestor — they pierce the shadow boundary:

```css
:root {
  --aurora-accent: #6d5cff;
  --aurora-accent-hover: #5a49e0;
  --aurora-radius: 0.6rem;
}
```

All components respect `prefers-reduced-motion` and disable animation when the user asks for it.

## Try the demo

```bash
npm run build
npx serve   # then open examples/index.html
```

## Development

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Tests run in `happy-dom`, so custom-element registration, attributes, and Shadow DOM structure are
verified in CI.

## License

[MIT](LICENSE) © Pedro Lascasas Pinto
