import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { makeXlsx } from '../core/xlsx'

const STYLE = `
  :host {
    display: block;
    font-size: 0.92rem;
    color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: var(--aurora-grid-radius, 14px);
    background: var(--aurora-surface, #14141f);
    overflow: hidden;
  }
  .viewport { overflow: auto; max-height: var(--aurora-grid-height, none); }
  table { width: 100%; border-collapse: collapse; }
  thead { position: sticky; top: 0; z-index: 2; background: var(--aurora-surface, #14141f); }
  th, td {
    text-align: left;
    padding: 0.65rem 0.9rem;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
    white-space: nowrap;
  }
  th { font-weight: 600; user-select: none; }
  .sort-btn {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font: inherit;
  }
  .sort-btn:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .arrow { font-size: 0.7em; opacity: 0; transition: opacity 0.15s ease; }
  th[aria-sort='ascending'] .arrow, th[aria-sort='descending'] .arrow { opacity: 1; color: var(--aurora-accent, #6d5cff); }
  .filters input {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    min-width: 60px;
    font: inherit;
    font-size: 0.85em;
    color: inherit;
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.03);
  }
  .filters input:focus { border-color: var(--aurora-accent, #6d5cff); }
  .fwrap { display: flex; align-items: center; gap: 4px; }
  .fop {
    all: unset; cursor: pointer; flex: none; width: 20px; height: 22px;
    display: inline-grid; place-items: center; border-radius: 6px;
    font-size: 0.8em; color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
  }
  .fop:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  .fop:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .fz { position: sticky; z-index: 1; background: var(--aurora-surface, #14141f); }
  thead .fz { z-index: 3; }
  tbody tr:hover .fz { background: color-mix(in srgb, var(--aurora-surface, #14141f) 90%, white); }
  tbody tr[aria-selected='true'] .fz { background: color-mix(in srgb, var(--aurora-surface, #14141f) 82%, var(--aurora-accent, #6d5cff)); }
  .fz-edge { box-shadow: inset -7px 0 7px -7px rgba(0, 0, 0, 0.6); }
  td.editing input.invalid { outline: 2px solid var(--aurora-danger, #f43f5e); border-radius: 5px; }
  :host([selectable='cell']) td[data-cell] { cursor: cell; }
  td[data-cell][aria-selected='true'] {
    background: rgba(109, 92, 255, 0.2) !important;
    outline: 1.5px solid var(--aurora-accent, #6d5cff); outline-offset: -1.5px;
  }
  .colmenu-btn {
    all: unset; cursor: pointer; margin-left: 6px; width: 17px; height: 17px;
    display: inline-grid; place-items: center; border-radius: 5px; font-size: 0.75em;
    color: var(--aurora-muted, #9a98b3); vertical-align: middle;
  }
  .colmenu-btn:hover { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.08); }
  .colmenu-btn:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .colmenu {
    position: absolute; z-index: 6; margin-top: 4px; min-width: 150px;
    display: flex; flex-direction: column; padding: 5px;
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 10px; box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
    font-weight: 400; font-size: 0.85rem;
  }
  .colmenu button { all: unset; cursor: pointer; padding: 0.42rem 0.7rem; border-radius: 7px; }
  .colmenu button:hover, .colmenu button:focus-visible { background: rgba(109, 92, 255, 0.14); }
  .cell-error {
    position: absolute; z-index: 5; margin-top: 2px; padding: 3px 9px; font-size: 0.74rem;
    color: #fff; background: var(--aurora-danger, #f43f5e); border-radius: 7px; white-space: nowrap;
  }
  .pop-backdrop {
    position: fixed; inset: 0; z-index: var(--aurora-modal-z, 80);
    background: rgba(6, 6, 12, 0.55); backdrop-filter: blur(3px);
  }
  .pop {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: calc(var(--aurora-modal-z, 80) + 1); width: min(400px, calc(100vw - 32px));
    display: flex; flex-direction: column; gap: 13px; padding: 20px;
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 16px; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6);
  }
  .pop h3 { margin: 0 0 2px; font-size: 1rem; }
  .pop label { display: grid; gap: 5px; font-size: 0.78rem; color: var(--aurora-muted, #9a98b3); }
  .pop input {
    all: unset; box-sizing: border-box; padding: 0.5rem 0.75rem; font: inherit; font-size: 0.9rem;
    color: var(--aurora-fg, #ececf2);
    background: var(--aurora-field, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 9px;
  }
  .pop input:focus { border-color: var(--aurora-accent, #6d5cff); }
  .pop input.invalid { border-color: var(--aurora-danger, #f43f5e); }
  .pop .err { color: var(--aurora-danger, #f43f5e); font-size: 0.74rem; min-height: 1em; }
  .pop .row2 { display: flex; justify-content: flex-end; gap: 9px; margin-top: 4px; }
  .pop .row2 button {
    all: unset; cursor: pointer; padding: 0.5rem 1rem; border-radius: 9px; font-size: 0.9rem;
  }
  .pop .save { background: var(--aurora-accent, #6d5cff); color: #fff; }
  .pop .cancel { border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14)); color: var(--aurora-muted, #9a98b3); }
  .pop button:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); }
  thead tr.groups th {
    text-align: center; font-size: 0.74rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); border-bottom: none; padding-bottom: 0.2rem;
  }
  .filters th { padding: 0.45rem 0.9rem; }
  tbody tr { transition: background 0.15s ease; }
  tbody tr:hover { background: rgba(255, 255, 255, 0.035); }
  :host([striped]) tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.022); }
  :host([striped]) tbody tr:hover { background: rgba(255, 255, 255, 0.045); }
  tbody tr[aria-selected='true'] { background: rgba(109, 92, 255, 0.14) !important; }
  :host([selectable]) tbody tr { cursor: pointer; }
  :host([dense]) th, :host([dense]) td { padding: 0.4rem 0.7rem; }
  td.num, th.num { text-align: right; }
  td.center, th.center { text-align: center; }
  .empty { padding: 26px; text-align: center; color: var(--aurora-muted, #9a98b3); }
  .pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0.55rem 0.9rem;
    border-top: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
    color: var(--aurora-muted, #9a98b3);
    font-size: 0.84em;
  }
  .pager button {
    all: unset;
    cursor: pointer;
    padding: 3px 11px;
    border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .pager button:hover:not(:disabled) { border-color: var(--aurora-accent, #6d5cff); color: var(--aurora-fg, #ececf2); }
  .pager button:disabled { opacity: 0.35; cursor: default; }
  .pager button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  input[type='checkbox'] { accent-color: var(--aurora-accent, #6d5cff); cursor: pointer; }
  .toolbar {
    display: flex; align-items: center; gap: 10px; padding: 0.55rem 0.9rem;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
  }
  .toolbar input {
    all: unset; box-sizing: border-box; flex: 1; max-width: 260px; font: inherit; font-size: 0.88em;
    color: inherit; padding: 0.35rem 0.6rem; border-radius: 8px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1)); background: rgba(255,255,255,0.03);
  }
  .toolbar input:focus { border-color: var(--aurora-accent, #6d5cff); }
  .toolbar .tool-btn {
    all: unset; cursor: pointer; font-size: 0.82em; padding: 0.32rem 0.75rem; border-radius: 8px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12)); color: var(--aurora-muted, #9a98b3);
  }
  .toolbar .tool-btn:hover { border-color: var(--aurora-accent, #6d5cff); color: inherit; }
  tr.group-row td {
    background: rgba(109, 92, 255, 0.07); font-weight: 600; cursor: pointer;
  }
  tr.group-row .caret { display: inline-block; margin-right: 8px; transition: transform 0.2s ease; }
  tr.group-row.is-collapsed .caret { transform: rotate(-90deg); }
  tr.group-row .agg { color: var(--aurora-muted, #9a98b3); font-weight: 400; margin-left: 10px; font-size: 0.86em; }
  tfoot td { font-weight: 600; border-top: 1px solid var(--aurora-border, rgba(255,255,255,0.14)); }
  .expander { all: unset; cursor: pointer; padding: 0 6px; color: var(--aurora-muted, #9a98b3); }
  .expander:hover { color: inherit; }
  tr.detail-row td { background: rgba(255, 255, 255, 0.02); white-space: normal; color: var(--aurora-muted, #a7a5bd); }
  td.editing { padding: 0.3rem 0.5rem; }
  td.editing input {
    all: unset; box-sizing: border-box; width: 100%; font: inherit; color: inherit;
    padding: 0.3rem 0.4rem; border-radius: 6px; border: 1px solid var(--aurora-accent, #6d5cff);
    background: rgba(109, 92, 255, 0.08);
  }
  .order { font-size: 0.66em; vertical-align: super; color: var(--aurora-accent, #6d5cff); }
  th { position: relative; }
  .rz { position: absolute; top: 0; right: -4px; width: 8px; height: 100%; cursor: col-resize; user-select: none; z-index: 1; }
  .rz:hover, .rz.is-active { background: linear-gradient(180deg, transparent, var(--aurora-accent, #6d5cff), transparent); }
  th.drag-over { border-bottom: 2px solid var(--aurora-accent, #6d5cff); }
  td[tabindex]:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px; }
`

export interface GridColumn<T = Record<string, unknown>> {
  field: string
  title?: string
  width?: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  filterable?: boolean
  editable?: boolean
  hidden?: boolean
  frozen?: boolean
  group?: string
  validator?: (value: unknown, row: T) => string | null
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count'
  formatter?: (value: unknown, row: T) => string
}

type Row = Record<string, unknown>

export type FilterOp = 'contains' | 'equals' | 'starts' | 'gt' | 'lt'

export interface GridState {
  sorts: { field: string; dir: 'asc' | 'desc' }[]
  filters: Record<string, string>
  ops: Record<string, FilterOp>
  search: string
  page: number
  widths: Record<string, number>
  hidden: string[]
  groupBy: string | null
}

const FILTER_OPS: { op: FilterOp; sym: string; label: string }[] = [
  { op: 'contains', sym: '≈', label: 'contains' },
  { op: 'equals', sym: '=', label: 'equals' },
  { op: 'starts', sym: '^', label: 'starts with' },
  { op: 'gt', sym: '>', label: 'greater than' },
  { op: 'lt', sym: '<', label: 'less than' },
]

/**
 * `<aurora-grid>` — an enterprise data grid. Assign `columns` and `data`, get:
 * multi-column sorting (Shift+click), per-column filters, global search
 * (`searchable`), paging with a page-size selector (`page-size`,
 * `page-sizes="5,10,25"`), row selection (`selectable="single|multiple"`),
 * grouping with collapsible headers and per-group aggregates (`groupBy`),
 * footer aggregates (column `aggregate: sum|avg|min|max|count`), inline cell
 * editing (`editable` + column `editable`, dblclick → Enter/blur commits;
 * `editable="popup"` opens a row dialog instead; a
 * column `validator` blocks bad commits with an inline error, column `group`
 * strings render spanning header groups,
 * Escape cancels), row detail templates (`detail = (row) => html`), column
 * hiding (`hidden`, `toggleColumn()`), and CSV export (`exportable`,
 * `toCsv()`/`exportCsv()`). Emits `aurora-sort`, `aurora-filter`,
 * `aurora-page`, `aurora-selection`, `aurora-edit`. With `virtual` (and no
 * paging), only the visible window of rows is rendered inside
 * `--aurora-grid-height` — spacer rows keep the scrollbar honest, so 100k rows
 * stay smooth. Virtual mode ignores grouping and detail rows.
 */
export class AuroraGrid extends AuroraElement {
  #columns: GridColumn[] = []
  #data: Row[] = []
  private sorts: { field: string; dir: 'asc' | 'desc' }[] = []
  private filters = new Map<string, string>()
  private ops = new Map<string, FilterOp>()
  private search = ''
  private page = 0
  private pageSize = -1
  private selectedRows = new Set<Row>()
  private collapsed = new Set<string>()
  private expanded = new Set<Row>()
  private scrollTopSaved = 0
  private vStart = 0
  private vTotal = 0
  private widths = new Map<string, number>()
  private cellSel = new Set<string>()
  private draggedField: string | null = null
  #groupBy: string | null = null
  #detail: ((row: Row) => string) | null = null

  /** Group rows by a field (null to ungroup). */
  get groupBy(): string | null {
    return this.#groupBy
  }

  set groupBy(field: string | null) {
    this.#groupBy = field
    this.collapsed.clear()
    this.render()
  }

  /** Row detail template: return HTML for an expandable detail row. */
  get detail(): ((row: Row) => string) | null {
    return this.#detail
  }

  set detail(fn: ((row: Row) => string) | null) {
    this.#detail = fn
    this.render()
  }

  /** Show/hide a column by field. */
  toggleColumn(field: string): void {
    const col = this.#columns.find((c) => c.field === field)
    if (col) {
      col.hidden = !col.hidden
      this.render()
    }
  }

  /** CSV of the current filtered + sorted view (all pages). */
  toCsv(): string {
    const cols = this.visibleColumns()
    const esc = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`
    const head = cols.map((c) => esc(c.title ?? c.field)).join(',')
    const body = this.processed()
      .map((row) => cols.map((c) => esc(row[c.field])).join(','))
      .join('\n')
    return `${head}\n${body}`
  }

  /** Download the current view as CSV. */
  exportCsv(filename = 'grid.csv'): void {
    const blob = new Blob([this.toCsv()], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  /** The current view as .xlsx bytes (dependency-free writer). */
  toExcel(): Uint8Array {
    const cols = this.visibleColumns()
    return makeXlsx(
      cols.map((c) => c.title ?? c.field),
      this.processed().map((row) => cols.map((c) => row[c.field])),
      'Grid',
    )
  }

  /** Download the current view as an Excel workbook. */
  exportExcel(filename = 'grid.xlsx'): void {
    const bytes = this.toExcel()
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  /** Set a column's filter operator programmatically. */
  setFilterOp(field: string, op: FilterOp): void {
    this.ops.set(field, op)
    this.page = 0
    this.render()
  }

  /** Snapshot every user-adjustable view setting as a JSON-safe object. */
  getState(): GridState {
    return {
      sorts: this.sorts.map((s) => ({ ...s })),
      filters: Object.fromEntries(this.filters),
      ops: Object.fromEntries(this.ops),
      search: this.search,
      page: this.page,
      widths: Object.fromEntries(this.widths),
      hidden: this.#columns.filter((c) => c.hidden).map((c) => c.field),
      groupBy: this.#groupBy,
    }
  }

  /** Restore a snapshot from getState() (e.g. out of localStorage). */
  setState(state: Partial<GridState>): void {
    if (state.sorts) this.sorts = state.sorts.map((s) => ({ ...s }))
    if (state.filters) this.filters = new Map(Object.entries(state.filters))
    if (state.ops) this.ops = new Map(Object.entries(state.ops) as [string, FilterOp][])
    if (state.search !== undefined) this.search = state.search
    if (state.page !== undefined) this.page = state.page
    if (state.widths) this.widths = new Map(Object.entries(state.widths))
    if (state.hidden)
      this.#columns.forEach((c) => {
        c.hidden = state.hidden?.includes(c.field) || undefined
      })
    if (state.groupBy !== undefined) this.#groupBy = state.groupBy
    this.render()
  }

  /** Open the popup editor for a row (used by editable="popup"). */
  openPopupEdit(row: Row): void {
    this.root.querySelector('.pop-backdrop')?.remove()
    this.root.querySelector('.pop')?.remove()
    const cols = this.visibleColumns().filter((c) => c.editable !== false)
    const wrap = document.createElement('div')
    wrap.className = 'pop-backdrop'
    const pop = document.createElement('div')
    pop.className = 'pop'
    pop.setAttribute('role', 'dialog')
    pop.setAttribute('aria-modal', 'true')
    pop.innerHTML = `<h3>Edit row</h3>${cols
      .map(
        (c) =>
          `<label>${escapeHtml(c.title ?? c.field)}<input data-f="${escapeHtml(c.field)}" value="${escapeHtml(String(row[c.field] ?? ''))}" /><span class="err" data-e="${escapeHtml(c.field)}"></span></label>`,
      )
      .join(
        '',
      )}<div class="row2"><button class="cancel">Cancel</button><button class="save">Save</button></div>`
    const close = (): void => {
      wrap.remove()
      pop.remove()
    }
    wrap.addEventListener('click', close)
    pop.querySelector('.cancel')?.addEventListener('click', close)
    pop.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') close()
    })
    pop.querySelector('.save')?.addEventListener('click', () => {
      let valid = true
      const changes: { field: string; value: unknown; oldValue: unknown }[] = []
      for (const c of cols) {
        const input = pop.querySelector<HTMLInputElement>(`input[data-f="${CSS.escape(c.field)}"]`)
        const err = pop.querySelector<HTMLElement>(`.err[data-e="${CSS.escape(c.field)}"]`)
        if (!input) continue
        const oldValue = row[c.field]
        const next: unknown =
          typeof oldValue === 'number' &&
          input.value.trim() !== '' &&
          Number.isFinite(Number(input.value))
            ? Number(input.value)
            : input.value
        const message = c.validator ? c.validator(next, row) : null
        input.classList.toggle('invalid', message !== null)
        if (err) err.textContent = message ?? ''
        if (message) {
          valid = false
          this.dispatchEvent(
            new CustomEvent('aurora-invalid', {
              detail: { row, field: c.field, value: next, message },
            }),
          )
        } else if (next !== oldValue) {
          changes.push({ field: c.field, value: next, oldValue })
        }
      }
      if (!valid) return
      for (const ch of changes) {
        row[ch.field] = ch.value
        this.dispatchEvent(
          new CustomEvent('aurora-edit', {
            detail: { row, field: ch.field, value: ch.value, oldValue: ch.oldValue },
          }),
        )
      }
      close()
      this.render()
    })
    this.root.appendChild(wrap)
    this.root.appendChild(pop)
    pop.querySelector<HTMLInputElement>('input')?.focus()
  }

  private applyFrozen(): void {
    const headRow = this.root.querySelector('thead tr')
    if (!headRow) return
    const ths = Array.from(headRow.children).filter((c): c is HTMLElement =>
      c.classList.contains('fz'),
    )
    if (!ths.length) return
    const lefts: number[] = []
    let acc = 0
    for (const th of ths) {
      lefts.push(acc)
      acc += th.offsetWidth
    }
    this.root.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.children).filter((c): c is HTMLElement =>
        c.classList.contains('fz'),
      )
      cells.forEach((cellEl, i) => {
        cellEl.style.left = `${lefts[i] ?? 0}px`
        cellEl.classList.toggle('fz-edge', i === cells.length - 1)
      })
    })
  }

  private visibleColumns(): GridColumn[] {
    const vis = this.#columns.filter((c) => !c.hidden)
    return [...vis.filter((c) => c.frozen), ...vis.filter((c) => !c.frozen)]
  }

  private aggregate(
    kind: NonNullable<GridColumn['aggregate']>,
    rows: Row[],
    field: string,
  ): string {
    const nums = rows.map((r) => Number(r[field])).filter((n) => Number.isFinite(n))
    if (kind === 'count') return String(rows.length)
    if (nums.length === 0) return ''
    if (kind === 'sum') return String(nums.reduce((a, b) => a + b, 0))
    if (kind === 'avg') return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
    if (kind === 'min') return String(Math.min(...nums))
    return String(Math.max(...nums))
  }

  get columns(): GridColumn[] {
    return this.#columns
  }

  set columns(value: GridColumn[]) {
    this.#columns = value ?? []
    this.render()
  }

  get data(): Row[] {
    return this.#data
  }

  set data(value: Row[]) {
    this.#data = value ?? []
    this.page = 0
    this.selectedRows.clear()
    this.render()
  }

  /** Currently selected row objects. */
  get selected(): Row[] {
    return [...this.selectedRows]
  }

  connectedCallback(): void {
    this.render()
  }

  /** Re-render after mutating `data` in place. */
  refresh(): void {
    this.render()
  }

  private processed(): Row[] {
    let rows = this.#data
    if (this.search) {
      const q = this.search.toLowerCase()
      const fields = this.visibleColumns().map((c) => c.field)
      rows = rows.filter((row) =>
        fields.some((f) =>
          String(row[f] ?? '')
            .toLowerCase()
            .includes(q),
        ),
      )
    }
    for (const [field, query] of this.filters) {
      if (!query) continue
      const q = query.toLowerCase()
      const op = this.ops.get(field) ?? 'contains'
      rows = rows.filter((row) => {
        const raw = row[field]
        const s = String(raw ?? '').toLowerCase()
        if (op === 'equals') return s === q
        if (op === 'starts') return s.startsWith(q)
        if (op === 'gt' || op === 'lt') {
          const a = Number(raw)
          const b = Number(query)
          if (!Number.isNaN(a) && !Number.isNaN(b)) return op === 'gt' ? a > b : a < b
          return op === 'gt' ? s > q : s < q
        }
        return s.includes(q)
      })
    }
    const sorts = [...this.sorts]
    if (this.#groupBy) sorts.unshift({ field: this.#groupBy, dir: 'asc' })
    if (sorts.length > 0) {
      rows = [...rows].sort((a, b) => {
        for (const s of sorts) {
          const va = a[s.field]
          const vb = b[s.field]
          const dir = s.dir === 'asc' ? 1 : -1
          let cmp: number
          if (typeof va === 'number' && typeof vb === 'number') cmp = (va - vb) * dir
          else cmp = String(va ?? '').localeCompare(String(vb ?? '')) * dir
          if (cmp !== 0) return cmp
        }
        return 0
      })
    }
    return rows
  }

  private view(): { rows: Row[]; total: number; pages: number; pageSize: number } {
    let rows = this.processed()
    const total = rows.length
    if (this.pageSize < 0) this.pageSize = this.numberAttr('page-size', 0)
    const pageSize = this.pageSize
    const pages = pageSize > 0 ? Math.max(Math.ceil(total / pageSize), 1) : 1
    this.page = clamp(this.page, 0, pages - 1)
    if (pageSize > 0) rows = rows.slice(this.page * pageSize, (this.page + 1) * pageSize)
    else if (this.hasAttribute('virtual')) {
      const rowH = this.numberAttr('row-height', 36)
      const viewH = this.root.querySelector('.viewport')?.clientHeight || 420
      this.vTotal = total
      this.vStart = clamp(Math.floor(this.scrollTopSaved / rowH) - 5, 0, Math.max(total - 1, 0))
      rows = rows.slice(this.vStart, this.vStart + Math.ceil(viewH / rowH) + 10)
    }
    return { rows, total, pages, pageSize }
  }

  private render(): void {
    const { rows, total, pages, pageSize } = this.view()
    const selectable = this.getAttribute('selectable')
    const multi = selectable === 'multiple'
    const filterable = this.hasAttribute('filterable')
    const editMode = this.getAttribute('editable')
    const editable = editMode !== null && editMode !== 'popup'
    const cols = this.visibleColumns()
    const extraCols = (multi ? 1 : 0) + (this.#detail ? 1 : 0)
    const span = cols.length + extraCols
    const hasFrozen = cols.some((c) => c.frozen)
    const cls = (col: GridColumn): string => {
      const parts = [
        col.align === 'right' ? 'num' : col.align === 'center' ? 'center' : '',
        col.frozen ? 'fz' : '',
      ].filter(Boolean)
      return parts.length ? ` class="${parts.join(' ')}"` : ''
    }

    const toolbar =
      this.hasAttribute('searchable') || this.hasAttribute('exportable')
        ? `<div class="toolbar" part="toolbar">${
            this.hasAttribute('searchable')
              ? `<input data-search type="search" placeholder="Search…" aria-label="Search all columns" value="${this.search}" />`
              : ''
          }${this.hasAttribute('exportable') ? '<button class="tool-btn" data-export>Export CSV</button><button class="tool-btn" data-export-xlsx>Export Excel</button>' : ''}</div>`
        : ''

    const head = cols
      .map((col) => {
        const idx = this.sorts.findIndex((s) => s.field === col.field)
        const sorted = idx >= 0
        const dir = sorted ? this.sorts[idx]?.dir : undefined
        const ariaSort = sorted ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
        const label = col.title ?? col.field
        const px = this.widths.get(col.field)
        const width = px ? ` style="width:${px}px"` : col.width ? ` style="width:${col.width}"` : ''
        const order = sorted && this.sorts.length > 1 ? `<span class="order">${idx + 1}</span>` : ''
        const inner =
          col.sortable === false
            ? label
            : `<button class="sort-btn" data-sort="${col.field}" title="Click to sort, Shift+click for multi-sort">${label}<span class="arrow" aria-hidden="true">${dir === 'desc' ? '▼' : '▲'}</span>${order}</button>`
        const rz = this.hasAttribute('resizable')
          ? `<span class="rz" data-rz="${col.field}" aria-hidden="true"></span>`
          : ''
        const cm = this.hasAttribute('column-menu')
          ? `<button class="colmenu-btn" data-cm="${col.field}" aria-label="Column menu for ${label}" aria-haspopup="menu">⋮</button>`
          : ''
        const drag = this.hasAttribute('reorderable')
          ? ` draggable="true" data-col="${col.field}"`
          : ''
        return `<th role="columnheader" aria-sort="${ariaSort}"${cls(col)}${width}${drag}>${inner}${cm}${rz}</th>`
      })
      .join('')

    const fzu = hasFrozen ? ' class="fz"' : ''
    const hasGroups = cols.some((c) => c.group)
    let groupRow = ''
    if (hasGroups) {
      const cells: string[] = []
      if (multi) cells.push(`<th${fzu}></th>`)
      if (this.#detail) cells.push(`<th${fzu}></th>`)
      let i = 0
      while (i < cols.length) {
        const g = cols[i]?.group
        let span = 1
        while (i + span < cols.length && cols[i + span]?.group === g && g !== undefined) span++
        if (g === undefined) {
          for (let k = 0; k < span; k++)
            cells.push(`<th${cols[i + k]?.frozen ? ' class="fz"' : ''}></th>`)
        } else {
          cells.push(
            `<th colspan="${span}"${cols[i]?.frozen ? ' class="fz"' : ''}>${escapeHtml(g)}</th>`,
          )
        }
        i += span
      }
      groupRow = `<tr class="groups">${cells.join('')}</tr>`
    }
    const filterRow = filterable
      ? `<tr class="filters">${multi ? `<th${fzu}></th>` : ''}${this.#detail ? `<th${fzu}></th>` : ''}${cols
          .map((col) => {
            if (col.filterable === false) return `<th${col.frozen ? ' class="fz"' : ''}></th>`
            const cur =
              FILTER_OPS.find((o) => o.op === (this.ops.get(col.field) ?? 'contains')) ??
              FILTER_OPS[0]
            return `<th${col.frozen ? ' class="fz"' : ''}><div class="fwrap"><button class="fop" data-fop="${col.field}" title="Filter: ${cur?.label}" aria-label="Filter operator for ${col.title ?? col.field}: ${cur?.label}">${escapeHtml(cur?.sym ?? '')}</button><input data-filter="${col.field}" aria-label="Filter ${col.title ?? col.field}" value="${this.filters.get(col.field) ?? ''}" /></div></th>`
          })
          .join('')}</tr>`
      : ''

    const cellMode = this.getAttribute('selectable') === 'cell'
    const cell = (row: Row, col: GridColumn, i: number): string => {
      const raw = row[col.field]
      const text = col.formatter ? col.formatter(raw, row) : String(raw ?? '')
      const edit = editable && col.editable !== false ? ` data-edit="${col.field}"` : ''
      const sel = cellMode && this.cellSel.has(`${i}:${col.field}`) ? ' aria-selected="true"' : ''
      return `<td${cls(col)}${edit}${sel} tabindex="-1" data-cell data-f="${col.field}">${text}</td>`
    }

    const rowHtml = (row: Row, i: number): string => {
      const check = multi
        ? `<td class="center${hasFrozen ? ' fz' : ''}"><input type="checkbox" data-row="${i}" aria-label="Select row" ${this.selectedRows.has(row) ? 'checked' : ''}/></td>`
        : ''
      const exp = this.#detail
        ? `<td class="center${hasFrozen ? ' fz' : ''}"><button class="expander" data-expand="${i}" aria-label="Toggle details" aria-expanded="${this.expanded.has(row)}">${this.expanded.has(row) ? '▾' : '▸'}</button></td>`
        : ''
      const detail =
        this.#detail && this.expanded.has(row)
          ? `<tr class="detail-row"><td colspan="${span}">${this.#detail(row)}</td></tr>`
          : ''
      return `<tr data-index="${i}" aria-selected="${this.selectedRows.has(row)}">${check}${exp}${row === undefined ? '' : cols.map((c) => cell(row, c, i)).join('')}</tr>${detail}`
    }

    let body = ''
    if (this.#groupBy) {
      const groups = new Map<string, { row: Row; i: number }[]>()
      rows.forEach((row, i) => {
        const key = String(row[this.#groupBy as string] ?? '')
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)?.push({ row, i })
      })
      for (const [key, members] of groups) {
        const collapsed = this.collapsed.has(key)
        const aggs = cols
          .filter((c) => c.aggregate)
          .map(
            (c) =>
              `${c.title ?? c.field} ${c.aggregate}: ${this.aggregate(
                c.aggregate as NonNullable<GridColumn['aggregate']>,
                members.map((m) => m.row),
                c.field,
              )}`,
          )
          .join(' · ')
        body += `<tr class="group-row${collapsed ? ' is-collapsed' : ''}" data-group="${key}"><td colspan="${span}"><span class="caret">▾</span>${this.#groupBy}: ${key} (${members.length})${aggs ? `<span class="agg">${aggs}</span>` : ''}</td></tr>`
        if (!collapsed) body += members.map(({ row, i }) => rowHtml(row, i)).join('')
      }
    } else {
      body = rows.map((row, i) => rowHtml(row, i)).join('')
    }

    const footAggs = cols.filter((c) => c.aggregate)
    const foot =
      footAggs.length > 0 && rows.length > 0
        ? `<tfoot><tr>${multi ? `<td${fzu}></td>` : ''}${this.#detail ? `<td${fzu}></td>` : ''}${cols
            .map((c) =>
              c.aggregate
                ? `<td${cls(c)}>${c.aggregate}: ${this.aggregate(c.aggregate, this.processed(), c.field)}</td>`
                : '<td></td>',
            )
            .join('')}</tr></tfoot>`
        : ''

    const allChecked = rows.length > 0 && rows.every((row) => this.selectedRows.has(row))
    const selectHead = multi
      ? `<th class="center${hasFrozen ? ' fz' : ''}" style="width:36px"><input type="checkbox" data-all aria-label="Select all rows" ${allChecked ? 'checked' : ''}/></th>`
      : ''
    const expandHead = this.#detail ? `<th${fzu} style="width:34px"></th>` : ''

    const sizes = (this.getAttribute('page-sizes') ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => n > 0)
    const sizeSelect =
      sizes.length > 0
        ? `<select data-size aria-label="Rows per page">${sizes
            .map(
              (s) =>
                `<option value="${s}" ${s === pageSize ? 'selected' : ''}>${s} / page</option>`,
            )
            .join('')}</select>`
        : ''

    const pager =
      pageSize > 0 && (total > pageSize || sizes.length > 0)
        ? `<div class="pager" part="pager"><span>${total === 0 ? 0 : this.page * pageSize + 1}–${Math.min((this.page + 1) * pageSize, total)} of ${total}</span><span style="display:inline-flex;gap:8px;align-items:center">${sizeSelect}<button data-page="prev" ${this.page === 0 ? 'disabled' : ''} aria-label="Previous page">‹</button> ${this.page + 1} / ${pages} <button data-page="next" ${this.page >= pages - 1 ? 'disabled' : ''} aria-label="Next page">›</button></span></div>`
        : ''

    const virtual = this.hasAttribute('virtual') && pageSize <= 0
    if (virtual) {
      const rowH = this.numberAttr('row-height', 36)
      const below = Math.max(this.vTotal - this.vStart - rows.length, 0)
      body =
        `<tr aria-hidden="true" style="height:${this.vStart * rowH}px"></tr>` +
        body +
        `<tr aria-hidden="true" style="height:${below * rowH}px"></tr>`
    }
    const vh = virtual ? ' style="max-height: var(--aurora-grid-height, 420px)"' : ''
    this.root.innerHTML = `<style>${STYLE}</style>${toolbar}<div class="viewport"${vh}><table role="grid" aria-rowcount="${total}"><thead>${groupRow}<tr>${selectHead}${expandHead}${head}</tr>${filterRow}</thead><tbody>${body}</tbody>${foot}</table>${rows.length === 0 ? '<div class="empty">No matching rows.</div>' : ''}</div>${pager}`

    if (virtual) {
      const vp = this.root.querySelector<HTMLElement>('.viewport')
      if (vp) {
        vp.scrollTop = this.scrollTopSaved
        let raf = 0
        vp.addEventListener('scroll', () => {
          if (raf) return
          raf = requestAnimationFrame(() => {
            raf = 0
            const rowH = this.numberAttr('row-height', 36)
            const nextStart = clamp(
              Math.floor(vp.scrollTop / rowH) - 5,
              0,
              Math.max(this.vTotal - 1, 0),
            )
            if (nextStart !== this.vStart) {
              this.scrollTopSaved = vp.scrollTop
              this.render()
            } else {
              this.scrollTopSaved = vp.scrollTop
            }
          })
        })
      }
    }

    this.wire(rows)
    this.applyFrozen()
    if (!prefersReducedMotion() && rows.length > 0 && !virtual) {
      gsap.fromTo(
        this.root.querySelectorAll('tbody tr'),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.02, clearProps: 'all' },
      )
    }
  }

  private wire(rows: Row[]): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const field = btn.dataset.sort ?? ''
        const existing = this.sorts.findIndex((s) => s.field === field)
        if (event.shiftKey) {
          if (existing < 0) this.sorts.push({ field, dir: 'asc' })
          else if (this.sorts[existing]?.dir === 'asc')
            this.sorts[existing] = { field, dir: 'desc' }
          else this.sorts.splice(existing, 1)
        } else {
          const current = existing >= 0 ? this.sorts[existing] : undefined
          if (!current) this.sorts = [{ field, dir: 'asc' }]
          else if (current.dir === 'asc') this.sorts = [{ field, dir: 'desc' }]
          else this.sorts = []
        }
        this.render()
        this.dispatchEvent(new CustomEvent('aurora-sort', { detail: { sorts: [...this.sorts] } }))
      })
    })

    const searchBox = this.root.querySelector<HTMLInputElement>('[data-search]')
    searchBox?.addEventListener('input', () => {
      this.search = searchBox.value
      this.page = 0
      this.render()
      const next = this.root.querySelector<HTMLInputElement>('[data-search]')
      next?.focus()
      next?.setSelectionRange(next.value.length, next.value.length)
    })
    this.root.querySelector('[data-export]')?.addEventListener('click', () => this.exportCsv())
    this.root
      .querySelector('[data-export-xlsx]')
      ?.addEventListener('click', () => this.exportExcel())
    if (this.getAttribute('selectable') === 'cell') {
      this.root.querySelectorAll<HTMLTableCellElement>('td[data-cell]').forEach((td) =>
        td.addEventListener('click', (e) => {
          const tr = td.closest('tr')
          const i = Number(tr?.dataset.index)
          const key = `${i}:${td.dataset.f ?? ''}`
          if (!(e as MouseEvent).ctrlKey && !(e as MouseEvent).metaKey) this.cellSel.clear()
          if (this.cellSel.has(key)) this.cellSel.delete(key)
          else this.cellSel.add(key)
          this.render()
          const row = rows[i]
          this.dispatchEvent(
            new CustomEvent('aurora-selection', {
              detail: {
                cells: [...this.cellSel].map((k) => {
                  const [ri = '', field = ''] = k.split(':')
                  return { row: rows[Number(ri)], field, value: rows[Number(ri)]?.[field] }
                }),
                row,
              },
            }),
          )
        }),
      )
    }
    this.root.querySelectorAll<HTMLButtonElement>('[data-cm]').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const field = btn.dataset.cm ?? ''
        const existing = this.root.querySelector('.colmenu')
        if (existing) {
          existing.remove()
          return
        }
        const col = this.#columns.find((c) => c.field === field)
        const menu = document.createElement('div')
        menu.className = 'colmenu'
        menu.setAttribute('role', 'menu')
        menu.innerHTML = `
          <button data-a="asc">↑ Sort ascending</button>
          <button data-a="desc">↓ Sort descending</button>
          <button data-a="clear">✕ Clear sort</button>
          <button data-a="hide">Hide column</button>
          <button data-a="freeze">${col?.frozen ? 'Unfreeze' : 'Freeze'} column</button>`
        btn.closest('th')?.appendChild(menu)
        menu.querySelectorAll<HTMLButtonElement>('button').forEach((item) =>
          item.addEventListener('click', () => {
            const a = item.dataset.a
            if (a === 'asc' || a === 'desc') this.sorts = [{ field, dir: a }]
            else if (a === 'clear') this.sorts = this.sorts.filter((x) => x.field !== field)
            else if (a === 'hide') {
              const c = this.#columns.find((x) => x.field === field)
              if (c) c.hidden = true
            } else if (a === 'freeze') {
              const c = this.#columns.find((x) => x.field === field)
              if (c) c.frozen = !c.frozen
            }
            this.render()
            this.dispatchEvent(
              new CustomEvent('aurora-sort', {
                detail: { sorts: this.sorts.map((x) => ({ ...x })) },
              }),
            )
          }),
        )
      }),
    )
    this.root.querySelectorAll<HTMLButtonElement>('[data-fop]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.fop ?? ''
        const cur = this.ops.get(field) ?? 'contains'
        const idx = FILTER_OPS.findIndex((o) => o.op === cur)
        const next = FILTER_OPS[(idx + 1) % FILTER_OPS.length]
        if (next) this.ops.set(field, next.op)
        this.page = 0
        this.render()
        this.root.querySelector<HTMLButtonElement>(`[data-fop="${field}"]`)?.focus()
      })
    })
    this.root.querySelector<HTMLSelectElement>('[data-size]')?.addEventListener('change', (e) => {
      this.pageSize = Number((e.target as HTMLSelectElement).value)
      this.page = 0
      this.render()
      this.dispatchEvent(
        new CustomEvent('aurora-page', { detail: { page: 0, pageSize: this.pageSize } }),
      )
    })
    this.root.querySelectorAll<HTMLElement>('tr.group-row').forEach((tr) => {
      tr.addEventListener('click', () => {
        const key = tr.dataset.group ?? ''
        if (this.collapsed.has(key)) this.collapsed.delete(key)
        else this.collapsed.add(key)
        this.render()
      })
    })
    this.root.querySelectorAll<HTMLButtonElement>('[data-expand]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation()
        const row = rows[Number(btn.dataset.expand)]
        if (!row) return
        if (this.expanded.has(row)) this.expanded.delete(row)
        else this.expanded.add(row)
        this.render()
      })
    })
    if (this.getAttribute('editable') === 'popup') {
      this.root.querySelectorAll<HTMLTableRowElement>('tbody tr[data-index]').forEach((tr) =>
        tr.addEventListener('dblclick', () => {
          const row = rows[Number(tr.dataset.index)]
          if (row) this.openPopupEdit(row)
        }),
      )
    }
    this.root.querySelectorAll<HTMLElement>('[data-edit]').forEach((td) => {
      td.addEventListener('dblclick', () => {
        if (td.classList.contains('editing')) return
        const tr = td.closest('tr')
        const row = rows[Number(tr?.dataset.index)]
        const field = td.dataset.edit ?? ''
        if (!row) return
        const oldValue = row[field]
        td.classList.add('editing')
        td.innerHTML = '<input type="text" />'
        const input = td.querySelector('input')
        if (!input) return
        input.value = String(oldValue ?? '')
        input.focus()
        input.select()
        let done = false
        const commit = (): void => {
          if (done) return
          const next: unknown =
            typeof oldValue === 'number' &&
            input.value.trim() !== '' &&
            Number.isFinite(Number(input.value))
              ? Number(input.value)
              : input.value
          const col = this.#columns.find((c) => c.field === field)
          const message = col?.validator ? col.validator(next, row) : null
          if (message) {
            input.classList.add('invalid')
            input.setAttribute('aria-invalid', 'true')
            td.querySelector('.cell-error')?.remove()
            const note = document.createElement('div')
            note.className = 'cell-error'
            note.setAttribute('role', 'alert')
            note.textContent = message
            td.appendChild(note)
            input.focus()
            this.dispatchEvent(
              new CustomEvent('aurora-invalid', { detail: { row, field, value: next, message } }),
            )
            return
          }
          done = true
          if (next !== oldValue) {
            row[field] = next
            this.dispatchEvent(
              new CustomEvent('aurora-edit', { detail: { row, field, value: next, oldValue } }),
            )
          }
          this.render()
        }
        input.addEventListener('blur', commit)
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') commit()
          else if (e.key === 'Escape') {
            done = true
            this.render()
          }
        })
      })
    })

    this.root.querySelectorAll<HTMLInputElement>('[data-filter]').forEach((input) => {
      input.addEventListener('input', () => {
        this.filters.set(input.dataset.filter ?? '', input.value)
        this.page = 0
        const active = input.dataset.filter
        this.render()
        const next = this.root.querySelector<HTMLInputElement>(`[data-filter="${active}"]`)
        next?.focus()
        next?.setSelectionRange(next.value.length, next.value.length)
        this.dispatchEvent(
          new CustomEvent('aurora-filter', {
            detail: { filters: Object.fromEntries(this.filters) },
          }),
        )
      })
    })
    this.root.querySelectorAll<HTMLButtonElement>('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.page += btn.dataset.page === 'next' ? 1 : -1
        this.render()
        this.dispatchEvent(new CustomEvent('aurora-page', { detail: { page: this.page } }))
      })
    })

    if (this.hasAttribute('resizable')) {
      this.root.querySelectorAll<HTMLElement>('.rz').forEach((handle) => {
        handle.addEventListener('pointerdown', (event) => {
          event.preventDefault()
          event.stopPropagation()
          const th = handle.closest('th')
          const field = handle.dataset.rz ?? ''
          if (!th) return
          handle.classList.add('is-active')
          handle.setPointerCapture(event.pointerId)
          const startX = event.clientX
          const startW = th.offsetWidth
          const onMove = (move: PointerEvent): void => {
            th.style.width = `${Math.max(startW + move.clientX - startX, 48)}px`
          }
          const onUp = (): void => {
            handle.removeEventListener('pointermove', onMove)
            handle.removeEventListener('pointerup', onUp)
            handle.classList.remove('is-active')
            this.widths.set(field, th.offsetWidth)
            this.dispatchEvent(
              new CustomEvent('aurora-resize', { detail: { field, width: th.offsetWidth } }),
            )
          }
          handle.addEventListener('pointermove', onMove)
          handle.addEventListener('pointerup', onUp)
        })
      })
    }
    if (this.hasAttribute('reorderable')) {
      this.root.querySelectorAll<HTMLElement>('th[data-col]').forEach((th) => {
        th.addEventListener('dragstart', () => {
          this.draggedField = th.dataset.col ?? null
        })
        th.addEventListener('dragover', (event) => {
          event.preventDefault()
          th.classList.add('drag-over')
        })
        th.addEventListener('dragleave', () => th.classList.remove('drag-over'))
        th.addEventListener('drop', (event) => {
          event.preventDefault()
          const target = th.dataset.col
          const from = this.draggedField
          this.draggedField = null
          if (!from || !target || from === target) return
          const cols = this.#columns
          const fi = cols.findIndex((c) => c.field === from)
          const ti = cols.findIndex((c) => c.field === target)
          if (fi < 0 || ti < 0) return
          const moved = cols.splice(fi, 1)[0]
          if (moved) cols.splice(ti, 0, moved)
          this.render()
          this.dispatchEvent(
            new CustomEvent('aurora-reorder', { detail: { order: cols.map((c) => c.field) } }),
          )
        })
      })
    }
    const cells = Array.from(this.root.querySelectorAll<HTMLElement>('td[data-cell]'))
    if (cells[0]) cells[0].tabIndex = 0
    this.root.querySelector('tbody')?.addEventListener('keydown', (event) => {
      const key = (event as KeyboardEvent).key
      const active = event.target as HTMLElement
      if (!active.matches('td[data-cell]')) return
      const colCount = this.visibleColumns().length
      const i = cells.indexOf(active)
      let next = -1
      if (key === 'ArrowRight') next = i + 1
      else if (key === 'ArrowLeft') next = i - 1
      else if (key === 'ArrowDown') next = i + colCount
      else if (key === 'ArrowUp') next = i - colCount
      else if (key === 'Enter' && active.dataset.edit !== undefined) {
        event.preventDefault()
        active.dispatchEvent(new MouseEvent('dblclick'))
        return
      }
      const target = cells[next]
      if (next < 0 || !target) return
      event.preventDefault()
      active.tabIndex = -1
      target.tabIndex = 0
      target.focus()
    })

    const selectable = this.getAttribute('selectable')
    if (!selectable || selectable === 'cell') return
    const emit = (): void => {
      this.dispatchEvent(
        new CustomEvent('aurora-selection', { detail: { selected: this.selected } }),
      )
    }

    this.root.querySelectorAll<HTMLElement>('tbody tr').forEach((tr) => {
      tr.addEventListener('click', (event) => {
        if ((event.target as HTMLElement).matches('input[type="checkbox"]')) return
        const row = rows[Number(tr.dataset.index)]
        if (!row) return
        if (selectable === 'multiple') {
          if (this.selectedRows.has(row)) this.selectedRows.delete(row)
          else this.selectedRows.add(row)
        } else {
          this.selectedRows.clear()
          this.selectedRows.add(row)
        }
        this.render()
        emit()
      })
    })
    this.root.querySelectorAll<HTMLInputElement>('[data-row]').forEach((box) => {
      box.addEventListener('change', () => {
        const row = rows[Number(box.dataset.row)]
        if (!row) return
        if (box.checked) this.selectedRows.add(row)
        else this.selectedRows.delete(row)
        this.render()
        emit()
      })
    })
    this.root.querySelector<HTMLInputElement>('[data-all]')?.addEventListener('change', (event) => {
      const on = (event.target as HTMLInputElement).checked
      rows.forEach((row) => {
        if (on) this.selectedRows.add(row)
        else this.selectedRows.delete(row)
      })
      this.render()
      emit()
    })
  }
}

register('aurora-grid', AuroraGrid)
