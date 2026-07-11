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
