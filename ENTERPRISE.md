# aurora enterprise track

A Kendo-class component catalogue, built one component at a time on aurora's core
(Web Components + GSAP, CSS-variable theming, WAI-ARIA keyboard patterns, MIT).
Each ships with its full option surface, tests, and a live demo on
[auroralib.com](https://auroralib.com).

Legend: ✅ shipped · 🔶 partial (aurora equivalent exists) · ⬜ planned

## Data Management

| Component                                                                                                                            | Status | aurora element                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------- |
| Data Grid (multi-sort, filter, search, paging, selection, grouping, aggregates, inline edit, detail rows, column hiding, CSV export) | ✅     | `aurora-grid`                                                    |
| TreeList / PivotGrid / Spreadsheet / PropertyGrid                                                                                    | ⬜     | grid next: virtualization, column resize/reorder, frozen columns |
| Filter / Pager (standalone)                                                                                                          | 🔶     | built into `aurora-grid`                                         |
| ListView                                                                                                                             | ⬜     |                                                                  |

## Editors

| Component                                            | Status | aurora element                           |
| ---------------------------------------------------- | ------ | ---------------------------------------- |
| TextBox / TextArea                                   | 🔶     | `aurora-input`                           |
| Switch / Checkbox / RadioGroup                       | 🔶     | `aurora-switch` (checkbox/radio planned) |
| Slider / RangeSlider                                 | 🔶     | `aurora-slider` (range planned)          |
| AutoComplete / ComboBox / DropDownList / MultiSelect | ⬜     | next up                                  |
| NumericTextBox / MaskedTextBox / OTP Input           | ⬜     |                                          |
| DatePicker / DateInput / TimePicker / DateTimePicker | ⬜     |                                          |
| ColorPicker / ColorGradient                          | ⬜     |                                          |
| Rating / Signature / Rich Text Editor                | ⬜     |                                          |

## Scheduling

Calendar → DateRangePicker → Scheduler → Gantt: ⬜ (after the editor batch)

## Navigation

Button ✅ · Menu ✅ · Drawer ✅ · TreeView ⬜ · Stepper/Wizard ⬜ · Breadcrumb ⬜ ·
AppBar/Toolbar ⬜ · Chip/ChipList ⬜ · ButtonGroup/SplitButton ⬜

## Layout

Dialog ✅ (`aurora-modal`) · Tooltip ✅ · TabStrip ✅ (`aurora-tabs`) ·
ExpansionPanel ✅ (`aurora-accordion`) · Notification ✅ (`aurora-toaster`) ·
Card ✅ (`aurora-spotlight`/`aurora-beam`) · Splitter ⬜ · Window ⬜ ·
PopOver ⬜ · TileLayout ⬜ · Timeline ⬜ · Form ⬜

## Interactivity & UX

Loader/ProgressBar 🔶 (`aurora-progress`, `aurora-skeleton`) · Ripple ✅ ·
Sortable / Drag-and-Drop ⬜ · TaskBoard ⬜ · CircularProgressBar ⬜

## Charts & Visualization

Sparklines → Charts (bar/line/donut) → Gauges → Map/Diagram: ⬜
(canvas-rendered, on a separate `aurora/charts` entry like `aurora/three`)

## Media / Files / Misc

Upload ⬜ · ScrollView ✅ (`aurora-carousel`) · QRCode ⬜ · PDF Viewer ⬜ · Chat ⬜

## Build order

1. **`aurora-grid`** — the flagship (this release)
2. Dropdown editors: `aurora-select` (DropDownList), `aurora-autocomplete`, `aurora-multiselect`
3. Date/time: `aurora-calendar`, `aurora-datepicker`, `aurora-timepicker`
4. Inputs: `aurora-numeric`, `aurora-masked`, `aurora-otp`, `aurora-rating`, checkbox/radio groups
5. `aurora-treeview`, `aurora-stepper`, `aurora-breadcrumb`, chips
6. `aurora-upload`, `aurora-splitter`, `aurora-window`, popover
7. Charts entry: sparkline → bar/line/donut → gauges
8. `aurora-scheduler` + calendar suite capstone
