export interface ComponentDoc {
  tag: string
  title: string
  category: string
  summary: string
  example: string
  attributes: [string, string][]
  events: [string, string][]
  cssvars: [string, string][]
  methods: [string, string][]
  tutorial: { heading: string; text: string; code?: string }[]
}

export const DOCS: ComponentDoc[] = [
  {
    tag: 'aurora-grid',
    title: 'Data Grid',
    category: 'Enterprise & Data',
    summary:
      'A virtualized enterprise data grid: multi-column sorting, filtering, global search, paging, selection, grouping with aggregates, inline editing, detail rows, column resize/reorder/hide, keyboard navigation and CSV export.',
    example: `<aurora-grid id="docGrid" filterable searchable striped selectable="multiple" page-size="5"></aurora-grid>`,
    attributes: [
      ['page-size', 'Rows per page (0 disables paging)'],
      ['page-sizes', 'Comma list for the pager size selector, e.g. "5,10,25"'],
      ['selectable', '"single" or "multiple" (checkbox column + select-all)'],
      ['filterable', 'Shows the per-column filter row'],
      ['searchable', 'Adds a global search box to the toolbar'],
      ['exportable', 'Adds an Export CSV button to the toolbar'],
      ['editable', 'Enables inline cell editing (double-click / Enter)'],
      ['resizable', 'Drag handles on header edges'],
      ['reorderable', 'Drag headers to reorder columns'],
      ['virtual + row-height', 'Windowed rendering for huge datasets (paging off)'],
      ['striped / dense', 'Visual variants'],
    ],
    events: [
      ['aurora-sort', '{ sorts: {field, dir}[] }'],
      ['aurora-filter', '{ filters }'],
      ['aurora-page', '{ page, pageSize }'],
      ['aurora-selection', '{ selected: rows[] }'],
      ['aurora-edit', '{ row, field, value, oldValue }'],
      ['aurora-resize / aurora-reorder', 'column geometry changes'],
    ],
    cssvars: [
      ['--aurora-grid-height', 'Viewport max-height (sticky header scrolls inside)'],
      ['--aurora-grid-radius', 'Outer radius'],
      ['--aurora-accent / -surface / -border / -muted', 'Shared theme tokens'],
    ],
    methods: [
      ['columns / data', 'Assign column defs and row objects (properties)'],
      ['groupBy', 'Set to a field name to group; null to ungroup'],
      ['detail', 'Function (row) => html for expandable detail rows'],
      ['selected / refresh() / toggleColumn(f)', 'Selection getter, re-render, hide column'],
      ['toCsv() / exportCsv(name)', 'CSV of the filtered + sorted view'],
    ],
    tutorial: [
      {
        heading: '1 · Define columns and data',
        text: 'Columns are plain objects; formatters turn raw values into display text.',
        code: `grid.columns = [\n  { field: 'name', title: 'Project' },\n  { field: 'stars', title: 'Stars', align: 'right', aggregate: 'sum',\n    formatter: (v) => \`★ \${v}\` },\n]\ngrid.data = rows`,
      },
      {
        heading: '2 · Turn on the features you need',
        text: 'Everything is opt-in via attributes — start bare, add filterable, searchable, editable, selectable as the screen demands.',
      },
      {
        heading: '3 · Go virtual for big data',
        text: 'Drop paging, set virtual and --aurora-grid-height, and 10k+ rows render as a windowed slice with an honest scrollbar.',
        code: `<aurora-grid virtual row-height="36"\n  style="--aurora-grid-height: 420px"></aurora-grid>`,
      },
    ],
  },
  {
    tag: 'aurora-select',
    title: 'Select',
    category: 'Forms & Inputs',
    summary:
      'An animated dropdown list. Options come from child <option> elements or the options property; form-associated, combobox ARIA, full keyboard flow with first-letter type-ahead.',
    example: `<aurora-select placeholder="Pick a language">\n  <option value="ts">TypeScript</option>\n  <option value="go">Go</option>\n  <option value="rs">Rust</option>\n</aurora-select>`,
    attributes: [
      ['placeholder', 'Shown until a value is chosen'],
      ['value', 'Initial selected value'],
      ['name', 'Form field name (submits like a native select)'],
    ],
    events: [['aurora-change', '{ value }']],
    cssvars: [['--aurora-accent / -surface / -border / -radius / -muted', 'Shared theme tokens']],
    methods: [
      ['value', 'Get/set the selection'],
      ['options', 'Get/set as { value, label }[]'],
      ['open() / close() / toggle()', 'Programmatic control'],
    ],
    tutorial: [
      {
        heading: '1 · Drop it in a form',
        text: 'ElementInternals makes it submit natively — no hidden inputs.',
        code: `<form>\n  <aurora-select name="lang" placeholder="Language">\n    <option value="ts">TypeScript</option>\n  </aurora-select>\n</form>`,
      },
      {
        heading: '2 · Listen for changes',
        text: 'aurora-change fires with the new value on every selection.',
        code: `select.addEventListener('aurora-change', (e) => {\n  console.log(e.detail.value)\n})`,
      },
      {
        heading: '3 · Keyboard is first-class',
        text: 'ArrowDown opens, arrows move, letters type-ahead, Enter commits, Escape closes.',
      },
    ],
  },
  {
    tag: 'aurora-autocomplete',
    title: 'Autocomplete',
    category: 'Forms & Inputs',
    summary:
      'A type-to-filter suggestion input: matches highlight as you type, arrows and Enter select, Escape closes. Form-associated like every aurora input.',
    example: `<aurora-autocomplete id="docAc" placeholder="Search a language…"></aurora-autocomplete>`,
    attributes: [
      ['placeholder', 'Input placeholder'],
      ['min-chars', 'Characters before suggestions appear (default 1)'],
      ['name', 'Form field name'],
    ],
    events: [['aurora-change', '{ value } on selection']],
    cssvars: [['--aurora-accent / -surface / -border / -radius / -muted', 'Shared theme tokens']],
    methods: [
      ['options', 'Get/set suggestions as string[]'],
      ['value', 'Get/set the input value'],
      ['close()', 'Hide the suggestion list'],
    ],
    tutorial: [
      {
        heading: '1 · Feed it suggestions',
        text: 'Any string array works — from a constant to a fetch response.',
        code: `ac.options = ['TypeScript', 'JavaScript', 'Go', 'Rust']`,
      },
      {
        heading: '2 · React to selection',
        text: 'aurora-change fires when a suggestion is chosen by click or Enter.',
        code: `ac.addEventListener('aurora-change', (e) => query(e.detail.value))`,
      },
    ],
  },
  {
    tag: 'aurora-multiselect',
    title: 'Multiselect',
    category: 'Forms & Inputs',
    summary:
      'A pick-many dropdown: selections become removable chips, the popup is a checkbox list, and the form gets one entry per value.',
    example: `<aurora-multiselect id="docMs" placeholder="Pick stacks…">\n  <option value="ts">TypeScript</option>\n  <option value="go">Go</option>\n  <option value="rs">Rust</option>\n</aurora-multiselect>`,
    attributes: [
      ['placeholder', 'Shown while nothing is selected'],
      ['name', 'Form field name (FormData entry per value)'],
    ],
    events: [['aurora-change', '{ values: string[] }']],
    cssvars: [['--aurora-accent / -surface / -border / -radius / -muted', 'Shared theme tokens']],
    methods: [
      ['values', 'Get/set the selection as string[]'],
      ['options', 'Get/set as { value, label }[]'],
      ['toggleValue(v) / open() / close()', 'Programmatic control'],
    ],
    tutorial: [
      {
        heading: '1 · Options in, chips out',
        text: 'Child <option> elements (or the options property) define the list; every pick renders as a chip with its own remove button.',
      },
      {
        heading: '2 · Real multi-value form data',
        text: 'With a name attribute, submitting the surrounding form sends one entry per selected value — exactly like a native multiple select.',
        code: `const data = new FormData(form)\ndata.getAll('stacks') // ['ts', 'go']`,
      },
    ],
  },
  {
    tag: 'aurora-calendar',
    title: 'Calendar',
    category: 'Forms & Inputs',
    summary:
      'A month-view calendar with a Monday-first grid, an outlined today, ISO value, and a complete keyboard flow — the base of the date/time suite.',
    example: `<aurora-calendar value="2026-07-11"></aurora-calendar>`,
    attributes: [
      ['value', 'ISO date (yyyy-mm-dd)'],
      ['name', 'Form field name'],
    ],
    events: [['aurora-change', '{ value } — ISO date on pick']],
    cssvars: [['--aurora-accent / -accent2 / -surface / -border / -muted', 'Shared theme tokens']],
    methods: [['value', 'Get/set the ISO date (moves the visible month)']],
    tutorial: [
      {
        heading: '1 · Keyboard first',
        text: 'Arrows move by day and week, PageUp/PageDown flip months, Enter picks — focus follows the roving date.',
      },
      {
        heading: '2 · Forms, as always',
        text: 'With a name attribute the picked ISO date submits natively.',
        code: `<form>\n  <aurora-calendar name="due"></aurora-calendar>\n</form>`,
      },
    ],
  },
  {
    tag: 'aurora-datepicker',
    title: 'Date Picker',
    category: 'Forms & Inputs',
    summary:
      'A date input that opens the aurora-calendar in a popup — composition inside the library. Picking closes the popup, refocuses the trigger, and submits the ISO date.',
    example: `<aurora-datepicker value="2026-07-11" format="locale"></aurora-datepicker>`,
    attributes: [
      ['value', 'ISO date (yyyy-mm-dd)'],
      ['placeholder', 'Trigger text before a pick'],
      ['format', '"iso" (default) or "locale" display'],
      ['name', 'Form field name'],
    ],
    events: [['aurora-change', '{ value } — ISO date']],
    cssvars: [['--aurora-accent / -surface / -border / -radius / -muted', 'Shared theme tokens']],
    methods: [
      ['value', 'Get/set the ISO date'],
      ['open() / close() / toggle()', 'Programmatic control'],
    ],
    tutorial: [
      {
        heading: '1 · Calendar included',
        text: 'The popup is a real <aurora-calendar>, so the full keyboard flow (arrows, PageUp/Down, Enter) works inside the picker for free.',
      },
      {
        heading: '2 · Display vs data',
        text: 'format="locale" shows the user their local convention; the form always receives the ISO value.',
      },
    ],
  },
  {
    tag: 'aurora-timepicker',
    title: 'Time Picker',
    category: 'Forms & Inputs',
    summary:
      'An HH:MM input with scrollable hour and minute columns; the minute increment is yours to set, and the current selection centers itself when the popup opens.',
    example: `<aurora-timepicker value="14:30" step="15"></aurora-timepicker>`,
    attributes: [
      ['value', '24h time, "HH:MM"'],
      ['step', 'Minute increment (default 5)'],
      ['placeholder', 'Trigger text before a pick'],
      ['name', 'Form field name'],
    ],
    events: [['aurora-change', '{ value } — "HH:MM"']],
    cssvars: [['--aurora-accent / -surface / -border / -radius / -muted', 'Shared theme tokens']],
    methods: [
      ['value', 'Get/set "HH:MM"'],
      ['open() / close() / toggle()', 'Programmatic control'],
    ],
    tutorial: [
      {
        heading: '1 · Pair it with the datepicker',
        text: 'Datepicker + timepicker side by side cover the classic scheduling form; both submit natively.',
        code: `<aurora-datepicker name="date"></aurora-datepicker>\n<aurora-timepicker name="time" step="15"></aurora-timepicker>`,
      },
    ],
  },
  {
    tag: 'aurora-rating',
    title: 'Rating',
    category: 'Forms & Inputs',
    summary:
      'A star rating that pops as you pick. Any glyph, any scale, keyboard-rateable, and it submits its number with the form.',
    example: `<aurora-rating value="3" max="5"></aurora-rating>`,
    attributes: [
      ['value / max', 'Current rating and scale (default 5)'],
      ['char', 'Glyph to repeat (default ★)'],
      ['readonly', 'Display only'],
      ['name', 'Form field name'],
    ],
    events: [['aurora-change', '{ value }']],
    cssvars: [['--aurora-rating-on / -off / -size', 'Colors and glyph size']],
    methods: [['value', 'Get/set the rating']],
    tutorial: [
      {
        heading: '1 · Rate with the keyboard',
        text: 'Focus a star and use the arrow keys — the group follows the radiogroup pattern.',
      },
      {
        heading: '2 · Make it yours',
        text: 'char="♥" and --aurora-rating-on: #f472b6 turn it into hearts.',
        code: `<aurora-rating char="♥" style="--aurora-rating-on:#f472b6"></aurora-rating>`,
      },
    ],
  },
  {
    tag: 'aurora-numeric',
    title: 'Numeric Input',
    category: 'Forms & Inputs',
    summary:
      'A numeric spinner with honest math: typed values are clamped to min/max and snapped to the step on commit, arrows step, and the number pops as it changes.',
    example: `<aurora-numeric value="5" min="0" max="10" step="1"></aurora-numeric>`,
    attributes: [
      ['value / min / max / step', 'The numbers (step also snaps typed input)'],
      ['decimals', 'Fixed-point display places'],
      ['label / name / disabled', 'A11y label, form field, disabled state'],
    ],
    events: [['aurora-change', '{ value } after clamp + snap']],
    cssvars: [['--aurora-accent / -border / -radius / -muted', 'Shared theme tokens']],
    methods: [['value', 'Get/set the number (clamped + snapped)']],
    tutorial: [
      {
        heading: '1 · Trust the commit',
        text: 'Type anything — Enter or blur clamps to bounds and snaps to the step, so the value is always valid.',
        code: `<aurora-numeric name="qty" min="0" max="100" step="5"></aurora-numeric>`,
      },
    ],
  },
  {
    tag: 'aurora-masked',
    title: 'Masked Input',
    category: 'Forms & Inputs',
    summary:
      'A pattern-masked input: define the shape once (# digit, A letter, * alphanumeric), literals type themselves, wrong characters never land, and completeness is reflected as an attribute.',
    example: `<aurora-masked mask="(###) ###-####"></aurora-masked>`,
    attributes: [
      ['mask', '# digit · A letter · * alphanumeric · anything else literal'],
      [
        'value / placeholder / label / name',
        'Initial text, hint (defaults to the mask), a11y label, form field',
      ],
      ['complete (reflected)', 'Present when every slot is filled — style it or read it'],
    ],
    events: [['aurora-change', '{ value, raw, complete }']],
    cssvars: [
      [
        '--aurora-accent / -border / -radius / -success',
        'Theme; the border turns success when complete',
      ],
    ],
    methods: [['value / raw', 'Display text vs. user characters only (raw is what submits)']],
    tutorial: [
      {
        heading: '1 · Phone, licence, IBAN — one attribute',
        text: 'The mask is the whole configuration.',
        code: `<aurora-masked name="phone" mask="(###) ###-####"></aurora-masked>\n<aurora-masked name="plate" mask="AA-##-AA"></aurora-masked>`,
      },
      {
        heading: '2 · Gate on completeness',
        text: 'Enable the submit button only when the mask is filled.',
        code: `masked.addEventListener('aurora-change', (e) => {\n  submit.disabled = !e.detail.complete\n})`,
      },
    ],
  },
  {
    tag: 'aurora-otp',
    title: 'OTP Input',
    category: 'Forms & Inputs',
    summary:
      'A segmented code input that behaves the way users expect: typing advances, Backspace retreats, pasting fills every cell, and completion pops with a success border.',
    example: `<aurora-otp length="6"></aurora-otp>`,
    attributes: [
      ['length', 'Number of cells (default 6)'],
      ['alphanumeric', 'Allow letters as well as digits'],
      ['name', 'Form field name'],
      ['complete (reflected)', 'Present when every cell is filled'],
    ],
    events: [['aurora-complete', '{ value } when the last cell lands']],
    cssvars: [
      ['--aurora-accent / -border / -radius / -success', 'Theme; success border on completion'],
    ],
    methods: [['value', 'Get/set the code']],
    tutorial: [
      {
        heading: '1 · Verify on complete',
        text: 'No submit button needed — fire the check the moment the code is full.',
        code: `otp.addEventListener('aurora-complete', (e) => verify(e.detail.value))`,
      },
      {
        heading: '2 · SMS autofill friendly',
        text: 'The first cell carries autocomplete="one-time-code", and pasting a whole code distributes it across the cells.',
      },
    ],
  },
  {
    tag: 'aurora-treeview',
    title: 'Tree View',
    category: 'Actions & Navigation',
    summary:
      'Hierarchical navigation from a nested items array — branches expand with a staggered reveal, and the full ARIA tree keyboard pattern is wired in.',
    example: `<aurora-treeview id="docTree" style="min-width:230px"></aurora-treeview>`,
    attributes: [],
    events: [
      ['aurora-select', '{ value } when a leaf is chosen'],
      ['aurora-toggle', '{ value, open } when a branch flips'],
    ],
    cssvars: [['--aurora-accent / -border / -muted', 'Highlight, guides, carets']],
    methods: [['items', 'Nested { label, value?, open?, children? }[]']],
    tutorial: [
      {
        heading: '1 · Data in, tree out',
        text: 'Branches are nodes with children; open controls the initial state.',
        code: `tree.items = [\n  { label: 'src', open: true, children: [\n    { label: 'index.ts' },\n  ]},\n]`,
      },
      {
        heading: '2 · Navigate by keyboard',
        text: 'Up/Down walk the visible rows, Right expands, Left collapses, Enter selects — the WAI-ARIA tree pattern.',
      },
    ],
  },
  {
    tag: 'aurora-stepper',
    title: 'Stepper',
    category: 'Actions & Navigation',
    summary:
      'Multi-step progress with accent-filled connectors, checkmarked completed steps, and a pop on advance. Completed dots jump back; linear="false" frees navigation entirely.',
    example: `<aurora-stepper id="docStep" value="1" style="width:100%">\n  <option>Account</option>\n  <option>Billing</option>\n  <option>Review</option>\n  <option>Done</option>\n</aurora-stepper>`,
    attributes: [
      ['value', 'Current step index'],
      ['linear', '"false" allows jumping to any step'],
    ],
    events: [['aurora-change', '{ value, label }']],
    cssvars: [['--aurora-accent / -accent2 / -surface / -border / -muted', 'Shared theme tokens']],
    methods: [
      ['steps', 'string[] labels'],
      ['next() / prev() / value', 'Navigation'],
    ],
    tutorial: [
      {
        heading: '1 · Drive it from your wizard',
        text: 'Call next()/prev() as your form advances; listen for aurora-change to sync panels.',
        code: `continueBtn.onclick = () => stepper.next()`,
      },
    ],
  },
  {
    tag: 'aurora-breadcrumb',
    title: 'Breadcrumb',
    category: 'Actions & Navigation',
    summary:
      'A breadcrumb trail with a custom separator; the last item is the current page and hrefless crumbs act as buttons.',
    example: `<aurora-breadcrumb id="docCrumb"></aurora-breadcrumb>`,
    attributes: [['separator', 'Between crumbs (default ›)']],
    events: [['aurora-select', '{ label, index } for hrefless crumbs']],
    cssvars: [['--aurora-accent / -fg / -muted', 'Link, current, separator colors']],
    methods: [['items', '{ label, href? }[] — last renders as aria-current=page']],
    tutorial: [
      {
        heading: '1 · Links or actions',
        text: 'Crumbs with href navigate; without one they emit aurora-select for SPA routing.',
        code: `crumb.items = [\n  { label: 'Home', href: '/' },\n  { label: 'Library' }, // emits aurora-select\n  { label: 'Grid' },    // current page\n]`,
      },
    ],
  },
  {
    tag: 'aurora-chips',
    title: 'Chips',
    category: 'Actions & Navigation',
    summary:
      'A chip list for filters and tags: single or multiple selection with a pop, optional remove buttons, and clean change events.',
    example: `<aurora-chips selectable="multiple">\n  <option value="ts">TypeScript</option>\n  <option value="go">Go</option>\n  <option value="rs">Rust</option>\n</aurora-chips>`,
    attributes: [
      ['selectable', '"single" or "multiple" (aria-pressed reflects state)'],
      ['removable', 'Adds ✕ buttons that remove chips'],
    ],
    events: [
      ['aurora-change', '{ values }'],
      ['aurora-remove', '{ value }'],
    ],
    cssvars: [['--aurora-accent / -accent2 / -border / -fg', 'Selection tint, focus, borders']],
    methods: [['options / values', 'Chip definitions and current selection']],
    tutorial: [
      {
        heading: '1 · Filters in one line',
        text: 'Wire aurora-change straight into your list filter.',
        code: `chips.addEventListener('aurora-change', (e) => filterBy(e.detail.values))`,
      },
    ],
  },
  {
    tag: 'aurora-sparkline',
    title: 'Sparkline',
    category: 'Enterprise & Data',
    summary:
      'A tiny inline chart that draws itself into view — line, area, or bars on a DPR-aware 2D canvas, sized purely by CSS.',
    example: `<aurora-sparkline id="docSpark" type="area" style="width:220px;height:56px"></aurora-sparkline>`,
    attributes: [
      ['type', '"line" (default), "area", "bars"'],
      ['aria-label', 'Describe the metric (role="img")'],
    ],
    events: [],
    cssvars: [['--aurora-spark-color / --aurora-spark-fill', 'Stroke and area fill']],
    methods: [['data', 'number[] — the series']],
    tutorial: [
      {
        heading: '1 · Numbers in, trend out',
        text: 'Size the host with CSS; the canvas tracks it at device pixel ratio.',
        code: `spark.data = [3, 7, 4, 9, 6, 12, 8]`,
      },
    ],
  },
  {
    tag: 'aurora-chart',
    title: 'Chart',
    category: 'Enterprise & Data',
    summary:
      'Grouped bars, multi-series lines, and donuts on a DPR-aware canvas — gridlines, y-ticks, category labels, an HTML legend, hover tooltips, and an animated intro.',
    example: `<aurora-chart id="docChart" type="bar" style="--aurora-chart-height:220px"></aurora-chart>`,
    attributes: [
      ['type', '"bar" (grouped), "line" (multi-series), "donut" (first series)'],
      ['aria-label', 'Describe the chart (role="img")'],
    ],
    events: [],
    cssvars: [['--aurora-chart-height', 'Canvas height (default 240px)']],
    methods: [
      ['labels', 'string[] category names'],
      ['series', '{ label, data, color? }[] — palette colors by default'],
    ],
    tutorial: [
      {
        heading: '1 · Two properties, whole chart',
        text: 'Labels are the x-axis; each series becomes a color with a legend key and tooltip line.',
        code: `chart.labels = ['Q1', 'Q2', 'Q3', 'Q4']\nchart.series = [\n  { label: 'Stars', data: [120, 260, 410, 640] },\n  { label: 'Forks', data: [40, 90, 150, 210] },\n]`,
      },
      {
        heading: '2 · Hover for detail',
        text: 'The tooltip follows the pointer and reads every series at that category.',
      },
    ],
  },
  {
    tag: 'aurora-splitter',
    title: 'Splitter',
    category: 'Overlays & Feedback',
    summary:
      'Two resizable panes and a draggable divider — horizontal or vertical, bounded by a min percentage, keyboard-nudgeable, and lit accent while dragging.',
    example: `<aurora-splitter position="40" style="height:160px;border:1px solid rgba(255,255,255,.1);border-radius:12px">\n  <div slot="a" style="padding:16px">Pane A</div>\n  <div slot="b" style="padding:16px">Pane B</div>\n</aurora-splitter>`,
    attributes: [
      ['position', 'Initial split (% of the first pane, default 50)'],
      ['vertical', 'Stack panes and drag up/down'],
      ['min', 'Minimum % for either side (default 15)'],
    ],
    events: [['aurora-resize', '{ position }']],
    cssvars: [['--aurora-accent / -accent2 / -border', 'Divider colors and focus ring']],
    methods: [['position', 'Get/set the split percentage']],
    tutorial: [
      {
        heading: '1 · IDE layouts in one tag',
        text: 'Nest a vertical splitter inside pane B of a horizontal one for a classic three-pane layout.',
      },
    ],
  },
  {
    tag: 'aurora-window',
    title: 'Window',
    category: 'Overlays & Feedback',
    summary:
      'A floating window you can drag by its title bar — viewport-clamped, bring-to-front on click, with the same focus discipline as the modal.',
    example: `<aurora-button onclick="document.getElementById('docWin').show()">Open window</aurora-button>\n<aurora-window id="docWin" title="Inspector">\n  <p style="margin-top:0">Drag me by the title bar.</p>\n  <aurora-button onclick="document.getElementById('docWin').hide()">Close</aurora-button>\n</aurora-window>`,
    attributes: [
      ['title', 'Title-bar text and aria-label'],
      ['open', 'Present while shown'],
    ],
    events: [['aurora-open / aurora-close', 'Lifecycle']],
    cssvars: [
      ['--aurora-window-width / -z, --aurora-surface / -border', 'Size, layering, panel style'],
    ],
    methods: [['show() / hide()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Multiple windows coexist',
        text: 'Each window brings itself to front on pointer-down — open two and click between them.',
      },
    ],
  },
  {
    tag: 'aurora-popover',
    title: 'Popover',
    category: 'Overlays & Feedback',
    summary:
      'An anchored floating panel for rich contextual content — four placements, click or hover triggering, and polite dismissal.',
    example: `<aurora-popover placement="bottom">\n  <aurora-button slot="trigger" variant="ghost">What is this?</aurora-button>\n  <strong>Popover</strong><br />Anchored content with any markup inside.\n</aurora-popover>`,
    attributes: [
      ['placement', 'bottom (default) / top / left / right'],
      ['hover', 'Open on pointer enter instead of click'],
    ],
    events: [['aurora-open / aurora-close', 'Lifecycle']],
    cssvars: [['--aurora-surface / -border / -menu-z', 'Panel style and layering']],
    methods: [['open() / close() / toggle()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Tooltip’s bigger sibling',
        text: 'Where aurora-tooltip is one line of text, the popover holds real markup — forms, links, images.',
      },
    ],
  },
  {
    tag: 'aurora-upload',
    title: 'Upload',
    category: 'Forms & Inputs',
    summary:
      'A drag-and-drop file zone with keyboard browsing, animated per-file rows, size limits with error events, and native multi-file form submission.',
    example: `<aurora-upload multiple label="Drop files here or click to browse"></aurora-upload>`,
    attributes: [
      ['multiple / accept', 'Allow several files; native accept filter'],
      ['max-size', 'Bytes — larger files fire aurora-error instead of adding'],
      ['label / name', 'Zone text; form field (FormData entry per file)'],
    ],
    events: [
      ['aurora-change', '{ files: File[] }'],
      ['aurora-error', '{ file, reason } on rejection'],
    ],
    cssvars: [['--aurora-accent / -border / -error / -muted', 'Zone and row styling']],
    methods: [['files / addFiles(File[]) / removeFile(i)', 'Read and manage the selection']],
    tutorial: [
      {
        heading: '1 · Wire the rejection path',
        text: 'max-size keeps oversized files out of the form; toast the reason.',
        code: `up.addEventListener('aurora-error', (e) =>\n  AuroraToaster.show(\`\${e.detail.file.name} is too large\`, { variant: 'error' }))`,
      },
    ],
  },
  {
    tag: 'aurora-scheduler',
    title: 'Scheduler',
    category: 'Enterprise & Data',
    summary:
      'A week-view scheduler: day columns over hour rows, time-positioned events with accent colors, today highlighting, and week paging — the capstone of the enterprise track.',
    example: `<aurora-scheduler id="docSched" date="2026-07-13" start-hour="8" end-hour="18"></aurora-scheduler>`,
    attributes: [
      ['date', 'Any day in the week to show (ISO)'],
      ['start-hour / end-hour', 'Visible hour range (default 8–19)'],
      ['slot-height', 'Pixels per hour row (default 44)'],
    ],
    events: [
      ['aurora-select', '{ event } when an event is clicked'],
      ['aurora-range', '{ start } when the week changes'],
    ],
    cssvars: [['--aurora-accent / -surface / -border / -muted', 'Grid and default event color']],
    methods: [['events', '{ title, start, end, color? }[] — ISO datetimes']],
    tutorial: [
      {
        heading: '1 · Events are plain objects',
        text: 'Times position and size each block; color sets the accent.',
        code: `sched.events = [\n  { title: 'Standup', start: '2026-07-13T09:00', end: '2026-07-13T09:30' },\n  { title: 'Design review', start: '2026-07-15T14:00', end: '2026-07-15T15:30', color: '#22d3ee' },\n]`,
      },
      {
        heading: '2 · Load weeks on demand',
        text: 'aurora-range fires with the new week start — fetch and reassign events.',
      },
    ],
  },
  {
    tag: 'aurora-tooltip',
    title: 'Tooltip',
    category: 'Overlays & Feedback',
    summary:
      'A one-line hover/focus tooltip with four placements — for anything longer, reach for the popover.',
    example: `<aurora-tooltip text="Copied to clipboard" position="top">\n  <aurora-button variant="ghost">Hover me</aurora-button>\n</aurora-tooltip>`,
    attributes: [
      ['text', 'Tooltip content'],
      ['position', 'top / bottom / left / right'],
    ],
    events: [],
    cssvars: [['--aurora-surface / -border / -fg', 'Bubble style']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Focus counts too',
        text: 'The tooltip shows on keyboard focus as well as hover — no pointer required.',
      },
    ],
  },
  {
    tag: 'aurora-accordion',
    title: 'Accordion',
    category: 'Overlays & Feedback',
    summary: 'A collapsible panel with animated height and correct aria-expanded state.',
    example: `<aurora-accordion label="What is aurora?" open>\n  A framework-agnostic set of animated web components.\n</aurora-accordion>\n<aurora-accordion label="Does it work in React?">\n  Yes — they are standard custom elements.\n</aurora-accordion>`,
    attributes: [
      ['label', 'Header text'],
      ['open', 'Expanded state (toggle or use methods)'],
    ],
    events: [],
    cssvars: [['--aurora-accent / -border / -fg', 'Header and divider styling']],
    methods: [['show() / hide()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Stack for an FAQ',
        text: 'Several accordions in a column give you an FAQ with zero extra wiring.',
      },
    ],
  },
  {
    tag: 'aurora-tabs',
    title: 'Tabs',
    category: 'Actions & Navigation',
    summary:
      'Tabbed panels with an animated active indicator and the WAI-ARIA tabs keyboard pattern (arrows, Home/End, roving tabindex).',
    example: `<aurora-tabs active="0">\n  <aurora-tab-panel label="Overview">Animated components as native web components.</aurora-tab-panel>\n  <aurora-tab-panel label="Install">npm install aurora</aurora-tab-panel>\n</aurora-tabs>`,
    attributes: [
      ['active', 'Initially selected index'],
      ['label (on panels)', 'Tab button text'],
    ],
    events: [['aurora-tab-change', '{ index }']],
    cssvars: [['--aurora-accent / -border / -muted', 'Indicator and tab colors']],
    methods: [['select(i)', 'Switch programmatically']],
    tutorial: [
      {
        heading: '1 · Panels are elements',
        text: 'Wrap content in aurora-tab-panel children — the tab bar builds itself from their labels.',
      },
    ],
  },
  {
    tag: 'aurora-drawer',
    title: 'Drawer',
    category: 'Overlays & Feedback',
    summary:
      'A side panel sliding from either edge with the modal’s focus discipline: Tab trap, Escape, focus restore.',
    example: `<aurora-button onclick="document.getElementById('dd').show()">Open drawer</aurora-button>\n<aurora-drawer id="dd">\n  <h2 style="margin-top:0">Panel</h2>\n  <aurora-button onclick="document.getElementById('dd').hide()">Close</aurora-button>\n</aurora-drawer>`,
    attributes: [
      ['open', 'Present while shown'],
      ['side', 'right (default) or left'],
    ],
    events: [['aurora-open / aurora-close', 'Lifecycle']],
    cssvars: [['--aurora-drawer-width / -z / -padding', 'Size, layering, spacing']],
    methods: [['show() / hide()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Settings, carts, filters',
        text: 'Anything slotted becomes the panel body; focus enters on open and returns on close.',
      },
    ],
  },
  {
    tag: 'aurora-menu',
    title: 'Menu',
    category: 'Actions & Navigation',
    summary:
      'An animated dropdown with arrow-key roving, Escape-with-focus-restore, and outside-click close.',
    example: `<aurora-menu label="Actions">\n  <button data-value="edit">Edit</button>\n  <button data-value="duplicate">Duplicate</button>\n  <hr />\n  <button data-value="delete">Delete</button>\n</aurora-menu>`,
    attributes: [
      ['label', 'Trigger text'],
      ['align', '"end" right-aligns the panel'],
    ],
    events: [['aurora-select', '{ value } from data-value or the label']],
    cssvars: [['--aurora-surface / -border / -menu-z / -radius', 'Panel style and layering']],
    methods: [['open() / close() / toggle()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Buttons are items',
        text: 'Child <button data-value> elements become menuitems; <hr> draws separators.',
      },
    ],
  },
  {
    tag: 'aurora-button',
    title: 'Button',
    category: 'Actions & Navigation',
    summary:
      'The themeable base button — primary and ghost variants, focus-visible ring, disabled state.',
    example: `<aurora-button>Primary</aurora-button>\n<aurora-button variant="ghost">Ghost</aurora-button>`,
    attributes: [
      ['variant', '"primary" (default) or "ghost"'],
      ['disabled', 'Disables interaction'],
    ],
    events: [],
    cssvars: [['--aurora-accent / -accent-hover / -radius', 'Fill, hover, corner radius']],
    methods: [],
    tutorial: [
      {
        heading: '1 · It is a real button',
        text: 'Clicks, forms, and focus behave natively — delegatesFocus forwards host.focus() to the inner control.',
      },
    ],
  },
  {
    tag: 'aurora-magnetic',
    title: 'Magnetic',
    category: 'Motion & Interaction',
    summary:
      'Wrapped content is pulled toward the cursor as it approaches and springs back on leave.',
    example: `<aurora-magnetic strength="0.5">\n  <aurora-button>Hover near me</aurora-button>\n</aurora-magnetic>`,
    attributes: [['strength', 'Pull factor 0–1 (default 0.4)']],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Best on CTAs',
        text: 'One magnetic hero button reads premium; ten read chaotic. Use sparingly.',
      },
    ],
  },
  {
    tag: 'aurora-text',
    title: 'Text Reveal',
    category: 'Text & Typography',
    summary:
      'Masked text that rises into view on scroll — word by word, or per character for display headlines.',
    example: `<aurora-text by="chars" stagger="0.03" style="font-size:1.6rem;font-weight:700">\n  Motion, built in.\n</aurora-text>`,
    attributes: [
      ['by', '"words" (default) or "chars"'],
      ['stagger / delay', 'Timing controls'],
    ],
    events: [['aurora-complete', 'Reveal finished']],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Gradient-safe',
        text: 'The reveal masks translate whole glyph units, so background-clip gradients on the host survive.',
      },
    ],
  },
  {
    tag: 'aurora-marquee',
    title: 'Marquee',
    category: 'Motion & Interaction',
    summary:
      'A seamless infinite scroller — content duplicates once (aria-hidden) and loops at a pixel speed you set.',
    example: `<aurora-marquee speed="70" style="font-weight:700">GSAP · Web Components · MIT · </aurora-marquee>`,
    attributes: [['speed', 'Pixels per second (default 60)']],
    events: [],
    cssvars: [['--aurora-marquee-gap', 'Space between loop copies']],
    methods: [],
    tutorial: [
      {
        heading: '1 · End with a separator',
        text: 'Finish your content with a trailing dot or dash so the loop seam reads naturally.',
      },
    ],
  },
  {
    tag: 'aurora-tilt',
    title: 'Tilt',
    category: 'Motion & Interaction',
    summary:
      '3D perspective tilt that follows the pointer across the surface and eases back on leave.',
    example: `<aurora-tilt max="14">\n  <div style="padding:28px;border:1px solid rgba(255,255,255,.1);border-radius:14px">Tilt me</div>\n</aurora-tilt>`,
    attributes: [['max', 'Maximum tilt in degrees (default 12)']],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Cards love it',
        text: 'Wrap product cards or covers; keep max under ~16° to stay classy.',
      },
    ],
  },
  {
    tag: 'aurora-input',
    title: 'Text Input',
    category: 'Forms & Inputs',
    summary:
      'A text field with an animated focus underline; form-associated and event-transparent.',
    example: `<aurora-input label="Email" type="email" placeholder="you@example.com"></aurora-input>`,
    attributes: [
      ['label / type / placeholder / value / name / disabled', 'The essentials, passed through'],
    ],
    events: [['input / change', 'Re-emitted composed across the shadow boundary']],
    cssvars: [['--aurora-accent / -border / -muted / -input-bg', 'Underline and field styling']],
    methods: [['value / focus()', 'Programmatic access']],
    tutorial: [
      {
        heading: '1 · Forms just work',
        text: 'ElementInternals registers the value — FormData sees it like a native input.',
      },
    ],
  },
  {
    tag: 'aurora-switch',
    title: 'Switch',
    category: 'Forms & Inputs',
    summary:
      'An animated toggle with role="switch" — the thumb glides, the form gets its value when checked.',
    example: `<aurora-switch checked></aurora-switch>`,
    attributes: [
      ['checked / value / name / disabled', 'State, submitted value (default "on"), form field'],
    ],
    events: [['change', 'On toggle']],
    cssvars: [
      ['--aurora-accent / -switch-width / -switch-height / -switch-off', 'Colors and geometry'],
    ],
    methods: [['checked', 'Get/set state']],
    tutorial: [
      {
        heading: '1 · Label it',
        text: 'Wrap in a <label> with text beside it — clicks on the text toggle the switch.',
      },
    ],
  },
  {
    tag: 'aurora-slider',
    title: 'Slider',
    category: 'Forms & Inputs',
    summary:
      'A draggable, keyboard-accessible range slider with role="slider" and honest min/max/step math.',
    example: `<aurora-slider min="0" max="100" value="70" style="width:240px"></aurora-slider>`,
    attributes: [['min / max / step / value / name / disabled', 'Range configuration']],
    events: [
      ['input', 'While sliding'],
      ['change', 'On release / keyboard step'],
    ],
    cssvars: [['--aurora-accent / -slider-track', 'Fill and track']],
    methods: [['value', 'Get/set (clamped and snapped)']],
    tutorial: [
      {
        heading: '1 · Keyboard included',
        text: 'Arrows step, Home/End jump — focus the track and drive it without a pointer.',
      },
    ],
  },
  {
    tag: 'aurora-scramble',
    title: 'Scramble',
    category: 'Text & Typography',
    summary:
      'Text decodes through random glyphs, left to right — on scroll into view and again on hover.',
    example: `<aurora-scramble hover duration="1.2" style="font-family:monospace">TRANSMISSION DECODED</aurora-scramble>`,
    attributes: [
      ['duration', 'Seconds (default 1.2)'],
      ['chars', 'Custom glyph set'],
      ['hover', 'Replay on pointer enter'],
    ],
    events: [['aurora-complete', 'Decode finished']],
    cssvars: [],
    methods: [['play()', 'Run the decode (restarts mid-run)']],
    tutorial: [
      {
        heading: '1 · Mono sells it',
        text: 'A monospace font keeps the glyph churn from reflowing the layout.',
      },
    ],
  },
  {
    tag: 'aurora-typewriter',
    title: 'Typewriter',
    category: 'Text & Typography',
    summary: 'Types its text behind a blinking accent caret when scrolled into view.',
    example: `<aurora-typewriter speed="18" style="font-family:monospace">The platform types for itself.</aurora-typewriter>`,
    attributes: [
      ['speed', 'Characters per second (default 16)'],
      ['delay', 'Start delay'],
      ['no-caret', 'Hide the caret'],
    ],
    events: [['aurora-complete', 'Typing finished']],
    cssvars: [['--aurora-accent', 'Caret color']],
    methods: [['start()', 'Type now, regardless of visibility']],
    tutorial: [
      {
        heading: '1 · Reduced motion honored',
        text: 'Users who prefer reduced motion see the full text instantly, caret static.',
      },
    ],
  },
  {
    tag: 'aurora-reveal',
    title: 'Reveal',
    category: 'Scroll & Page',
    summary:
      'Fades and rises any content the first time it scrolls into view — IntersectionObserver, zero scroll listeners.',
    example: `<aurora-reveal stagger="0.12">\n  <div class="card">One</div>\n  <div class="card">Two</div>\n</aurora-reveal>`,
    attributes: [
      ['y / duration / delay', 'Motion controls (default 36px, 0.9s)'],
      ['stagger', 'Animate direct children in sequence'],
    ],
    events: [['aurora-reveal', 'Animation complete']],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · IO cannot miss',
        text: 'Unlike position-based triggers, the observer fires even after anchor jumps and scroll restoration.',
      },
    ],
  },
  {
    tag: 'aurora-counter',
    title: 'Counter',
    category: 'Scroll & Page',
    summary:
      'A number that counts up when seen — and re-tweens live whenever its value attribute changes.',
    example: `<aurora-counter value="62" style="font-size:2.4rem;font-weight:700"></aurora-counter>`,
    attributes: [
      ['value / from / duration / decimals', 'Target, start, timing, fixed-point places'],
    ],
    events: [['aurora-complete', 'Count landed']],
    cssvars: [],
    methods: [['start()', 'Count now, regardless of visibility']],
    tutorial: [
      {
        heading: '1 · Live data ready',
        text: 'Change the value attribute and it re-tweens from the current number — no re-mounting.',
      },
    ],
  },
  {
    tag: 'aurora-cursor',
    title: 'Cursor',
    category: 'Scroll & Page',
    summary:
      'A trailing glow ring that follows the pointer and grows over interactive elements — never hiding the system cursor.',
    example: `<aurora-cursor></aurora-cursor>`,
    attributes: [],
    events: [],
    cssvars: [['--aurora-cursor-size / -color / -active / -z', 'Ring geometry and colors']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Drop in once',
        text: 'Fine pointers only; touch devices and reduced-motion users get nothing extra. Mark custom targets with data-cursor.',
      },
    ],
  },
  {
    tag: 'aurora-spotlight',
    title: 'Spotlight',
    category: 'Visual & 3D',
    summary:
      'A card whose interior glow and 1px border beam follow the cursor — the treatment on this site’s feature grid.',
    example: `<aurora-spotlight style="padding:28px;border:1px solid rgba(255,255,255,.1);border-radius:16px">\n  Move your cursor over me.\n</aurora-spotlight>`,
    attributes: [],
    events: [],
    cssvars: [
      ['--aurora-spotlight-size / -color / -beam / -beam2 / -beam-size', 'Glow and beam tuning'],
    ],
    methods: [],
    tutorial: [
      {
        heading: '1 · Style the host',
        text: 'Give the host card styling — the layers inherit its border-radius automatically.',
      },
    ],
  },
  {
    tag: 'aurora-dock',
    title: 'Dock',
    category: 'Motion & Interaction',
    summary: 'Children magnify as the cursor approaches — the macOS dock as one wrapper element.',
    example: `<aurora-dock max="1.7" range="120">\n  <button class="tile">✦</button><button class="tile">◆</button><button class="tile">●</button>\n</aurora-dock>`,
    attributes: [
      ['max', 'Peak scale (default 1.6)'],
      ['range', 'Falloff distance px (default 110)'],
      ['lift', 'Rise at peak px (default 16)'],
    ],
    events: [],
    cssvars: [['--aurora-dock-gap', 'Space between items']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Anchor the bottom',
        text: 'Items scale from bottom-center, so align the dock to a baseline for the classic look.',
      },
    ],
  },
  {
    tag: 'aurora-ripple',
    title: 'Ripple',
    category: 'Motion & Interaction',
    summary: 'A soft ripple expands from the pointer on press, clipped to the wrapper’s radius.',
    example: `<aurora-ripple style="border-radius:14px">\n  <button style="padding:20px 34px">Click me</button>\n</aurora-ripple>`,
    attributes: [],
    events: [],
    cssvars: [['--aurora-ripple-color', 'Ripple tint']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Radius matters',
        text: 'Set border-radius on the host — the ripple overlay clips to it.',
      },
    ],
  },
  {
    tag: 'aurora-carousel',
    title: 'Carousel',
    category: 'Motion & Interaction',
    summary:
      'Drag or swipe with GSAP inertia and slide snapping; arrow keys and a programmatic API included.',
    example: `<aurora-carousel>\n  <div class="slide">01</div><div class="slide">02</div><div class="slide">03</div>\n</aurora-carousel>`,
    attributes: [],
    events: [['aurora-slide-change', '{ index }']],
    cssvars: [['--aurora-carousel-gap', 'Space between slides']],
    methods: [['next() / prev() / goTo(i)', 'Programmatic navigation']],
    tutorial: [
      {
        heading: '1 · Slides are children',
        text: 'Size them with CSS (flex: 0 0 auto widths); links inside stay safe — post-drag clicks are swallowed.',
      },
    ],
  },
  {
    tag: 'aurora-orbit',
    title: 'Orbit',
    category: 'Motion & Interaction',
    summary: 'Children revolve around optional slot="center" content — instant hero decoration.',
    example: `<aurora-orbit radius="72" speed="12" style="width:200px;height:200px">\n  <span slot="center">✦</span>\n  <span class="dot"></span><span class="dot"></span><span class="dot"></span>\n</aurora-orbit>`,
    attributes: [
      ['radius', 'Orbit radius px (default 80)'],
      ['speed', 'Seconds per revolution (default 14)'],
      ['reverse', 'Spin the other way'],
    ],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Size the host',
        text: 'The host box defines the stage; items distribute evenly and hold position under reduced motion.',
      },
    ],
  },
  {
    tag: 'aurora-glitch',
    title: 'Glitch',
    category: 'Text & Typography',
    summary:
      'An RGB-split, slice-clipped glitch burst over text — on scroll into view and on hover.',
    example: `<aurora-glitch hover style="font-size:1.8rem;font-weight:700">SIGNAL LOST</aurora-glitch>`,
    attributes: [['hover', 'Replay on pointer enter']],
    events: [],
    cssvars: [['--aurora-glitch-a / -b', 'The two split colors']],
    methods: [['play()', 'Run one burst']],
    tutorial: [
      {
        heading: '1 · One burst, not a loop',
        text: 'The effect runs ~half a second and resets clean — trigger it on meaningful moments.',
      },
    ],
  },
  {
    tag: 'aurora-progress',
    title: 'Scroll Progress',
    category: 'Scroll & Page',
    summary:
      'A fixed gradient hairline at the top of the viewport tracking reading position — rAF-throttled.',
    example: `<aurora-progress></aurora-progress>`,
    attributes: [],
    events: [],
    cssvars: [
      ['--aurora-progress-height / -z, --aurora-accent / -accent2', 'Bar size and gradient'],
    ],
    methods: [],
    tutorial: [
      {
        heading: '1 · It is on this page',
        text: 'Look at the very top of this window while you scroll — that is the component.',
      },
    ],
  },
  {
    tag: 'aurora-compare',
    title: 'Compare',
    category: 'Motion & Interaction',
    summary: 'A before/after slider — drag the divider or drive the keyboard-accessible handle.',
    example: `<aurora-compare value="50" style="height:200px">\n  <img slot="before" src="./og.jpg" alt="" style="filter:grayscale(1)" />\n  <img slot="after" src="./og.jpg" alt="" />\n</aurora-compare>`,
    attributes: [['value', 'Divider position 0–100 (default 50)']],
    events: [['aurora-change', '{ value }']],
    cssvars: [['--aurora-accent / -surface', 'Handle styling']],
    methods: [['value', 'Get/set the position']],
    tutorial: [
      {
        heading: '1 · Any two layers',
        text: 'Slots take any content — images, maps, themed variants of the same UI.',
      },
    ],
  },
  {
    tag: 'aurora-flip',
    title: 'Flip Card',
    category: 'Motion & Interaction',
    summary: 'A 3D flip between two faces — hover, click, or manual triggering.',
    example: `<aurora-flip>\n  <div slot="front" class="card">Hover to flip ✦</div>\n  <div slot="back" class="card">The back.</div>\n</aurora-flip>`,
    attributes: [['trigger', '"hover" (default), "click", or "manual"']],
    events: [['aurora-flip', '{ flipped }']],
    cssvars: [],
    methods: [['flip(force?)', 'Toggle or set a side']],
    tutorial: [
      {
        heading: '1 · Front sets the size',
        text: 'The back face fills the front’s box — keep both faces similar in content volume.',
      },
    ],
  },
  {
    tag: 'aurora-skeleton',
    title: 'Skeleton',
    category: 'Overlays & Feedback',
    summary:
      'Shimmering loading placeholders — block, circle, or paragraph lines with a short last line.',
    example: `<div style="display:flex;gap:14px;max-width:340px">\n  <aurora-skeleton circle style="width:44px;height:44px;flex:none"></aurora-skeleton>\n  <aurora-skeleton lines="3" style="flex:1"></aurora-skeleton>\n</div>`,
    attributes: [
      ['lines', 'Paragraph mode with n bars'],
      ['circle', 'Avatar mode'],
    ],
    events: [],
    cssvars: [['--aurora-skeleton-base / -shine / -radius', 'Colors and shape']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Match the layout',
        text: 'Mirror the real content’s shapes so the swap-in does not jump.',
      },
    ],
  },
  {
    tag: 'aurora-confetti',
    title: 'Confetti',
    category: 'Overlays & Feedback',
    summary:
      'A celebration cannon on a full-viewport canvas — gravity, drag, spin, and a self-stopping loop.',
    example: `<aurora-button onclick="AuroraConfetti.burst({ count: 120 })">Celebrate 🎉</aurora-button>`,
    attributes: [],
    events: [],
    cssvars: [['--aurora-confetti-z', 'Overlay layering']],
    methods: [
      [
        'burst({ x, y, count, colors }) / static AuroraConfetti.burst()',
        'Fire from a point (defaults to upper middle)',
      ],
    ],
    tutorial: [
      {
        heading: '1 · Aim it',
        text: 'Pass the button’s rect center as x/y so the burst erupts from the click.',
      },
    ],
  },
  {
    tag: 'aurora-beam',
    title: 'Border Beam',
    category: 'Visual & 3D',
    summary:
      'A luminous beam travelling the border of any card, continuously — no cursor required.',
    example: `<aurora-beam speed="4" style="border-radius:16px">\n  <div style="padding:28px;border:1px solid rgba(255,255,255,.1);border-radius:16px">Always in motion.</div>\n</aurora-beam>`,
    attributes: [['speed', 'Seconds per lap (default 5)']],
    events: [],
    cssvars: [['--aurora-beam-color / -color2 / -thickness / -angle', 'Beam palette and width']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Spotlight’s sibling',
        text: 'Spotlight follows the cursor; the beam runs on its own — pick per context.',
      },
    ],
  },
  {
    tag: 'aurora-parallax',
    title: 'Parallax',
    category: 'Motion & Interaction',
    summary:
      'Children with data-depth drift toward the pointer at their own depth and settle back on leave.',
    example: `<aurora-parallax strength="30" style="height:150px;display:grid;place-items:center">\n  <span data-depth="0.3">back</span>\n  <strong data-depth="0.9">front</strong>\n</aurora-parallax>`,
    attributes: [['strength', 'Max travel px (default 24)']],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Depth 0–1',
        text: 'Small depths barely move (background), 1 rides the pointer (foreground).',
      },
    ],
  },
  {
    tag: 'aurora-shine',
    title: 'Shine',
    category: 'Text & Typography',
    summary: 'A soft highlight sweeps across text on a loop — quiet emphasis for headings.',
    example: `<aurora-shine speed="2.6" style="font-size:1.7rem;font-weight:700">Polished by default.</aurora-shine>`,
    attributes: [['speed', 'Seconds per sweep (default 3)']],
    events: [],
    cssvars: [['--aurora-shine-color / -highlight', 'Base and sweep colors']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Static under reduced motion',
        text: 'The sweep pauses for reduced-motion users; the text stays styled.',
      },
    ],
  },
  {
    tag: 'aurora-lens',
    title: 'Lens',
    category: 'Visual & 3D',
    summary:
      'An image that liquifies toward the cursor with a chromatic fringe — raw WebGL over a real <img> that keeps a11y, SEO, and no-WebGL environments intact.',
    example: `<aurora-lens src="./og.jpg" alt="Aurora artwork" style="height:220px;display:block;border-radius:14px;overflow:hidden"></aurora-lens>`,
    attributes: [
      ['src / alt / crossorigin', 'The image (alt is required manners)'],
      ['strength', 'Distortion multiplier'],
    ],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Progressive by design',
        text: 'GPU work defers until visible and rebuilds on context restore; without WebGL, the plain image simply shows.',
      },
    ],
  },
  {
    tag: 'aurora-scene',
    title: '3D Scene',
    category: 'Visual & 3D',
    summary: 'A rotating wireframe icosahedron backdrop — the original aurora/three component.',
    example: `<aurora-scene color="#6d5cff" speed="1.2" style="height:220px"></aurora-scene>`,
    attributes: [['color / detail / speed', 'Wireframe styling and rotation']],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Opt-in entry',
        text: "import 'aurora/three' registers it — the core bundle never pays for Three.js.",
      },
    ],
  },
  {
    tag: 'aurora-particles',
    title: 'Particles',
    category: 'Visual & 3D',
    summary:
      'A drifting GPU particle field with additive glow, a two-tone gradient, and pointer parallax.',
    example: `<aurora-particles count="2200" color="#6d5cff" color2="#22d3ee" style="height:240px"></aurora-particles>`,
    attributes: [['count / color / color2 / size / speed', 'Field density, palette, motion']],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Also on aurora/three',
        text: 'Lazy-load the entry as the section approaches — exactly what this site does.',
      },
    ],
  },
  {
    tag: 'aurora-wave',
    title: 'Wave',
    category: 'Visual & 3D',
    summary:
      'A wireframe ocean — travelling sine waves across a displaced plane, viewed from a low angle.',
    example: `<aurora-wave speed="1" amplitude="0.4" style="height:240px"></aurora-wave>`,
    attributes: [['color / speed / amplitude / opacity', 'Grid palette and wave motion']],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Hold still politely',
        text: 'Reduced-motion users get a single displaced frame — the geometry, without the churn.',
      },
    ],
  },
  {
    tag: 'aurora-daterange',
    title: 'Date Range',
    category: 'Forms & Inputs',
    summary:
      'Pick a span in one grid: first click starts it, second ends it (reversed picks swap themselves), and the range highlights with shaped edges.',
    example: `<aurora-daterange placeholder="Pick a range"></aurora-daterange>`,
    attributes: [
      ['start / end', 'ISO dates (yyyy-mm-dd)'],
      ['placeholder / name', 'Trigger text; form fields submit as name-start / name-end'],
    ],
    events: [['aurora-change', '{ start, end } once both ends are set']],
    cssvars: [['--aurora-accent / -surface / -border / -muted', 'Grid and range styling']],
    methods: [
      ['start / end', 'Read the current range'],
      ['open() / close()', 'Programmatic control'],
    ],
    tutorial: [
      {
        heading: '1 · Two clicks, one range',
        text: 'The hint under the grid tells the user which end they are picking; reversed picks are swapped silently.',
      },
    ],
  },
  {
    tag: 'aurora-gauge',
    title: 'Gauge',
    category: 'Enterprise & Data',
    summary:
      'Arc, circular, and linear gauges in one SVG element — the value sweeps into view, re-tweens on change, and reports itself as a proper meter.',
    example: `<div style="display:flex;gap:26px;align-items:center;flex-wrap:wrap">\n  <aurora-gauge type="arc" value="72" label="CPU" unit="%"></aurora-gauge>\n  <aurora-gauge type="circular" value="48" label="Memory" unit="%" style="--aurora-gauge-color:#22d3ee"></aurora-gauge>\n</div>`,
    attributes: [
      ['type', '"arc" (default), "circular", "linear"'],
      ['value / min / max', 'The measurement (re-tweens on change)'],
      ['label / unit', 'Caption and suffix'],
    ],
    events: [],
    cssvars: [['--aurora-gauge-color / -track', 'Sweep and track colors']],
    methods: [['value', 'Get/set (animates)']],
    tutorial: [
      {
        heading: '1 · Dashboards in minutes',
        text: 'Pair gauges with aurora-sparkline and aurora-grid — update value attributes from your poll loop and they animate themselves.',
      },
    ],
  },
  {
    tag: 'aurora-buttongroup',
    title: 'Button Group',
    category: 'Actions & Navigation',
    summary:
      'A segmented control: options in, one active segment out, with aria-pressed state and a pop on change.',
    example: `<aurora-buttongroup value="week">\n  <option value="day">Day</option>\n  <option value="week">Week</option>\n  <option value="month">Month</option>\n</aurora-buttongroup>`,
    attributes: [['value', 'Initially active segment']],
    events: [['aurora-change', '{ value }']],
    cssvars: [['--aurora-accent / -border / -radius / -muted', 'Segment styling']],
    methods: [['value', 'Get/set the active segment']],
    tutorial: [
      {
        heading: '1 · View switchers',
        text: 'Day/Week/Month over a scheduler, grid density toggles — anywhere a radio group wants to look like buttons.',
      },
    ],
  },
  {
    tag: 'aurora-splitbutton',
    title: 'Split Button',
    category: 'Actions & Navigation',
    summary:
      'A primary action with an attached dropdown of alternatives — deploy now, or pick a variant from the arrow.',
    example: `<aurora-splitbutton label="Deploy">\n  <option value="staging">Deploy to staging</option>\n  <option value="canary">Canary release</option>\n  <option value="rollback">Rollback</option>\n</aurora-splitbutton>`,
    attributes: [
      ['label', 'Main button text'],
      ['value', 'Payload for aurora-click (defaults to the label)'],
    ],
    events: [
      ['aurora-click', 'Main action'],
      ['aurora-select', '{ value } from the menu'],
    ],
    cssvars: [['--aurora-accent / -accent-hover / -surface / -radius', 'Button and panel styling']],
    methods: [['open() / close() / toggle()', 'Menu control']],
    tutorial: [
      {
        heading: '1 · Default + variants',
        text: 'Wire aurora-click to the common case and aurora-select to the alternatives — one element, whole deploy menu.',
      },
    ],
  },
  {
    tag: 'aurora-colorpicker',
    title: 'Color Picker',
    category: 'Forms & Inputs',
    summary:
      'A full HSV picker built from CSS gradients — drag the area and hue strip, type a hex, or tap a swatch preset. Form-associated, keyboard-adjustable.',
    example: `<aurora-colorpicker value="#6d5cff" swatches="#6d5cff,#22d3ee,#34d399,#fbbf24,#f43f5e"></aurora-colorpicker>`,
    attributes: [
      ['value', 'Initial 6-digit hex'],
      ['swatches', 'Comma-separated hex presets'],
      ['name', 'Form field name (submits the hex)'],
    ],
    events: [['aurora-change', '{ value } — on drag, arrows, hex commit, swatch']],
    cssvars: [['--aurora-field / -border / -accent', 'Field and focus styling']],
    methods: [['value', 'Get/set the current hex']],
    tutorial: [
      {
        heading: '1 · Theme pickers',
        text: 'Wire aurora-change to a CSS variable — document.documentElement.style.setProperty("--aurora-accent", e.detail.value) — and the whole library re-themes live.',
      },
    ],
  },
  {
    tag: 'aurora-qrcode',
    title: 'QR Code',
    category: 'Enterprise & Data',
    summary:
      'A dependency-free QR generator — the whole encoder (Reed-Solomon, masking, versions 1-10) lives in the library and renders as crisp SVG.',
    example: `<aurora-qrcode value="https://auroralib.com" style="width:150px"></aurora-qrcode>`,
    attributes: [
      ['value', 'The payload (URL, text — up to ~270 bytes at level L)'],
      ['level', 'Error correction: "L", "M" (default), "Q", "H"'],
    ],
    events: [['aurora-error', '{ reason: "capacity" } when the payload is too large']],
    cssvars: [['--aurora-qr-bg / -fg', 'Tile and module colors']],
    methods: [['encodeQr(text, level)', 'Exported raw encoder — returns the module matrix']],
    tutorial: [
      {
        heading: '1 · Share anything',
        text: 'Point value at a URL, a Wi-Fi string (WIFI:T:WPA;S:name;P:pass;;), or a vCard. Higher EC levels survive more damage but hold less data.',
      },
    ],
  },
  {
    tag: 'aurora-avatar',
    title: 'Avatar',
    category: 'Overlays & Feedback',
    summary:
      'Image avatars that never break: no src (or a failed load) falls back to initials on a gradient derived from the name, so the same person always gets the same color.',
    example: `<div style="display:flex;gap:14px;align-items:center">\n  <aurora-avatar name="Ada Lovelace" status="online"></aurora-avatar>\n  <aurora-avatar name="Grace Hopper" status="busy" square></aurora-avatar>\n  <aurora-avatar name="Alan Turing" style="--aurora-avatar-size:56px"></aurora-avatar>\n</div>`,
    attributes: [
      ['name', 'Initials source + deterministic gradient hue'],
      ['src', 'Image URL (falls back to initials on error)'],
      ['status', '"online", "away", "busy", "offline" dot'],
      ['square', 'Rounded-square shape'],
    ],
    events: [],
    cssvars: [['--aurora-avatar-size', 'Diameter (default 44px)']],
    methods: [],
    tutorial: [
      {
        heading: '1 · People everywhere',
        text: 'Drop avatars in grid cells, scheduler events, and comment threads — the deterministic hue keeps each person recognizable without any image at all.',
      },
    ],
  },
  {
    tag: 'aurora-badge',
    title: 'Badge',
    category: 'Overlays & Feedback',
    summary:
      'Notification badges that pop when the count changes — overlay a pill on anything you wrap, cap at "99+", hide at zero, or go minimal with a dot.',
    example: `<div style="display:flex;gap:26px;align-items:center">\n  <aurora-badge value="7"><button class="btn">Inbox</button></aurora-badge>\n  <aurora-badge value="120" tone="danger"><button class="btn">Alerts</button></aurora-badge>\n  <aurora-badge dot tone="success"><button class="btn">Chat</button></aurora-badge>\n  <aurora-badge value="NEW" tone="warn"></aurora-badge>\n</div>`,
    attributes: [
      ['value', 'Count or text (numbers above max show "max+")'],
      ['max', 'Cap (default 99)'],
      ['dot', 'Tiny dot instead of a pill'],
      ['tone', '"accent", "success", "danger", "warn", "neutral"'],
      ['show-zero', 'Keep the pill visible at 0'],
    ],
    events: [],
    cssvars: [['--aurora-bg', 'Ring color around overlaid pills']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Live counts',
        text: 'Update the value attribute from your socket handler — the badge re-renders and pops on every change, and disappears at zero.',
      },
    ],
  },
  {
    tag: 'aurora-treelist',
    title: 'TreeList',
    category: 'Enterprise & Data',
    summary:
      'A hierarchical data grid — nested rows with animated expand/collapse, sibling-group sorting that never breaks the hierarchy, and treeview-style keyboard navigation.',
    example: `<aurora-treelist id="docTreelist" selectable></aurora-treelist>`,
    attributes: [
      ['columns (property)', '{ field, title?, width?, align?, sortable?, formatter? }[]'],
      ['data (property)', 'Nested children arrays, or flat rows with id/parent fields'],
      ['id-field / parent-field', 'Flat-data keys (default "id" / "parentId")'],
      ['selectable / dense / collapsed', 'Row selection, compact rows, start collapsed'],
    ],
    events: [
      ['aurora-toggle', '{ row, expanded }'],
      ['aurora-sort', '{ field, dir }'],
      ['aurora-select', '{ row }'],
    ],
    cssvars: [['--aurora-grid-height / -radius / -surface', 'Shared grid theming']],
    methods: [['expandAll() / collapseAll()', 'Branch control']],
    tutorial: [
      {
        heading: '1 · File trees, org charts, BOMs',
        text: 'Anything with parent/child structure drops straight in — pass flat database rows with parentId and the component assembles the tree for you.',
      },
      {
        heading: '2 · Sorting stays sane',
        text: 'Header clicks sort within each sibling group recursively, so children always stay under their parents.',
      },
    ],
  },
  {
    tag: 'aurora-timeline',
    title: 'Timeline',
    category: 'Scroll & Page',
    summary:
      'A vertical milestone timeline — the spine draws itself as it scrolls into view, dots pop, and each card slides in when it becomes visible.',
    example: `<aurora-timeline>\n  <aurora-timeline-item date="Jan 2026" heading="v0.1 — foundation">Five GSAP components and a base class.</aurora-timeline-item>\n  <aurora-timeline-item date="Apr 2026" heading="The enterprise track" color="#22d3ee">Grid, editors, scheduler.</aurora-timeline-item>\n  <aurora-timeline-item date="Jul 2026" heading="Seventy-two components" color="#34d399">TreeList closes the catalogue's big rocks.</aurora-timeline-item>\n</aurora-timeline>`,
    attributes: [
      ['item: date / heading', 'Milestone label and title'],
      ['item: color', 'Dot tint for that milestone'],
    ],
    events: [],
    cssvars: [['--aurora-timeline-dot / -surface / -border', 'Dot and card theming']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Changelogs that sell',
        text: 'Body content is slotted HTML — drop in links, code, even other aurora components. Each item reveals independently, so long histories stay lively.',
      },
    ],
  },
  {
    tag: 'aurora-wizard',
    title: 'Wizard',
    category: 'Actions & Navigation',
    summary:
      'Multi-step flows with a built-in stepper, animated direction-aware transitions, and a cancelable gate so you can validate each step before letting the user through.',
    example: `<aurora-wizard>\n  <aurora-wizard-step label="Account">Email + password fields…</aurora-wizard-step>\n  <aurora-wizard-step label="Profile">Handle, avatar…</aurora-wizard-step>\n  <aurora-wizard-step label="Review">Summary before submit.</aurora-wizard-step>\n</aurora-wizard>`,
    attributes: [
      ['step: label', 'Stepper caption for that page'],
      ['linear', '"false" allows jumping ahead via stepper dots'],
      ['back-label / next-label / finish-label', 'Button text'],
      ['index', 'Starting step'],
    ],
    events: [
      ['aurora-next', 'Cancelable — preventDefault() to block advancing'],
      ['aurora-change', '{ index, label }'],
      ['aurora-finish', 'Cancelable — fired by the Finish button'],
    ],
    cssvars: [['--aurora-wizard-height', 'Fixed panel height to stop reflow']],
    methods: [
      ['next() / prev() / goTo(i)', 'Programmatic navigation'],
      ['index', 'Get/set the current step'],
    ],
    tutorial: [
      {
        heading: '1 · Validate as you go',
        text: "Listen for aurora-next, check the active step's fields, and preventDefault() to hold the user — the wizard never advances past invalid input.",
      },
    ],
  },
  {
    tag: 'aurora-signature',
    title: 'Signature',
    category: 'Forms & Inputs',
    summary:
      'A signature pad that draws smoothed SVG strokes and submits them with your form as a data URL — resolution-independent ink with clear, undo, and restore.',
    example: `<aurora-signature name="signature"></aurora-signature>`,
    attributes: [
      ['name', 'Form field name (submits an SVG data URL)'],
      ['placeholder', 'Hint text (default "Sign here")'],
      ['stroke-width', 'Ink width (default 2.5)'],
    ],
    events: [['aurora-change', '{ value, strokes } after each stroke, undo, or clear']],
    cssvars: [['--aurora-signature-color / -field / -border', 'Ink and pad styling']],
    methods: [
      ['clear() / undo()', 'Ctrl+Z works too'],
      ['addStroke(points) / strokes', 'Restore or read ink (400×160 space)'],
      ['toSvg() / toDataUrl()', 'Serialize'],
    ],
    tutorial: [
      {
        heading: '1 · Contracts and consent',
        text: 'The submitted value is a self-contained SVG data URL — store it as text, render it anywhere with an <img>, no raster blur at any size.',
      },
    ],
  },
  {
    tag: 'aurora-listview',
    title: 'ListView',
    category: 'Enterprise & Data',
    summary:
      'A templated, data-bound list — bring a row template, get staggered entrances, paging, and keyboard-navigable selection for free.',
    example: `<aurora-listview id="docListview" selectable page-size="4" style="width:100%;max-width:420px"></aurora-listview>`,
    attributes: [
      ['data (property)', 'Array of row objects'],
      ['template (property)', '(row) => HTML string'],
      ['selectable', 'Present for single, "multiple" for multi'],
      ['page-size', 'Rows per page (0 = all)'],
    ],
    events: [['aurora-select', '{ rows } — the currently selected rows']],
    cssvars: [['--aurora-grid-height / -radius / -surface', 'Shared list theming']],
    methods: [['rows', 'Selected rows getter']],
    tutorial: [
      {
        heading: '1 · Cards, feeds, results',
        text: 'The template returns any HTML — compose aurora-avatar and aurora-badge inside rows for instant contact lists and inboxes.',
      },
    ],
  },
  {
    tag: 'aurora-sortable',
    title: 'Sortable',
    category: 'Motion & Interaction',
    summary:
      'Drag-to-reorder for anything — the lifted item floats with a shadow while its siblings FLIP smoothly out of the way. Keyboard: Ctrl/⌘ + arrows.',
    example: `<aurora-sortable style="display:grid;gap:10px;width:100%;max-width:380px">\n  <div class="row-card">Design the API</div>\n  <div class="row-card">Write the tests</div>\n  <div class="row-card">Ship it</div>\n</aurora-sortable>`,
    attributes: [],
    events: [['aurora-reorder', '{ from, to, item } — from is -1 for pointer drops']],
    cssvars: [],
    methods: [
      ['move(from, to)', 'Programmatic reorder'],
      ['items()', 'Current order'],
    ],
    tutorial: [
      {
        heading: '1 · Task boards and playlists',
        text: 'Persist order in the aurora-reorder handler — read items() and save their ids. Works with any child markup, cards included.',
      },
    ],
  },
  {
    tag: 'aurora-chat',
    title: 'Chat',
    category: 'Enterprise & Data',
    summary:
      'A conversation view with sided bubbles, avatar initials, a typing indicator, and a composer — wire aurora-send to your backend and messages spring in.',
    example: `<aurora-chat id="docChat" style="width:100%;max-width:420px"></aurora-chat>`,
    attributes: [
      ['messages (property)', '{ text, who: "me"|"them", name?, time? }[]'],
      ['typing', 'Shows the bouncing indicator'],
      ['placeholder / send-label', 'Composer text'],
    ],
    events: [['aurora-send', '{ text } — after local echo']],
    cssvars: [['--aurora-chat-height / -accent / -field', 'Sizing and bubble colors']],
    methods: [['add(msg)', 'Append one message (animates in)']],
    tutorial: [
      {
        heading: '1 · Bots and support',
        text: 'On aurora-send, POST to your backend, flip the typing attribute on, then add() the reply and flip it off — the whole conversational loop in three lines.',
      },
    ],
  },
  {
    tag: 'aurora-loader',
    title: 'Loader',
    category: 'Overlays & Feedback',
    summary:
      'Indeterminate spinners in three flavors — ring, dots, pulse — with labels and status semantics.',
    example: `<div style="display:flex;gap:34px;align-items:center">\n  <aurora-loader label="Loading"></aurora-loader>\n  <aurora-loader type="dots" label="Syncing"></aurora-loader>\n  <aurora-loader type="pulse" label="Connecting"></aurora-loader>\n</div>`,
    attributes: [
      ['type', '"ring" (default), "dots", "pulse"'],
      ['label', 'Caption below the spinner'],
    ],
    events: [],
    cssvars: [['--aurora-loader-size', 'Spinner diameter (default 34px)']],
    methods: [],
    tutorial: [
      {
        heading: '1 · Pair with skeleton',
        text: 'Use aurora-skeleton for content placeholders and aurora-loader for actions in flight.',
      },
    ],
  },
  {
    tag: 'aurora-progressbar',
    title: 'Progress Bar',
    category: 'Overlays & Feedback',
    summary:
      'A determinate bar that tweens to every value change with a live percentage — or sweeps forever in indeterminate mode.',
    example: `<div style="display:grid;gap:22px;width:100%;max-width:340px">\n  <aurora-progressbar value="64" label="Uploading"></aurora-progressbar>\n  <aurora-progressbar indeterminate label="Processing"></aurora-progressbar>\n</div>`,
    attributes: [
      ['value / max', 'Progress (re-tweens on change)'],
      ['indeterminate', 'Sweeping mode'],
      ['label', 'Caption'],
    ],
    events: [],
    cssvars: [['--aurora-progressbar-color / -track / -height', 'Bar theming']],
    methods: [['value', 'Get/set (animates)']],
    tutorial: [
      {
        heading: '1 · Real progress',
        text: 'Point value at your upload/onprogress handler — the fill and percentage animate to each report.',
      },
    ],
  },
  {
    tag: 'aurora-contextmenu',
    title: 'Context Menu',
    category: 'Actions & Navigation',
    summary:
      'Right-click menus for any element — cursor-positioned and viewport-clamped, with icons, separators, disabled items, and the clicked element passed to your handler.',
    example: `<div id="ctxZone" style="padding:38px;border:1.5px dashed var(--border);border-radius:14px">Right-click inside this zone</div>\n<aurora-contextmenu for="ctxZone">\n  <option value="copy" icon="⧉">Copy</option>\n  <option value="rename" icon="✎">Rename</option>\n  <hr />\n  <option value="delete" icon="✕">Delete</option>\n</aurora-contextmenu>`,
    attributes: [
      ['for', 'Target element id (defaults to the parent element)'],
      ['option: value / icon / disabled', 'Item payload, glyph, state'],
    ],
    events: [['aurora-select', '{ value, context } — context is the right-clicked node']],
    cssvars: [['--aurora-menu-z / -surface / -border', 'Stacking and panel styling']],
    methods: [['openAt(x, y, context?) / close()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Per-row actions',
        text: 'Attach one menu to a whole grid or listview and read detail.context to know which row was clicked — no per-row wiring.',
      },
    ],
  },
  {
    tag: 'aurora-checkbox',
    title: 'Checkbox',
    category: 'Forms & Inputs',
    summary:
      'A form-associated checkbox whose check draws itself on — with an indeterminate state for "some selected" trees and tables.',
    example: `<div style="display:grid;gap:14px">\n  <aurora-checkbox label="Email me updates" checked></aurora-checkbox>\n  <aurora-checkbox label="Some selected" indeterminate></aurora-checkbox>\n  <aurora-checkbox label="Disabled" disabled></aurora-checkbox>\n</div>`,
    attributes: [
      ['checked', 'Source of truth (reflected)'],
      ['indeterminate', 'Mixed state — cleared on first toggle'],
      ['label / value / name / disabled', 'Caption, submitted value, form name, state'],
    ],
    events: [['aurora-change', '{ checked }']],
    cssvars: [['--aurora-accent / -border / -field', 'Box styling']],
    methods: [
      ['checked', 'Get/set'],
      ['toggle()', 'Programmatic flip'],
    ],
    tutorial: [
      {
        heading: '1 · Select-all patterns',
        text: 'Bind a header checkbox\'s indeterminate attribute to "some but not all rows selected" — aurora-grid\'s selection events give you the counts.',
      },
    ],
  },
  {
    tag: 'aurora-radiogroup',
    title: 'Radio Group',
    category: 'Forms & Inputs',
    summary:
      'A WAI-ARIA radio group — arrows move and select with wrap-around, the dot pops in, and the value submits with your form.',
    example: `<aurora-radiogroup value="p" name="plan">\n  <option value="s">Starter</option>\n  <option value="p">Pro</option>\n  <option value="e">Enterprise</option>\n</aurora-radiogroup>`,
    attributes: [
      ['value', 'Selected option'],
      ['inline', 'Horizontal layout'],
      ['name', 'Form field name'],
    ],
    events: [['aurora-change', '{ value }']],
    cssvars: [['--aurora-accent / -border / -field', 'Dot styling']],
    methods: [['value', 'Get/set the selection']],
    tutorial: [
      {
        heading: '1 · Plans and options',
        text: 'Keyboard users get the native pattern for free: Tab reaches the group once, arrows change the choice.',
      },
    ],
  },
  {
    tag: 'aurora-textarea',
    title: 'Text Area',
    category: 'Forms & Inputs',
    summary:
      'A textarea that grows with its content and counts characters live against maxlength — form-associated, with input/change crossing the shadow boundary.',
    example: `<aurora-textarea label="Bio" placeholder="Tell us about yourself…" maxlength="280"></aurora-textarea>`,
    attributes: [
      ['label / placeholder / value', 'Caption, hint, seed content'],
      ['maxlength', 'Enables the live counter'],
      ['resizable', 'Restore the manual drag handle'],
      ['name', 'Form field name'],
    ],
    events: [['input / change', 'Native events, re-emitted composed']],
    cssvars: [
      ['--aurora-textarea-rows', 'Minimum height in rows (default 3)'],
      ['--aurora-field / -border / -accent', 'Field styling'],
    ],
    methods: [
      ['value', 'Get/set'],
      ['focus()', 'Focus the inner control'],
    ],
    tutorial: [
      {
        heading: '1 · Tweets and bios',
        text: 'The counter turns red at the limit; the field never scrolls internally, so the page grows naturally with the content.',
      },
    ],
  },
  {
    tag: 'aurora-toaster',
    title: 'Toasts',
    category: 'Overlays & Feedback',
    summary:
      'A glassmorphic toast stack with variant icon badges, an optional title, and a progress hairline that doubles as the dismissal timer — hovering pauses both.',
    example: `<aurora-button onclick="AuroraToaster.show('Everything is live.', { title: 'Deployed', variant: 'success' })">Show toast</aurora-button>`,
    attributes: [
      ['position', 'bottom-right (default) / top-right / bottom-left / top-left'],
      ['duration', 'Default auto-dismiss in ms (0 keeps toasts open)'],
    ],
    events: [['aurora-dismiss', 'A toast left the stack']],
    cssvars: [['--aurora-toast-z / -success / -error', 'Layering and variant tones']],
    methods: [
      ['show(msg, { title, variant, duration })', 'Add a toast; returns its element'],
      ['dismiss(el)', 'Animate one out'],
      ['AuroraToaster.show(...)', 'Static: uses a shared auto-created toaster'],
    ],
    tutorial: [
      {
        heading: '1 · One line, anywhere',
        text: 'The static helper lazily creates a shared stack in the corner.',
        code: `import { AuroraToaster } from 'aurora'\nAuroraToaster.show('Saved.', { variant: 'success' })`,
      },
      {
        heading: '2 · Own the placement',
        text: 'Place an element yourself to choose a corner and default duration.',
        code: `<aurora-toaster position="top-right" duration="6000"></aurora-toaster>`,
      },
    ],
  },
  {
    tag: 'aurora-modal',
    title: 'Modal',
    category: 'Overlays & Feedback',
    summary:
      'An animated dialog with real focus discipline: focus moves in on open, Tab is trapped at shadow-host granularity, Escape and backdrop clicks close, and focus returns to the opener.',
    example: `<aurora-button onclick="document.getElementById('docdlg').show()">Open modal</aurora-button>\n<aurora-modal id="docdlg">\n  <h2 style="margin-top:0">Hello</h2>\n  <p>Press Escape or click the backdrop.</p>\n</aurora-modal>`,
    attributes: [['open', 'Present while shown (toggle it or use the methods)']],
    events: [['aurora-open / aurora-close', 'Lifecycle']],
    cssvars: [
      [
        '--aurora-modal-z / -backdrop / -padding, --aurora-surface / -radius-lg',
        'Layering and panel style',
      ],
    ],
    methods: [['show() / hide()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Content is yours',
        text: 'Anything slotted becomes the dialog body; the first focusable element receives focus on open.',
      },
      {
        heading: '2 · Accessibility included',
        text: 'role=dialog, aria-modal, Tab trap and focus restore are built in — no wiring.',
      },
    ],
  },
  {
    tag: 'aurora-command',
    title: 'Command Palette',
    category: 'Actions & Navigation',
    summary:
      'A ⌘K command palette: global hotkey, type-to-filter over labels and keywords, arrow/Enter/Escape flow, hover-to-activate, and focus restore. This site runs on one.',
    example: `<aurora-button onclick="document.getElementById('sitePalette') ? document.getElementById('sitePalette').show() : AuroraToaster.show('Palette lives on the main pages — press Ctrl+K there.')">Try the palette</aurora-button>`,
    attributes: [
      ['hotkey', 'Cmd/Ctrl + this key opens it (default "k"; "none" disables)'],
      ['placeholder', 'Search input placeholder'],
    ],
    events: [
      ['aurora-select', '{ value } of the chosen command'],
      ['aurora-open / aurora-close', 'Lifecycle'],
    ],
    cssvars: [
      ['--aurora-command-z, --aurora-surface / -border / -muted', 'Layering and panel style'],
    ],
    methods: [['show() / hide() / toggle()', 'Programmatic control']],
    tutorial: [
      {
        heading: '1 · Commands are buttons',
        text: 'Child <button data-value data-keywords> elements are the commands; filtering searches both label and keywords.',
      },
      {
        heading: '2 · Route the selection',
        text: 'One aurora-select listener switches on value — navigate, toast, celebrate.',
        code: `palette.addEventListener('aurora-select', (e) => run(e.detail.value))`,
      },
    ],
  },
  {
    tag: 'aurora-nebula',
    title: 'Nebula',
    category: 'Visual & 3D',
    summary:
      'The aurora-borealis backdrop from this site’s hero — a ~2 kB raw-WebGL fragment shader with zero 3D-library dependency, deferred GPU boot, and context-loss recovery.',
    example: `<aurora-nebula speed="1.3" style="height: 220px; border-radius: 14px; overflow: hidden; display:block"></aurora-nebula>`,
    attributes: [
      ['color / color2 / color3', 'Curtain palette (hex)'],
      ['speed', 'Animation speed multiplier'],
      ['glow', 'Curtain intensity'],
      ['still', 'Render a single static frame'],
    ],
    events: [],
    cssvars: [],
    methods: [],
    tutorial: [
      {
        heading: '1 · Size the host, get a sky',
        text: 'It fills whatever box you give it; pixel ratio is capped at 2 and rendering pauses off-screen and in hidden tabs.',
      },
      {
        heading: '2 · Respect every user',
        text: 'prefers-reduced-motion gets a still frame; lost WebGL contexts rebuild automatically when restored.',
      },
    ],
  },
]
