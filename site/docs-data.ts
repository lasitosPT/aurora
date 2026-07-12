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
