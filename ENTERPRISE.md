# aurora enterprise track

A Kendo-class component catalogue, built one component at a time on aurora's core
(Web Components + GSAP, CSS-variable theming, WAI-ARIA keyboard patterns, MIT).
Each ships with its full option surface, tests, and a
[documentation & tutorial page](https://auroralib.com/docs.html).

Legend: ✅ shipped · 🔶 partial (aurora equivalent exists) · ⬜ open

## Data Management

| Component                                                                                                                                                                                                                                                      | Status | aurora element                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------- |
| Data Grid — multi-sort, operator filters, search, paging, selection, grouping, aggregates, inline edit, detail rows, column hide/resize/reorder, frozen columns, multi-column headers, inline + popup edit with validation, virtualization, CSV + Excel export | ✅     | `aurora-grid`                       |
| TreeList (hierarchical grid, flat or nested data, sibling-group sorting)                                                                                                                                                                                       | ✅     | `aurora-treelist`                   |
| ListView (templated rows, paging, selection)                                                                                                                                                                                                                   | ✅     | `aurora-listview`                   |
| Filter / Pager (standalone)                                                                                                                                                                                                                                    | 🔶     | built into grid, treelist, listview |
| PivotGrid (two-level rows, five aggregates, totals)                                                                                                                                                                                                            | ✅     | `aurora-pivotgrid`                  |
| Spreadsheet / PropertyGrid                                                                                                                                                                                                                                     | ⬜     |                                     |

## Editors

| Component                                  | Status | aurora element                                     |
| ------------------------------------------ | ------ | -------------------------------------------------- |
| TextBox / TextArea                         | ✅     | `aurora-input` / `aurora-textarea`                 |
| Switch / Checkbox / RadioGroup             | ✅     | `aurora-switch` / `-checkbox` / `-radiogroup`      |
| Slider / RangeSlider                       | ✅     | `aurora-slider` / `aurora-rangeslider`             |
| AutoComplete / DropDownList / MultiSelect  | ✅     | `aurora-autocomplete` / `-select` / `-multiselect` |
| ComboBox (free text + list)                | ✅     | `aurora-combobox`                                  |
| DropDownTree (tree popup select)           | ✅     | `aurora-dropdowntree`                              |
| MultiColumnComboBox (table dropdown)       | ✅     | `aurora-multicolumncombobox`                       |
| ListBox (dual-list transfer)               | ✅     | `aurora-listbox`                                   |
| NumericTextBox / MaskedTextBox / OTP Input | ✅     | `aurora-numeric` / `-masked` / `-otp`              |
| Calendar / DatePicker / TimePicker         | ✅     | `aurora-calendar` / `-datepicker` / `-timepicker`  |
| DateRangePicker / DateTimePicker           | ✅     | `aurora-daterange` / `aurora-datetimepicker`       |
| DateInput (segmented typing)               | ✅     | `aurora-dateinput`                                 |
| TimeDurationPicker                         | ✅     | `aurora-durationpicker`                            |
| ColorPicker / ColorGradient / ColorPalette | ✅     | `aurora-colorpicker` / `aurora-colorpalette`       |
| Rating / Signature                         | ✅     | `aurora-rating` / `aurora-signature`               |
| Rich Text Editor                           | ✅     | `aurora-editor`                                    |

## Scheduling

Calendar ✅ · DateRangePicker ✅ · Scheduler ✅ (`aurora-scheduler`, day/week/month/agenda views) · Gantt ✅ (`aurora-gantt`, drag-move + grip-resize)

## Navigation

Button ✅ · ButtonGroup/SplitButton ✅ · Menu ✅ · Drawer ✅ · TreeView ✅ ·
Stepper ✅ · Wizard ✅ · Breadcrumb ✅ · Chip/ChipList ✅ (`aurora-chips`) ·
ContextMenu ✅ · ToolBar ✅ (`aurora-toolbar`) · AppBar ✅ (`aurora-appbar`) ·
FAB ✅ (`aurora-fab`) · ActionSheet ✅ (`aurora-actionsheet`) · BottomNavigation ✅ (`aurora-bottomnav`)

## Layout

Dialog ✅ (`aurora-modal`) · Tooltip ✅ · TabStrip ✅ (`aurora-tabs`) ·
ExpansionPanel ✅ (`aurora-accordion`) · Notification ✅ (`aurora-toaster`) ·
Card ✅ (`aurora-spotlight`/`aurora-beam`) · Splitter ✅ · Window ✅ ·
PopOver ✅ · Avatar/Badge ✅ · Timeline ✅ · Form/Validator ✅ (`aurora-form`) · TileLayout ✅ (`aurora-tilelayout`)

## Interactivity & UX

Loader ✅ · ProgressBar ✅ (`aurora-progressbar`; scroll hairline: `aurora-progress`) ·
Skeleton ✅ · Ripple ✅ · Sortable / Drag-and-Drop ✅ (`aurora-sortable`) ·
TaskBoard 🔶 (compose `aurora-sortable`) · CircularProgressBar ✅ (`aurora-gauge type="circular"`)

## Charts & Visualization

Sparkline ✅ · Chart (bar / stacked bar / line / area / donut / pie / scatter) ✅ · Gauges (arc / circular / linear) ✅ ·
OrgChart ✅ (`aurora-orgchart`) · Map / Diagram ⬜

## Media / Files / Misc

Upload ✅ · ScrollView ✅ (`aurora-carousel`) · QRCode ✅ + Barcode/Code 128 ✅ (in-house encoders) ·
Chat ✅ · MediaPlayer ✅ (`aurora-videoplayer`) · PDF Viewer ⬜

## Remaining candidates

Map/Diagram · PDF Viewer · Spreadsheet

Out of scope for now (rationale): **Map** needs tile providers or geo data (an external
service, against the zero-dependency principle); **Diagram** (free-form node graphs)
and **Spreadsheet** (formula engine) are products of their own; **PDF Viewer** requires
a PDF rendering engine (pdf.js-scale). Revisit if the catalogue's positioning changes.
