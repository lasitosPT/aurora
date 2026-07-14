# aurora enterprise track — Kendo UI parity audit

Audited 2026-07-14 against the full Kendo UI for jQuery catalogue.
Legend: ✅ dedicated component · 🔶 covered by an equivalent · ⬜ open · 🚫 out of scope (reason given)

## AI Interface

| Kendo                                  | Status | aurora                                                                                        |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| AIPrompt / Inline AIPrompt / PromptBox | ✅     | `aurora-promptbox` (chips + composer + busy shimmer + output w/ copy/retry; backend-agnostic) |
| SmartPasteButton                       | ✅     | `aurora-smartpaste` (heuristic clipboard → named-field mapping, custom `map` override)        |

## Navigation

ActionSheet ✅ · AppBar ✅ · BottomNavigation ✅ · Breadcrumb ✅ · Button ✅ ·
ButtonGroup ✅ · Chip/ChipList ✅ (`aurora-chips`) · Drawer ✅ ·
DropDownButton 🔶 (`aurora-menu` / `aurora-splitbutton`) · FAB ✅ · Menu ✅ (+ `aurora-submenu` flyouts) ·
Segmented Control 🔶 (`aurora-buttongroup` is one) · SpeechToText Button ✅ (`aurora-speechbutton`) ·
SplitButton ✅ · Stepper ✅ · ToggleButton ✅ · Toolbar ✅ · TreeView ✅ · Wizard ✅

## Data Management

| Kendo                          | Status | aurora                                                               |
| ------------------------------ | ------ | -------------------------------------------------------------------- |
| Data Grid                      | ✅     | `aurora-grid` — feature depth audited below                          |
| TreeList                       | ✅     | `aurora-treelist`                                                    |
| ListView                       | ✅     | `aurora-listview`                                                    |
| PivotGrid / PivotGrid v2       | ✅     | `aurora-pivotgrid`                                                   |
| Filter (standalone builder UI) | ✅     | `aurora-filterbuilder` (ALL/ANY rules + built-in evaluator)          |
| Pager (standalone)             | ✅     | `aurora-pager` (windowed numbers + ellipses)                         |
| PropertyGrid                   | ✅     | `aurora-propertygrid` (type-inferred editors, groups, explicit defs) |
| FileManager                    | ✅     | `aurora-filemanager` (breadcrumb + treeview + tile grid composition) |
| Spreadsheet                    | 🚫     | a formula engine is a product of its own                             |

## File Management / Bar codes / Documents

Upload ✅ · QRCode ✅ (in-house encoder, spec-verified) · BarCode ✅ (in-house Code 128, spec-verified;
other symbologies ⬜) · PDF Viewer 🚫 (needs a pdf.js-scale rendering engine)

## Diagrams and Maps

OrgChart ✅ · Diagram 🚫 (free-form node-graph editor is a product of its own) ·
Map 🚫 (needs tile providers / geo services — against the zero-dependency principle)

## Charts

Charts ✅ (`aurora-chart`: bar / stacked bar / line / area / donut / pie / scatter / funnel / pyramid) ·
Sparklines ✅ · Pyramid Chart ✅ (funnel + pyramid types) · Chart Wizard ✅ (`aurora-chartwizard`) ·
Gauges: Arc ✅ / Circular ✅ / Linear ✅ / Radial ✅ (ticked dial + needle)

## Conversational UI / Media

Chat ✅ · MediaPlayer ✅ (`aurora-videoplayer`) · ScrollView ✅ (`aurora-carousel`)

## Editors

AutoComplete ✅ · Checkbox ✅ · CheckBoxGroup ✅ · ColorGradient/ColorPicker ✅ · ColorPalette ✅ ·
ComboBox ✅ · DateInput ✅ · DatePicker ✅ · DateTimePicker ✅ · DropDownList ✅ (`aurora-select`) ·
DropDownTree ✅ · ListBox ✅ · MaskedTextBox ✅ · MultiColumnComboBox ✅ · MultiSelect ✅ ·
NumericTextBox ✅ · OTP ✅ · RadioButton 🔶 / RadioGroup ✅ · RangeSlider ✅ · Rating ✅ ·
Rich Text Editor ✅ · Signature ✅ · Slider ✅ · Switch ✅ · TextArea ✅ · TextBox ✅ ·
TimeDurationPicker ✅ · TimePicker ✅ · Validator ✅ (`aurora-form`) ·
Captcha ✅ (`aurora-captcha`, client-side; docs say pair with server checks) ·
ImageEditor ✅ (`aurora-imageeditor`: rotate/flip/filters/export; crop ⬜)

## Scheduling

Calendar ✅ · DateRangePicker ✅ · Scheduler ✅ (day/week/month/agenda) ·
Gantt ✅ (drag-move + grip-resize) · MultiViewCalendar ⬜ (planned: paired-month calendar)

## Layout

Avatar ✅ · Badge ✅ · Card ✅ · Dialog ✅ · ExpansionPanel ✅ · Form ✅ · Notification ✅ ·
PanelBar 🔶 (`aurora-accordion`) · PopOver ✅ · Popup 🔶 (popover/menu primitives) ·
ResponsivePanel ✅ (`aurora-responsivepanel`) · Ripple ✅ · Splitter ✅ ·
TabStrip ✅ · TileLayout ✅ · Timeline ✅ · Tooltip ✅ · Window ✅ ·
DockManager 🔶 (splitter + window + tilelayout compose most of it; dedicated manager ⬜)

## Interactivity & UX

CircularProgressBar ✅ (`aurora-gauge type="circular"`) · Drag and Drop 🔶 (sortable/taskboard/tile drag;
generic draggable primitive ⬜) · Effects 🔶 (the motion components + GSAP re-export) · Loader ✅ ·
ProgressBar ✅ · Skeleton ✅ · Sortable ✅ · TaskBoard ✅ (`aurora-taskboard`)

## Framework (Kendo's jQuery-era infrastructure)

| Kendo           | aurora's answer                                                                        |
| --------------- | -------------------------------------------------------------------------------------- |
| DataSource      | ✅ `createDataSource()` — fetch adapter: grid state → query params → { rows, total }   |
| Templates       | ✅ formatter/template functions (grid, listview, timeline bodies)                      |
| Touch           | ✅ pointer events throughout — mouse/touch/pen unified                                 |
| MVVM            | 🚫 N/A — properties + events are the Web Components contract; frameworks bind natively |
| Drawing API     | 🚫 canvas/SVG drawing library is out of scope                                          |
| PDF Export      | 🚫 CSV + Excel export are in-house; PDF needs a layout engine                          |
| Single-Page App | 🚫 N/A — routing belongs to the host app                                               |

## Grid feature-depth audit (vs Kendo's grid feature list)

| Kendo grid feature  | aurora-grid status                                                                    |
| ------------------- | ------------------------------------------------------------------------------------- |
| Data binding        | 🔶 local arrays; remote DataSource adapter ⬜                                         |
| Editing             | ✅ inline + popup + per-column validators; batch queue ⬜, custom editor renderers ⬜ |
| Filtering           | ✅ filter row + 5 operators + global search; checkbox/menu filter UI ⬜               |
| Grouping            | ✅ groupBy + collapsible + per-group aggregates; load-on-demand 🚫 (server concern)   |
| Paging              | ✅ client-side + page sizes; server paging waits on the DataSource adapter            |
| Sorting             | ✅ single + multi (Shift+click) with order badges                                     |
| Export              | ✅ CSV + Excel (in-house OOXML writer); PDF/print 🚫                                  |
| Column enhancements | ✅ frozen/locked, resize, reorder, hide, multi-column headers, column menu            |
| State persistence   | ✅ getState()/setState() JSON snapshots                                               |
| Hierarchy           | ✅ detail templates; nested child grids compose via detail; also `aurora-treelist`    |
| Templates           | ✅ formatters + detail templates; row/group templates 🔶                              |
| Scroll modes        | ✅ virtualization (10k rows < 100 nodes); endless remote scroll waits on DataSource   |
| Selection           | ✅ single/multi row, checkbox column, select-all, cell selection w/ Ctrl multi        |
| Rendering/styling   | ✅ striped/dense/height/theming; adaptive mobile rendering ⬜                         |
| Globalization       | ⬜ en-only; RTL untested                                                              |
| Accessibility       | ✅ ARIA grid roles, aria-sort, keyboard cell navigation; full screen-reader audit ⬜  |

## Build queue (from this audit)

1. `aurora-promptbox` (AI Interface starter) + SmartPasteButton
2. Grid: `getState()`/`setState()`, column menu, cell selection, DataSource adapter
3. `aurora-multiviewcalendar`, `aurora-responsivepanel`, standalone `aurora-pager`
4. Chart: pyramid/funnel types; gauge needle variant
5. `aurora-propertygrid`, `aurora-filterbuilder`, `aurora-captcha`, `aurora-imageeditor`, SpeechToText button
6. FileManager composition showcase
