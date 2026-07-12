# Changelog

## 0.34.0

- `aurora-upload` — drag-and-drop file zone: click/keyboard browse or drop, staggered
  per-file rows with size and remove buttons, `multiple`, `accept`, `max-size`
  rejections via `aurora-error`, form-associated with one FormData entry per file;
  `files` getter and `addFiles()`; emits `aurora-change`. Ships with docs.

## 0.33.0

Component #60 — the layout trio is complete.

- `aurora-popover` — an anchored floating panel: `slot="trigger"` + content, four
  placements, click toggle or `hover`, Escape/outside-click close, scale-in animation;
  emits `aurora-open`/`aurora-close`. Ships with docs.

## 0.32.0

- `aurora-window` — a floating, draggable window: grab the title bar to move (clamped
  to the viewport), click to bring to front, ✕/Escape close, Tab trap and focus
  restore via the shared helper, spring-in animation. Ships with docs.

## 0.31.0

Layout trio begins.

- `aurora-splitter` — two resizable panes (`slot="a"`/`slot="b"`) with a draggable
  divider, horizontal or `vertical`, `min` (%) bounds, arrow-key nudging on the
  focusable separator, accent highlight while dragging; emits `aurora-resize`.
  Ships with docs.

## 0.30.0

- `aurora-chart` — a full 2D-canvas chart: grouped `bar`, multi-series `line`, and
  `donut` types with gridlines and y-ticks, category labels, an HTML legend, hover
  tooltips per category, and an animated intro on scroll into view. `labels` +
  `series` ({ label, data, color? }[]), height via `--aurora-chart-height`. Ships
  with docs.

## 0.29.0

Charts begin.

- `aurora-sparkline` — a tiny inline chart on a 2D canvas: `line`, `area`, or `bars`,
  self-drawing when scrolled into view, DPR-aware, colored via
  `--aurora-spark-color/-fill`, `role="img"` with a label. Ships with docs.

## 0.28.0

Navigation pair.

- `aurora-breadcrumb` — trail from `items` ({ label, href? }[]), custom `separator`,
  last item as `aria-current="page"`; hrefless crumbs emit `aurora-select`
- `aurora-chips` — chip list from `<option>`s or `options`: `selectable`
  (`single`|`multiple`) with a pop and `aria-pressed`, `removable` ✕ buttons,
  `values` getter; emits `aurora-change` / `aurora-remove`. Both ship with docs.

## 0.27.0

- `aurora-stepper` — multi-step progress: `steps` string[] or child `<option>`s,
  accent-filled connectors, checkmarked done steps, a pop on advance, jump-back on
  completed dots (`linear="false"` for free jumping), `next()`/`prev()`/`value`;
  emits `aurora-change`. Ships with docs.

## 0.26.0

- `aurora-treeview` — hierarchical navigation from nested `items`
  (`{ label, value?, open?, children? }`): animated expand/collapse with staggered
  child reveals, ARIA tree keyboard pattern (Up/Down over visible rows, Right expands,
  Left collapses, Enter selects), roving tabindex; emits `aurora-select` and
  `aurora-toggle`. Ships with docs.

## 0.25.0

- `aurora-otp` — segmented one-time-code input: auto-advance, Backspace steps back,
  arrows move, pasting distributes the code, `autocomplete="one-time-code"` on the
  first cell, reflected `complete` with a success pop; `alphanumeric` mode;
  form-associated; emits `aurora-complete`. Completes the inputs cluster; ships with
  docs.

## 0.24.0

Component #50.

- `aurora-masked` — pattern-masked text input: `#` digit, `A` letter, `*` alphanumeric,
  literals auto-typed; wrong character classes are skipped; the `complete` attribute
  reflects a fully filled mask; submits the raw characters; emits `aurora-change` with
  `{ value, raw, complete }`. Ships with docs.

## 0.23.0

- `aurora-numeric` — numeric spinner: −/+ with a pop, typed values clamped to min/max
  and snapped to step on commit, ArrowUp/Down steps, `decimals` fixed-point display,
  form-associated; emits `aurora-change`. Ships with docs.

## 0.22.0

- `aurora-rating` — star rating with a pop on pick: `max`, `value`, `char`, `readonly`,
  arrow-key rating, radiogroup ARIA, form-associated; themed via
  `--aurora-rating-on/-off/-size`; emits `aurora-change`. Ships with docs.

## 0.21.0

- `aurora-timepicker` — an HH:MM input with hour/minute columns in a popup: `step`
  minute increments, selected values centered on open, Escape/outside-click close,
  form-associated; emits `aurora-change`. Completes the core date/time suite; ships
  with docs.

## 0.20.0

- `aurora-datepicker` — a date input that pops the library's own `<aurora-calendar>`
  (first internal composition): ISO or locale display (`format`), Escape/outside-click
  close, focus handoff into the grid and back, form-associated; emits `aurora-change`.
  Ships with docs.

## 0.19.0

- `aurora-calendar` — month-view calendar: Monday-first grid, today outline, full
  keyboard flow (arrows move by day/week, PageUp/PageDown by month, Enter picks),
  ISO `value`, form-associated; emits `aurora-change`. Ships with docs.

## 0.18.0

- `aurora-multiselect` — pick-many dropdown: removable chips in the trigger, checkbox
  listbox popup, `values` string[] API, form-associated with one FormData entry per
  value; emits `aurora-change`. Completes the dropdown editor trio; ships with docs.

## 0.17.0

- `aurora-autocomplete` — type-to-filter suggestions with match highlighting, arrow/Enter
  selection, Escape close, `min-chars`, form-associated; options from a string[] property
  or child `<option>`s; emits `aurora-change`. Ships with its docs page.

## 0.16.0

Dropdown editors begin.

- `aurora-select` — animated DropDownList: options from child `<option>`s or the
  `options` property, form-associated via ElementInternals, combobox/listbox ARIA,
  full keyboard flow (arrows, Home/End, Enter, Escape, first-letter type-ahead),
  outside-click close, `placeholder`, `value`; emits `aurora-change`

## 0.15.0

Grid parity wave 3 — virtualization.

- `virtual` (+ `row-height`, default 36): with paging off, only the visible window of
  rows renders inside `--aurora-grid-height` (420px default); spacer rows keep the
  scrollbar honest and scroll position survives re-renders — 10k+ rows stay smooth.
  Virtual mode ignores grouping/detail rows; `aria-rowcount` reports the true total.

## 0.14.0

Grid parity wave 2.

- Column resizing: `resizable` adds drag handles on header edges (min 48px), persists
  widths across re-renders; emits `aurora-resize`
- Column reordering: `reorderable` makes headers draggable — drop one on another to move
  it; emits `aurora-reorder` with the new field order
- Keyboard cell navigation: roving tabindex over data cells, arrow keys move focus,
  Enter starts editing an editable cell

## 0.13.0

Grid parity wave 1 (Kendo feature chase).

- Multi-column sorting: Shift+click adds/toggles secondary sorts, with order badges
- Global search toolbar (`searchable`) across all visible columns
- Grouping: `grid.groupBy = 'field'` renders collapsible group headers with counts and
  per-group aggregates
- Aggregates: column `aggregate: 'sum'|'avg'|'min'|'max'|'count'` rendered per group and
  in a footer row over the full filtered view
- Inline editing: `editable` grid + per-column `editable` — double-click a cell,
  Enter/blur commits (numbers stay numbers), Escape cancels; emits `aurora-edit`
- Row detail templates: `grid.detail = (row) => html` adds an expander column
- Pager page-size selector via `page-sizes="4,8,16"`
- Column hiding: column `hidden` + `toggleColumn(field)`
- CSV export: `exportable` toolbar button, `toCsv()` / `exportCsv(filename)`

## 0.12.0

Enterprise track begins — see [ENTERPRISE.md](ENTERPRISE.md) for the Kendo-class roadmap.

- `aurora-grid` — the flagship data grid: assign `columns`
  (`title`/`width`/`align`/`sortable`/`filterable`/`formatter`) and `data`, get
  click-to-sort headers cycling asc/desc/off (numeric-aware, `aria-sort`), a per-column
  filter row (`filterable`), paging (`page-size` + pager with range readout), and row
  selection (`selectable="single|multiple"` with checkboxes and select-all). `striped`,
  `dense`, sticky header inside `--aurora-grid-height`, empty state, `refresh()`,
  `selected` getter; emits `aurora-sort` / `aurora-filter` / `aurora-page` /
  `aurora-selection`

## 0.11.0

Command & ambient batch.

- `aurora-command` — a ⌘K command palette: child `<button>`s as commands
  (`data-value`, `data-keywords`), global Cmd/Ctrl+K hotkey (`hotkey` attribute),
  type-to-filter with an empty state, arrow/Enter/Escape keyboard flow, hover-to-activate,
  focus restore, key hints footer; emits `aurora-select`
- `aurora-drawer` — a side panel sliding from the right (or `side="left"`): `open`
  attribute / `show()` / `hide()`, Escape + backdrop close, Tab trap, focus restore
- `aurora-beam` — a luminous beam travelling the border of any card
  (`speed`, `--aurora-beam-color/-color2/-thickness`)
- `aurora-parallax` — children with `data-depth` drift toward the pointer at their own depth
- `aurora-shine` — a soft highlight sweeping across text on a loop
- the modal/drawer focus-trap now lives in a shared `trapTab` helper, exported with
  `FOCUSABLE` from the package root

## 0.10.0

Product UI batch.

- `aurora-menu` — animated, accessible dropdown: child `<button>`s as items (`data-value`,
  `<hr>` separators), arrow-key roving, Home/End, Escape-with-focus-restore, outside-click
  close, `align="end"`; emits `aurora-select`
- `aurora-compare` — before/after slider: `slot="before"` / `slot="after"`, draggable
  divider with a keyboard-accessible handle (`role="slider"`); emits `aurora-change`
- `aurora-flip` — 3D flip card: `slot="front"` / `slot="back"`, `trigger="hover|click|manual"`,
  `flip()`; emits `aurora-flip`
- `aurora-skeleton` — shimmer loading placeholder: block, `circle`, or `lines="n"`
- `aurora-confetti` — celebration cannon on a full-viewport 2D canvas:
  `AuroraConfetti.burst({ x, y, count, colors })`; gravity, drag and spin; self-stopping;
  no-op under `prefers-reduced-motion`

## 0.9.0

Motion utilities batch + toast redesign.

- `aurora-toaster` redesigned: glassmorphic panels with a tinted glow per variant,
  self-drawing icon badges, an optional `title`, and a progress hairline that _is_ the
  timer — hovering pauses both; dismissal now collapses the toast so the stack reflows
- `aurora-carousel` — drag/swipe carousel with GSAP inertia and slide snapping,
  arrow-key support and `next()`/`prev()`/`goTo(i)`; emits `aurora-slide-change`
- `aurora-orbit` — children revolve around optional `slot="center"` content
  (`radius`, `speed`, `reverse`)
- `aurora-glitch` — RGB-split, slice-clipped glitch burst on scroll into view and on
  hover (`hover`, `play()`, `--aurora-glitch-a/-b`)
- `aurora-progress` — fixed scroll-progress hairline for the top of the page

## 0.8.0

Interaction batch.

- `aurora-toaster` — animated toast stack: `show(message, { variant, duration })` on an
  element you place, or `AuroraToaster.show(...)` to use a shared auto-created one;
  toasts spring in, pause their timer on hover, dismiss on click; `position` attribute
  for the four corners; `aria-live` region baked in
- `aurora-spotlight` — the cursor-tracking interior glow + 1px border beam from
  auroralib.com's feature grid, as a wrapper for any card; layers inherit the host's
  border-radius; themed via `--aurora-spotlight-*`
- `aurora-dock` — children magnify as the cursor approaches, macOS-dock style:
  `max`, `range`, `lift`
- `aurora-ripple` — a soft pointer ripple on press, clipped to the host's radius:
  `--aurora-ripple-color`

## 0.7.0

Imagery batch.

- `aurora-lens` — an image that liquifies toward the cursor with a chromatic-aberration
  fringe, rendered by a tiny raw-WebGL shader over a real `<img>` (so accessibility,
  SEO and no-WebGL environments keep the plain image): `src`, `alt`, `strength`,
  `crossorigin`; GPU work defers until visible and rebuilds on context restore
- `aurora-wave` (`aurora/three`) — a wireframe ocean plane displaced by travelling
  sine waves: `color`, `speed`, `amplitude`, `opacity`

## 0.6.0

Accessibility pass.

- All components attach their shadow root with `delegatesFocus`, so `host.focus()`
  reaches the first focusable shadow element and components behave like native controls
- `aurora-tabs` implements the WAI-ARIA tabs keyboard pattern: Arrow keys move and
  select, Home/End jump, and the tab bar keeps a roving tabindex
- `aurora-modal` now moves focus into the dialog on open (first focusable, falling
  back to the panel), traps Tab / Shift+Tab while open, and restores focus to the
  opener on close

## 0.5.0

Text motion batch.

- `aurora-text` now reveals on scroll into view (previously on mount — content already
  in view still animates immediately) and gains `by="chars"` for a per-character rise
  inside word masks, like a display headline; emits `aurora-complete`
- `aurora-scramble` — decodes text through a run of random glyphs, left to right, on
  scroll into view; `hover` replays on pointer enter; `duration`, `chars`, `play()`
- `aurora-typewriter` — types text behind a blinking accent caret on scroll into view;
  `speed` (chars/s), `delay`, `no-caret`, `start()`

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
