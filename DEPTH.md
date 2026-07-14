# Per-component depth audit vs Kendo UI documented features

Sourced from the official Kendo UI for jQuery documentation (Functionality and Features
sections), fetched 2026-07-14. ENTERPRISE.md tracks breadth; this file tracks depth.
Legend: ✅ have · 🔶 partial/equivalent · ⬜ open

## Calendar (affects datepicker, datetimepicker, multiviewcalendar, daterange)

| Kendo feature                                     | aurora                                  |
| ------------------------------------------------- | --------------------------------------- |
| Selected dates (initial)                          | ✅ `value`                              |
| Disabled dates                                    | ✅ list attr + veto fn                  |
| Start view & navigation depth (month/year/decade) | ✅                                      |
| Day template                                      | ⬜                                      |
| Week numbers                                      | ✅ ISO weeks                            |
| Multiple/range selection                          | 🔶 `aurora-daterange` handles ranges    |
| Century cells format                              | ⬜ (century view out of scope for v1.1) |
| Reverse selection                                 | ✅ daterange auto-swaps                 |
| Show other month days                             | ✅ hide-other-months                    |
| Min/max dates                                     | ✅                                      |
| Accessibility                                     | ✅ roving grid keyboard                 |

## Window

| Kendo feature           | aurora                              |
| ----------------------- | ----------------------------------- |
| Animations              | ✅                                  |
| Positioning + constrain | ✅ drag with viewport clamp         |
| Dimensions              | ✅ CSS                              |
| Custom actions          | ✅ actions slot                     |
| Content via AJAX/iframe | 🔶 slots cover the composition case |
| Resizing                | ✅ corner grip                      |
| Maximize/minimize       | ✅ + dblclick bar                   |
| Modal mode              | ✅ modal/static attrs               |
| Globalization/RTL       | ⬜ (tracked globally)               |

## Chart

| Kendo feature          | aurora                               |
| ---------------------- | ------------------------------------ |
| Data binding           | ✅ properties (+ DataSource adapter) |
| Export (image/SVG/PDF) | ✅ PNG (SVG/PDF out of scope)        |
| Appearance             | ✅ CSS vars + palette                |
| Axes (titles, config)  | ✅ x/y titles (custom scales ⬜)     |
| Data series / types    | ✅ 9 types (bubble/polar/bullet ⬜)  |
| Date series            | ⬜                                   |
| Error bars             | ⬜                                   |
| Legend                 | ✅                                   |
| Notes/annotations      | ⬜                                   |
| Panes                  | ⬜                                   |
| Title                  | ✅ chart-title                       |
| Tooltip                | ✅                                   |
| No-data template       | ✅ empty-text                        |

## Editor (RTE)

| Kendo feature          | aurora                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Read-only state        | ✅                                                                                  |
| Classic + inline modes | 🔶 classic only                                                                     |
| Tools collection       | ✅ 21 tools (marks, blocks, lists, align, indent, colors, image, table, hr, source) |
| Selection API          | ✅ browser ranges                                                                   |
| Image browser          | 🔶 insert by URL (file browser needs a backend)                                     |
| Format painter         | ⬜                                                                                  |
| Immutable elements     | ⬜                                                                                  |
| Pasting from Word      | 🔶 browser-native paste                                                             |
| Post-processing        | ✅ `value` getter                                                                   |
| XSS prevention         | 🔶 documented as consumer responsibility                                            |
| Table Wizard           | 🔶 3×3 insert (wizard dialog ⬜)                                                    |
| Appearance             | ✅ CSS vars                                                                         |

## TreeView

| Kendo feature          | aurora                                            |
| ---------------------- | ------------------------------------------------- |
| Data binding           | ✅ items (+ adapter for remote)                   |
| Drag and drop nodes    | ⬜ (compose aurora-sortable; native DnD deferred) |
| Item configuration     | ✅ label/value/open/children                      |
| Checkboxes (tri-state) | ✅ cascade down, summarize up                     |
| Load on demand         | ✅ node.load() promise                            |
| Filtering              | ✅ box + filter(text)                             |

## Scheduler

| Kendo feature              | aurora                               |
| -------------------------- | ------------------------------------ |
| Local/remote data          | ✅ events (+ adapter)                |
| Views + custom views       | ✅ day/week/month/agenda (custom ⬜) |
| Resources                  | ⬜ → v1.6                            |
| Timezones                  | ⬜ (ISO local by design; documented) |
| Printing                   | ⬜                                   |
| Adaptive rendering         | 🔶 responsive CSS                    |
| Recurrence                 | ⬜ → v1.6                            |
| Drag to move/resize events | ⬜ → v1.6                            |

## Spreadsheet

| Kendo feature    | aurora                                                  |
| ---------------- | ------------------------------------------------------- |
| Formulas         | ✅ in-house engine                                      |
| Cell formatting  | ⬜ → v1.7 (bold/italic/align/color)                     |
| Comments         | ⬜                                                      |
| Images in sheets | ⬜                                                      |
| Custom editors   | ⬜                                                      |
| Custom functions | ⬜ → v1.7 (registerFunction)                            |
| Import/export    | 🔶 CSV → v1.7 adds .xlsx export via the in-house writer |
| Multiple sheets  | ⬜                                                      |
| Localization     | ⬜ (tracked globally)                                   |

## Gantt

| Kendo feature                | aurora                                |
| ---------------------------- | ------------------------------------- |
| TreeList + Timeline layout   | 🔶 flat task column (subtask tree ⬜) |
| Data binding                 | ✅ tasks (+ adapter)                  |
| Columns                      | 🔶 single title column                |
| Planned vs actual            | ⬜ → v1.8 (baseline bars)             |
| Views (day/week/month ruler) | ⬜ → v1.8                             |
| Move/resize/edit tasks       | ✅ drag-move + grip-resize            |
| Dependencies                 | ✅ arrows (editing ⬜)                |
| Sorting/reordering           | ⬜                                    |

## Grid (from the user-audited list — previously closed)

All 16 documented feature rows ✅ except: adaptive rendering ⬜, globalization/RTL ⬜,
batch edit queue ⬜, custom editor renderers ⬜, checkbox filter menus ⬜,
foreign-key columns ⬜, endless remote scroll 🔶 (DataSource pattern documented).

## Cross-cutting ⬜ (every Kendo component lists these)

- Globalization/localization (message strings are English literals today)
- RTL rendering
- Formal screen-reader audit (ARIA is in place; NVDA/VoiceOver passes not run)
