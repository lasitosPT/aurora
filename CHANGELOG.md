# Changelog

## 1.1.0

Calendar depth (from the Kendo feature-list audit in DEPTH.md).

- `aurora-calendar` — month/year/decade zoom views (click the title to zoom out, a
  cell to drill in, `start-view` to begin zoomed), `min`/`max` bounds,
  `disabled-dates` lists and a `disabledDate` veto function, ISO `week-numbers`,
  and `hide-other-months`. Everything composing the calendar — datepicker,
  datetimepicker, multiviewcalendar — inherits the upgrades.

## 1.0.0

One-oh. The catalogue is complete.

145 releases after `aurora-button`, the library covers the full enterprise component
catalogue — 126 documented components, every one animated, tested, and demoed live:

- **Data**: grid (remote binding, state persistence, frozen columns, multi-column
  headers, cell selection, column menus, inline + popup edit validation,
  virtualization, CSV + Excel export via an in-house OOXML writer), TreeList,
  PivotGrid, ListView, FileManager, Spreadsheet with an in-house formula engine
- **29 form editors**, all form-associated, tied together by the `aurora-form`
  validation harness
- **Scheduling**: calendar suite, four-view scheduler, drag-editable Gantt
- **Visualization**: nine chart types, chart wizard, four gauges, sparklines,
  node-graph diagram, GeoJSON choropleth map, org chart
- **In-house encoders**: QR (Reed-Solomon), Code 128 — both spec-verified
  bit-for-bit against reference implementations
- **Opt-in entries**: `aurora/three` (3D), `aurora/pdf` (pdf.js viewer)
- **Motion in everything**, GSAP-driven, with a full reduced-motion path

Thank you, platform. Web Components were enough all along.

## 0.96.0

The last box: PDF.

- `aurora-pdfviewer` — on the new opt-in `aurora/pdf` entry, rendering through
  Mozilla's pdf.js exactly like Three.js rides on `aurora/three`: page controls,
  zoom, and download in aurora chrome, with a configurable worker source and an
  injectable pdf module for testing. The Kendo catalogue is now fully covered.

## 0.95.0

Giant three: Map.

- `aurora-map` — an SVG choropleth with no tile servers: GeoJSON polygons project
  onto the canvas, regions shade along an accent value scale with a legend, tooltips
  follow the pointer, clicks select. Ships with docs.

## 0.94.0

Giant two: Diagram.

- `aurora-diagram` — a node-graph canvas: nodes and labeled curved edges with
  arrowheads on SVG, node dragging with live edge updates, background panning,
  wheel zoom, selection, and a `readonly` mode. Ships with docs.

## 0.93.0

The first giant: Spreadsheet.

- `aurora-spreadsheet` — a formula-capable sheet: values and `=SUM(A1:B3)`-style
  formulas (SUM, AVG, MIN, MAX, COUNT, arithmetic with refs and parens) evaluated by
  an in-house recursive-descent engine with circular-reference detection and typed
  errors (#CIRC, #DIV/0, #VALUE). Keyboard-first editing, a formula bar, sticky
  headers, `data` in/out, computed CSV export. The engine (`evaluateFormula`) is
  exported. Ships with docs.

## 0.92.0

Docking.

- `aurora-dockmanager` + `aurora-dockpane` — IDE-style pane docking in five zones:
  drag a pane by its header, zones outline and the hovered one highlights, dropping
  re-docks by slot reassignment so listeners survive; panes collapse from their
  headers. Ships with docs.

## 0.91.0

Drag and drop, generic.

- `aurora-draggable` + `aurora-dropzone` — the primitive pair under sortable,
  taskboard, and tile drag, now public: wrap anything to drag it, zones hit-test and
  highlight while a compatible payload hovers (`accept`/`type` matching), and drops
  deliver `{ data, draggable }`. Ships with docs.

## 0.90.0

Charts, configured interactively.

- `aurora-chartwizard` — point it at flat rows: a composed segmented control picks
  the type, selects pick category/value/compare fields (types auto-detected), and a
  live chart preview updates on every change; read `config` or listen for
  `aurora-change`. Ships with docs.

## 0.89.0

The composition showcase.

- `aurora-filemanager` — a file browser assembled from aurora parts: breadcrumb
  path, folder treeview, and a tile grid with type icons and sizes; navigate by
  tree, crumb, or double-click, open files with full paths. Ships with docs.

## 0.88.0

Image editing.

- `aurora-imageeditor` — open a file or pass `src`, rotate in quarter turns, flip
  either axis, adjust brightness/contrast/saturation live on canvas, reset, and
  export as a data URL or download. Ships with docs.

## 0.87.0

The long tail.

- `aurora-captcha` — a client-side challenge: distorted canvas glyphs with noise,
  refresh, verify-as-you-type, form association (honest docs: pair with a server
  check for anything that matters)
- `aurora-speechbutton` — press-to-talk via the Web Speech API, streaming transcripts
  into a target input; renders disabled where unsupported
- `createDataSource()` — a tiny fetch adapter turning grid view state into query
  params and responses into `{ rows, total }` — server-side paging without a
  framework. All ship with docs.

## 0.86.0

Filter expressions.

- `aurora-filterbuilder` — the standalone Filter: field/operator/value rules with
  ALL-ANY logic, add and remove, typed operator sets (string vs number), and an
  evaluator (`test(row)` / `apply(rows)`) so the expression is directly usable.
  Ships with docs.

## 0.85.0

Object inspection.

- `aurora-propertygrid` — assign an object and get an inspector: editors inferred
  from value types (text, number, checkbox, color) or declared explicitly with
  selects and group headers; edits mutate the object and emit `aurora-change`.
  Ships with docs.

## 0.84.0

Funnels and needles.

- `aurora-chart` — `funnel` and `pyramid` types: centered stage bands with inline
  labels, category legends, and band hover tooltips with percentages
- `aurora-gauge` — `radial` type: a ticked dial with an animated needle that sweeps
  to the value.

## 0.83.0

Queue clearing.

- `aurora-multiviewcalendar` — consecutive months side by side (composed calendars)
  under one shared navigation, selecting across views; form-associated
- `aurora-responsivepanel` — inline content that collapses into an off-canvas ☰ panel
  below a breakpoint
- `aurora-pager` — standalone pagination with windowed numbers and ellipses.
  All ship with docs.

## 0.82.0

Grid wave 6.

- `aurora-grid` — `getState()`/`setState()` snapshot and restore the whole view
  (sorts, filters, operators, search, page, widths, hidden columns, grouping);
  `selectable="cell"` selects cells with Ctrl/⌘ multi-select; `column-menu` puts a
  sort/hide/freeze menu on every header.

## 0.81.0

The AI interface, backend-agnostic.

- `aurora-promptbox` — suggestion chips, an auto-growing composer, shimmer lines
  while `busy`, and an output view with Copy and Retry; wire `aurora-send` to any
  model and set `output` when it answers
- `aurora-smartpaste` — one click reads the clipboard and distributes emails, phones,
  URLs, dates, postal codes, and names into named fields by heuristics, or defer to a
  custom `map` function. Both ship with docs.

## 0.80.0

Kanban.

- `aurora-taskboard` — columns of draggable cards: drag within and across columns
  with target highlighting and midpoint insertion, move the focused card with
  Ctrl/⌘ + arrows, per-card accent colors and tags, counts and empty states.
  `move(cardId, col, index?)` is public; emits `aurora-move`. Ships with docs.

## 0.79.0

Gap closing, round one.

- `aurora-checkboxgroup` — composed checkboxes from options with a `values` set and
  one FormData entry per checked value
- `aurora-togglebutton` — a two-state button: `pressed` reflected, aria-pressed,
  pop on flip, form-associated. Both ship with docs.

## 0.78.0

Popup editing.

- `aurora-grid` — `editable="popup"` swaps inline cell editing for a row dialog:
  every editable column becomes a labeled field, validators show per-field errors and
  block saving, Cancel/Escape discard, and commits emit `aurora-edit` per changed
  field. `openPopupEdit(row)` is public. Menu keydown handling around submenus
  simplified.

## 0.77.0

Flyouts.

- `aurora-menu` grows `<aurora-submenu>` flyouts: hover or ArrowRight opens the side
  panel, ArrowLeft/Escape steps back without closing the parent, selections bubble up
  as a single `aurora-select`, and the top-level roving includes submenu triggers.

## 0.76.0

Gantt editing.

- `aurora-gantt` — drag a bar to move the task in day snaps, or drag its right-edge
  grip to resize (clamped at the start date); commits update the task and emit
  `aurora-update`. `readonly` disables editing; clicks still select.

## 0.75.0

Grid wave 5.

- `aurora-grid` — column `validator` functions gate in-cell edits: bad values keep the
  editor open with a red ring and an inline error bubble and emit `aurora-invalid`
  instead of committing; column `group` strings render spanning multi-column header
  groups (frozen-aware).

## 0.74.0

Media.

- `aurora-videoplayer` — aurora chrome over `<video>`: click-anywhere play/pause with
  a center badge, an accent seek bar (drag, click, arrow keys), time readout, volume
  scrubber, mute, and fullscreen, all auto-hiding during playback. Ships with docs.

## 0.73.0

Palettes and durations.

- `aurora-colorpalette` — a fixed swatch grid with two-dimensional arrow roving,
  check-marked selection, and form association; completes the color suite alongside
  the HSV `aurora-colorpicker`
- `aurora-durationpicker` — hh:mm:ss segments with auto-advance, wrapping arrow
  increments, `no-seconds` mode, a total-`seconds` getter, and `HH:MM:SS` form
  submission. Both ship with docs.

## 0.72.0

Who reports to whom.

- `aurora-orgchart` — an organization chart from nested nodes: cards compose
  `aurora-avatar` initials with names and titles, pure-CSS connectors draw the
  reporting lines, branches collapse into a +N pill, and clicking a person emits
  `aurora-select`. Ships with docs.

## 0.71.0

Tabular picking.

- `aurora-multicolumncombobox` — a combobox whose dropdown is a mini table: columns
  and rows, typing filters across every column with highlighted matches,
  `text-field`/`value-field` mapping on commit. Form-associated. Ships with docs.

## 0.70.0

Component one hundred.

- `aurora-dropdowntree` — a select whose popup is a full composed
  `<aurora-treeview>`: nested items, branch or leaf picks, Escape close, placeholder
  field, form association. The catalogue crosses one hundred components. Ships with
  docs.

## 0.69.0

Navigation and precise dates.

- `aurora-bottomnav` — a frosted bottom navigation bar: one active item with an icon
  pop, arrow-key movement, tablist semantics
- `aurora-dateinput` — segmented date typing: dd/mm/yyyy spinbutton cells with digit
  auto-advance, arrow increments, Backspace clearing, and impossible-date rejection.
  ISO value, form-associated. Both ship with docs.

## 0.68.0

Mobile actions.

- `aurora-fab` — a floating action button that speed-dials: options spring out with
  hover labels, the + rotates to ×, Escape closes
- `aurora-actionsheet` — a bottom sheet of actions with a grab handle, danger items,
  backdrop/Escape/cancel close, a shadow-aware focus trap, and focus restore.
  Both ship with docs.

## 0.67.0

Rich text.

- `aurora-editor` — a rich text editor over contenteditable: bold, italic, underline,
  strikethrough, headings, quotes, bullet and numbered lists, links, and clear
  formatting, with active-state toolbar buttons, ⌘/Ctrl shortcuts, a placeholder, and
  HTML in/out through `value`. Form-associated; emits `aurora-change` while typing.
  Ships with docs.

## 0.66.0

The last data rock: PivotGrid.

- `aurora-pivotgrid` — cross flat data into a matrix: one or two row fields (two-level
  rows collapse under subtotal groups), a pivot column field, a measure, and
  sum/avg/count/min/max aggregation, with row totals, column totals, and a grand
  total. Sticky headers both ways; emits `aurora-select` with the clicked
  intersection. Ships with docs.

## 0.65.0

Project timelines.

- `aurora-gantt` — day columns across the task span, bars with sweeping progress
  fills, right-angle dependency arrows with arrowheads, a today line, a frozen task
  column beside a scrollable chart, and `aurora-select` on bar clicks. Ships with
  docs.

## 0.64.0

Barcodes.

- `aurora-barcode` — Code 128 with an in-house encoder: code set B, automatic code set
  C for even digit payloads, mod-103 checksum, crisp SVG bars with a quiet zone and
  the value printed underneath. Verified bit-for-bit against the python-barcode
  reference across both code sets, with the reference strings locked into the test
  suite. `encodeCode128()` is exported. Ships with docs.

## 0.63.0

The header.

- `aurora-appbar` — a sticky frosted-glass application header with start/center/end
  slots, an elevation shadow that appears on scroll, and `hide-on-scroll` (slides away
  going down, returns going up). Ships with docs.

## 0.62.0

Dashboards.

- `aurora-tilelayout` + `aurora-tile` — a dashboard grid: tiles span cells via
  `colspan`/`rowspan`, drag one by its header and the others FLIP out of the way in
  two dimensions. Emits `aurora-reorder` with the new order. Ships with docs.

## 0.61.0

Scheduler views.

- `aurora-scheduler` grows `day`, `month`, and `agenda` views alongside `week`: a
  single-column day grid, calendar cells with event chips and a "+N more" tail, and a
  grouped fourteen-day agenda list. The toolbar switches views inline and pages by the
  view's unit; `aurora-range` now reports `{ start, view }`.

## 0.60.0

Chart types wave.

- `aurora-chart` grows `area` (filled line), `pie` (full disc with slice-percentage
  tooltips), `scatter` (scale-in points), and `stacked` bars (column-sum scaling).
  Donut and pie now legend by category labels and answer hover with the slice value
  and percentage.

## 0.59.0

Tools in a row.

- `aurora-toolbar` — WAI-ARIA toolbar with arrow-key roving, `<hr>` separators, and
  responsive overflow: items that no longer fit are reassigned into a "⋯" panel via
  slot switching (no DOM moves, so their event listeners survive). Ships with docs.

## 0.58.0

The validation harness.

- `aurora-form` — wraps any mix of aurora's twenty form-associated editors: a `rules`
  map (required, min/max, pattern, email, custom fn) plus `required` attributes,
  shaking inline error messages injected under offending fields with `role="alert"`,
  focus jumped to the first error, touched fields re-validating as they change, and
  `aurora-submit`/`aurora-invalid` events carrying the collected data or the error
  map. Ships with docs.

## 0.57.0

Date and time, one field.

- `aurora-datetimepicker` — a composed `<aurora-calendar>` and a `step`-minute time
  column in one popup; picking both halves commits `YYYY-MM-DDTHH:MM`, closes, and
  emits `aurora-change`. Partial state shows in the field as it builds.
  Form-associated. Ships with docs.

## 0.56.0

Transfer lists.

- `aurora-listbox` — an orderable list with a toolbar (move up/down, remove) that can
  `connect` to another listbox: transfer the selection with the arrow button or a
  double-click, arriving items slide in. Emits `aurora-change` on reorder/remove and
  `aurora-transfer` on moves. Ships with docs.

## 0.55.0

Type or pick.

- `aurora-combobox` — a text input married to a dropdown: type to filter with
  highlighted matches, pick with arrows/Enter/click, and with `allow-custom` any free
  text commits as the value (flagged `custom` in the event). Options from `<option>`
  children or the `options` property; form-associated. Ships with docs.

## 0.54.0

Ranges.

- `aurora-rangeslider` — dual thumbs that can't cross, track clicks move the nearest
  thumb, arrows/Home/End step with `step` snapping, live value readouts, and
  form association as `name-start`/`name-end`. Emits `aurora-change` with
  `{ start, end }`. Ships with docs.

## 0.53.0

Long-form text.

- `aurora-textarea` — auto-grows with its content (no scrollbar jumps), live
  character counter against `maxlength` with an over-limit state, label, seeded
  `value`, `resizable` opt-in, form-associated, and `input`/`change` re-emitted
  across the shadow boundary. Ships with docs.

## 0.52.0

The missing primitives.

- `aurora-checkbox` — form-associated, drawn-on check, `indeterminate` (mixed) state,
  Space/click toggling with a spring, disabled support
- `aurora-radiogroup` — WAI-ARIA radio group from `<option>` children: roving
  tabindex, arrows move and select with wrap-around, popping dots, `inline` layout.
  Both ship with docs.

## 0.51.0

Right-click.

- `aurora-contextmenu` — attach to any element via `for`; opens at the cursor clamped
  to the viewport, items from `<option value icon>` children with `<hr>` separators
  and disabled states, arrow-key navigation, Escape/outside close, and
  `aurora-select` carrying the right-clicked context element. Ships with docs.
- ENTERPRISE.md refreshed to the true catalogue state.

## 0.50.0

Grid wave 4 + npm.

- `aurora-grid` — frozen columns (`frozen: true` floats them left and pins them with
  computed sticky offsets, utility columns included), per-column filter operator menus
  (contains / equals / starts with / greater / less — cycle the ≈ button or call
  `setFilterOp()`), and Excel export: `toExcel()`/`exportExcel()` build a real .xlsx
  through an in-house, dependency-free OOXML + ZIP writer (validated with openpyxl).
- Published surface renamed to `@lasitospt/aurora`; README gains a full catalogue table.

## 0.49.0

Waiting, beautifully.

- `aurora-loader` — indeterminate spinners: ring, dots, pulse; labeled, sized by a
  var, `role="status"`, slowed (not frozen) under reduced motion
- `aurora-progressbar` — a determinate bar whose fill tweens to every `value` change
  with a live percentage readout, plus a sweeping `indeterminate` mode. Both ship
  with docs.

## 0.48.0

Conversational UI.

- `aurora-chat` — a conversation view: me/them bubbles with composed `aurora-avatar`
  initials, names and times, a bouncing typing indicator behind the `typing`
  attribute, auto-scroll, spring-in message entrances, and a composer that
  locally echoes and emits `aurora-send`. Feed history via `messages`, append with
  `add()`. Ships with docs.

## 0.47.0

Drag to reorder.

- `aurora-sortable` — wraps any children in a drag-to-reorder list: pointer drags lift
  the item (scale + shadow) while siblings FLIP out of the way, keyboard users move the
  focused item with Ctrl/⌘ + arrows, `move(from, to)` reorders programmatically, and
  every change emits `aurora-reorder`. Ships with docs.

## 0.46.0

Lists, templated.

- `aurora-listview` — a data-bound list: assign `data` and a `template` (row → HTML),
  rows stagger in, paging via `page-size`, single/multiple selection with listbox ARIA
  and arrow/Enter keyboard support. Emits `aurora-select` with the chosen rows.
  Ships with docs.

## 0.45.0

Ink.

- `aurora-signature` — a signature pad: pointer strokes captured into a fixed 400×160
  coordinate space, smoothed with quadratic midpoints, rendered as SVG. Form-associated
  (submits an image/svg+xml data URL), `clear()`/`undo()` (with Ctrl+Z),
  `addStroke()` for restoring saved ink, `toSvg()`/`toDataUrl()`, a `signed` reflected
  attribute, dashed baseline and hint. Ships with docs.

## 0.44.0

Guided flows.

- `aurora-wizard` + `aurora-wizard-step` — a multi-step flow composing `aurora-stepper`
  for progress: direction-aware animated transitions, Back/Next/Finish chrome with
  custom labels, jump-back via the stepper dots (or free jumps with `linear="false"`),
  a cancelable `aurora-next` validation gate, and `aurora-change`/`aurora-finish`
  events. Ships with docs.

## 0.43.0

Milestones.

- `aurora-timeline` + `aurora-timeline-item` — a vertical milestone timeline: gradient
  spine that draws itself on scroll into view, dots that pop, cards that slide in per
  item. Dates, headings, slotted bodies, per-item dot colors, list semantics, full
  reduced-motion path. Ships with docs.

## 0.42.0

The last big rock: TreeList.

- `aurora-treelist` — a hierarchical data grid. Takes nested `children` arrays or flat
  id/parentId rows (`id-field`/`parent-field`), renders a treegrid with animated
  expand/collapse and staggered child reveals, sorts sibling groups recursively without
  breaking the hierarchy, navigates with arrow keys (down/up rows, right/left
  expand/collapse), and supports row selection. `expandAll()`/`collapseAll()`,
  `aurora-toggle`/`aurora-sort`/`aurora-select`, proper aria-level/aria-expanded.
  Ships with docs.

## 0.41.0

Identity chrome.

- `aurora-avatar` — image avatars that degrade gracefully to initials on a gradient
  derived deterministically from the name; status dot, square variant, size var
- `aurora-badge` — notification badges: overlaid count pill on wrapped content or an
  inline standalone pill, "99+" capping, zero-hiding, dot mode, tones, and a pop on
  count changes. Both ship with docs.

## 0.40.0

QR codes, from scratch.

- `aurora-qrcode` — a dependency-free QR renderer with the encoder written in-house:
  byte mode, versions 1-10, all four EC levels, Reed-Solomon over GF(256), block
  interleaving, and spec mask scoring. Output verified bit-for-bit against the
  reference python-qrcode implementation across texts, levels, and all eight masks.
  Renders as crisp SVG with a proper quiet zone, scales into view, emits
  `aurora-error` on capacity overflow. The raw `encodeQr()` is exported too.

## 0.39.0

Color.

- `aurora-colorpicker` — an HSV picker: CSS-gradient saturation/value area and hue strip
  (no canvas), draggable and keyboard-adjustable handles, hex field with garbage
  rejection, live preview, optional swatch presets with a pop on pick. Emits
  `aurora-change` with the 6-digit hex and is form-associated via ElementInternals.
  Ships with docs.

## 0.38.0

The button family.

- `aurora-buttongroup` — a segmented control from `<option>`s: one active segment with
  aria-pressed and a pop on change; emits `aurora-change`
- `aurora-splitbutton` — a primary action with an attached dropdown of alternatives:
  main emits `aurora-click`, menu items emit `aurora-select`, Escape/outside close.
  Both ship with docs.

## 0.37.0

Gauges.

- `aurora-gauge` — one element, three gauges: `arc` (semi-circle, default), `circular`
  (full ring), `linear` (bar). SVG-rendered with a rounded track, the value sweeps in on
  scroll into view and re-tweens on `value` changes; `min`/`max`, center number with
  `unit` and `label`, `role="meter"` with live aria values; themed via
  `--aurora-gauge-color/-track`. Ships with docs.

## 0.36.0

- `aurora-daterange` — a date-range picker: one popup month grid, first click sets the
  start and the second the end (auto-swapped if reversed), the span highlighted with
  shaped edge days and a state hint; form-associated with `name-start`/`name-end`
  entries; emits `aurora-change` with `{ start, end }`. Ships with docs.

## 0.35.0

The scheduler capstone.

- `aurora-scheduler` — a week-view scheduler: Monday-first day columns over configurable
  hour rows (`start-hour`/`end-hour`, `slot-height`), events positioned by time with
  per-event accent colors and staggered entrances, today highlighting, week paging with
  a live range title; `events` ({ title, start, end, color? }[] ISO datetimes); emits
  `aurora-select` and `aurora-range`. Ships with docs.

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
