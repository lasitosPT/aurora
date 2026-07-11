import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

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
`

export interface GridColumn<T = Record<string, unknown>> {
  field: string
  title?: string
  width?: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  filterable?: boolean
  formatter?: (value: unknown, row: T) => string
}

type Row = Record<string, unknown>

/**
 * `<aurora-grid>` — an enterprise data grid. Assign `columns` and `data`, get
 * sorting (click headers to cycle asc/desc/off), per-column filtering, paging,
 * and row selection. Attributes: `page-size`, `selectable` (`single`|`multiple`
 * with checkboxes + select-all), `striped`, `dense`, `filterable`. Column
 * options: `title`, `width`, `align`, `sortable`, `filterable`, `formatter`.
 * Emits `aurora-sort`, `aurora-filter`, `aurora-page`, `aurora-selection`.
 * Theme via `--aurora-grid-height/-radius` and the shared aurora variables.
 */
export class AuroraGrid extends AuroraElement {
  #columns: GridColumn[] = []
  #data: Row[] = []
  private sortField: string | null = null
  private sortDir: 'asc' | 'desc' = 'asc'
  private filters = new Map<string, string>()
  private page = 0
  private selectedRows = new Set<Row>()

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

  private view(): { rows: Row[]; total: number; pages: number; pageSize: number } {
    let rows = this.#data
    for (const [field, query] of this.filters) {
      if (!query) continue
      const q = query.toLowerCase()
      rows = rows.filter((row) =>
        String(row[field] ?? '')
          .toLowerCase()
          .includes(q),
      )
    }
    if (this.sortField) {
      const field = this.sortField
      const dir = this.sortDir === 'asc' ? 1 : -1
      rows = [...rows].sort((a, b) => {
        const va = a[field]
        const vb = b[field]
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
        return String(va ?? '').localeCompare(String(vb ?? '')) * dir
      })
    }
    const total = rows.length
    const pageSize = this.numberAttr('page-size', 0)
    const pages = pageSize > 0 ? Math.max(Math.ceil(total / pageSize), 1) : 1
    this.page = clamp(this.page, 0, pages - 1)
    if (pageSize > 0) rows = rows.slice(this.page * pageSize, (this.page + 1) * pageSize)
    return { rows, total, pages, pageSize }
  }

  private render(): void {
    const { rows, total, pages, pageSize } = this.view()
    const selectable = this.getAttribute('selectable')
    const multi = selectable === 'multiple'
    const filterable = this.hasAttribute('filterable')
    const cls = (col: GridColumn): string =>
      col.align === 'right' ? ' class="num"' : col.align === 'center' ? ' class="center"' : ''

    const head = this.#columns
      .map((col) => {
        const sorted = this.sortField === col.field
        const ariaSort = sorted ? (this.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
        const label = col.title ?? col.field
        const width = col.width ? ` style="width:${col.width}"` : ''
        const inner =
          col.sortable === false
            ? label
            : `<button class="sort-btn" data-sort="${col.field}">${label}<span class="arrow" aria-hidden="true">${sorted && this.sortDir === 'desc' ? '▼' : '▲'}</span></button>`
        return `<th role="columnheader" aria-sort="${ariaSort}"${cls(col)}${width}>${inner}</th>`
      })
      .join('')

    const filterRow = filterable
      ? `<tr class="filters">${multi ? '<th></th>' : ''}${this.#columns
          .map((col) =>
            col.filterable === false
              ? '<th></th>'
              : `<th><input data-filter="${col.field}" aria-label="Filter ${col.title ?? col.field}" value="${this.filters.get(col.field) ?? ''}" /></th>`,
          )
          .join('')}</tr>`
      : ''

    const body =
      rows.length === 0
        ? ''
        : rows
            .map((row, i) => {
              const cells = this.#columns
                .map((col) => {
                  const raw = row[col.field]
                  const text = col.formatter ? col.formatter(raw, row) : String(raw ?? '')
                  return `<td${cls(col)}>${text}</td>`
                })
                .join('')
              const check = multi
                ? `<td class="center"><input type="checkbox" data-row="${i}" aria-label="Select row" ${this.selectedRows.has(row) ? 'checked' : ''}/></td>`
                : ''
              return `<tr data-index="${i}" aria-selected="${this.selectedRows.has(row)}">${check}${cells}</tr>`
            })
            .join('')

    const allChecked = rows.length > 0 && rows.every((row) => this.selectedRows.has(row))
    const selectHead = multi
      ? `<th class="center" style="width:36px"><input type="checkbox" data-all aria-label="Select all rows" ${allChecked ? 'checked' : ''}/></th>`
      : ''

    const pager =
      pageSize > 0 && total > pageSize
        ? `<div class="pager" part="pager"><span>${this.page * pageSize + 1}–${Math.min((this.page + 1) * pageSize, total)} of ${total}</span><span><button data-page="prev" ${this.page === 0 ? 'disabled' : ''} aria-label="Previous page">‹</button> ${this.page + 1} / ${pages} <button data-page="next" ${this.page >= pages - 1 ? 'disabled' : ''} aria-label="Next page">›</button></span></div>`
        : ''

    this.root.innerHTML = `<style>${STYLE}</style><div class="viewport"><table role="grid" aria-rowcount="${total}"><thead><tr>${selectHead}${head}</tr>${filterRow}</thead><tbody>${body}</tbody></table>${rows.length === 0 ? '<div class="empty">No matching rows.</div>' : ''}</div>${pager}`

    this.wire(rows)
    if (!prefersReducedMotion() && rows.length > 0) {
      gsap.fromTo(
        this.root.querySelectorAll('tbody tr'),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.02, clearProps: 'all' },
      )
    }
  }

  private wire(rows: Row[]): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.sort ?? ''
        if (this.sortField === field) {
          if (this.sortDir === 'asc') this.sortDir = 'desc'
          else this.sortField = null
        } else {
          this.sortField = field
          this.sortDir = 'asc'
        }
        this.render()
        this.dispatchEvent(
          new CustomEvent('aurora-sort', {
            detail: { field: this.sortField, dir: this.sortField ? this.sortDir : null },
          }),
        )
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

    const selectable = this.getAttribute('selectable')
    if (!selectable) return
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
