# aurora enterprise track

A Kendo-class component catalogue, built one component at a time on aurora's core
(Web Components + GSAP, CSS-variable theming, WAI-ARIA keyboard patterns, MIT).
Each ships with its full option surface, tests, and a
[documentation & tutorial page](https://auroralib.com/docs.html).

Legend: ✅ shipped · 🔶 partial (aurora equivalent exists) · ⬜ open

## Data Management

| Component                                                                                                                                                                                           | Status | aurora element                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------- |
| Data Grid — multi-sort, operator filters, search, paging, selection, grouping, aggregates, inline edit, detail rows, column hide/resize/reorder, frozen columns, virtualization, CSV + Excel export | ✅     | `aurora-grid`                       |
| TreeList (hierarchical grid, flat or nested data, sibling-group sorting)                                                                                                                            | ✅     | `aurora-treelist`                   |
| ListView (templated rows, paging, selection)                                                                                                                                                        | ✅     | `aurora-listview`                   |
| Filter / Pager (standalone)                                                                                                                                                                         | 🔶     | built into grid, treelist, listview |
| PivotGrid / Spreadsheet / PropertyGrid                                                                                                                                                              | ⬜     |                                     |

## Editors

| Component                                  | Status | aurora element                                     |
| ------------------------------------------ | ------ | -------------------------------------------------- |
| TextBox / TextArea                         | 🔶     | `aurora-input`                                     |
| Switch / Checkbox / RadioGroup             | 🔶     | `aurora-switch`, `aurora-buttongroup`              |
| Slider / RangeSlider                       | 🔶     | `aurora-slider` (range planned)                    |
| AutoComplete / DropDownList / MultiSelect  | ✅     | `aurora-autocomplete` / `-select` / `-multiselect` |
| NumericTextBox / MaskedTextBox / OTP Input | ✅     | `aurora-numeric` / `-masked` / `-otp`              |
| Calendar / DatePicker / TimePicker         | ✅     | `aurora-calendar` / `-datepicker` / `-timepicker`  |
| DateRangePicker                            | ✅     | `aurora-daterange`                                 |
| ColorPicker                                | ✅     | `aurora-colorpicker`                               |
| Rating / Signature                         | ✅     | `aurora-rating` / `aurora-signature`               |
| Rich Text Editor                           | ⬜     |                                                    |

## Scheduling

Calendar ✅ · DateRangePicker ✅ · Scheduler ✅ (`aurora-scheduler`, week view) · Gantt ⬜

## Navigation

Button ✅ · ButtonGroup/SplitButton ✅ · Menu ✅ · Drawer ✅ · TreeView ✅ ·
Stepper ✅ · Wizard ✅ · Breadcrumb ✅ · Chip/ChipList ✅ (`aurora-chips`) ·
ContextMenu ✅ · AppBar/Toolbar ⬜

## Layout

Dialog ✅ (`aurora-modal`) · Tooltip ✅ · TabStrip ✅ (`aurora-tabs`) ·
ExpansionPanel ✅ (`aurora-accordion`) · Notification ✅ (`aurora-toaster`) ·
Card ✅ (`aurora-spotlight`/`aurora-beam`) · Splitter ✅ · Window ✅ ·
PopOver ✅ · Avatar/Badge ✅ · Timeline ✅ · TileLayout ⬜ · Form ⬜

## Interactivity & UX

Loader ✅ · ProgressBar ✅ (`aurora-progressbar`; scroll hairline: `aurora-progress`) ·
Skeleton ✅ · Ripple ✅ · Sortable / Drag-and-Drop ✅ (`aurora-sortable`) ·
TaskBoard 🔶 (compose `aurora-sortable`) · CircularProgressBar ✅ (`aurora-gauge type="circular"`)

## Charts & Visualization

Sparkline ✅ · Chart (bar / multi-line / donut) ✅ · Gauges (arc / circular / linear) ✅ ·
Map / Diagram / OrgChart ⬜

## Media / Files / Misc

Upload ✅ · ScrollView ✅ (`aurora-carousel`) · QRCode ✅ (in-house encoder) ·
Chat ✅ · PDF Viewer ⬜

## Remaining candidates

PivotGrid · Gantt · Rich Text Editor · AppBar/Toolbar · TileLayout ·
Form (validation harness) · Map/Diagram · PDF Viewer
