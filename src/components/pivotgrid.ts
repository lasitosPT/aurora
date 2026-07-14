import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

type Row = Record<string, unknown>
type Aggregate = 'sum' | 'avg' | 'count' | 'min' | 'max'

const STYLE = `
  :host {
    display: block; font-size: 0.88rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: var(--aurora-grid-radius, 14px);
    background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .viewport { overflow: auto; max-height: var(--aurora-grid-height, none); }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: end; padding: 0.55rem 0.9rem; white-space: nowrap;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.07));
    font-variant-numeric: tabular-nums;
  }
  thead th { position: sticky; top: 0; background: var(--aurora-surface, #14141f); z-index: 2; font-weight: 600; }
  th.rowhead, td.rowhead {
    text-align: start; position: sticky; left: 0; background: var(--aurora-surface, #14141f); z-index: 1;
    font-weight: 500;
  }
  thead th.rowhead { z-index: 3; }
  td.sub { color: var(--aurora-muted, #9a98b3); }
  tr.group td.rowhead { font-weight: 700; }
  tr.group td { background: rgba(255, 255, 255, 0.025); }
  td.total, th.total, tr.totals td { font-weight: 700; color: var(--aurora-accent2, #22d3ee); }
  tr.totals td { border-top: 1.5px solid var(--aurora-border, rgba(255, 255, 255, 0.16)); }
  .caret {
    all: unset; cursor: pointer; width: 16px; display: inline-grid; place-items: center;
    margin-right: 6px; color: var(--aurora-muted, #9a98b3); font-size: 0.72em;
    transition: transform 0.2s ease;
  }
  .caret.open { transform: rotate(90deg); }
  .caret:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .sub .pad { display: inline-block; width: 22px; }
  .empty { padding: 26px; text-align: center; color: var(--aurora-muted, #9a98b3); }
`

/**
 * `<aurora-pivotgrid aggregate="sum">` — a pivot table. Assign flat `data`
 * plus `rows` (one or two field names), `cols` (one field), and `measure`;
 * the component crosses them into a matrix with row subtotals (two-level
 * rows collapse), column totals, and a grand total. Aggregates: sum, avg,
 * count, min, max. Emits `aurora-select` with the clicked intersection.
 */
export class AuroraPivotgrid extends AuroraElement {
  #data: Row[] = []
  #rows: string[] = []
  #cols = ''
  #measure = ''
  private collapsed = new Set<string>()

  get data(): Row[] {
    return this.#data
  }

  set data(v: Row[]) {
    this.#data = v ?? []
    this.render()
  }

  get rows(): string[] {
    return this.#rows
  }

  set rows(v: string[] | string) {
    this.#rows = Array.isArray(v) ? v.slice(0, 2) : [v]
    this.render()
  }

  get cols(): string {
    return this.#cols
  }

  set cols(v: string) {
    this.#cols = v
    this.render()
  }

  get measure(): string {
    return this.#measure
  }

  set measure(v: string) {
    this.#measure = v
    this.render()
  }

  private agg(values: number[]): number | null {
    if (!values.length) return null
    const kind = (this.getAttribute('aggregate') ?? 'sum') as Aggregate
    switch (kind) {
      case 'count':
        return values.length
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length
      case 'min':
        return Math.min(...values)
      case 'max':
        return Math.max(...values)
      default:
        return values.reduce((a, b) => a + b, 0)
    }
  }

  private format(v: number | null): string {
    if (v === null) return '–'
    const rounded = Math.round(v * 100) / 100
    return String(rounded)
  }

  private cellValues(rowsFilter: (r: Row) => boolean, colKey: string | null): number[] {
    return this.#data
      .filter(rowsFilter)
      .filter((r) => colKey === null || String(r[this.#cols] ?? '') === colKey)
      .map((r) => Number(r[this.#measure]))
      .filter((n) => !Number.isNaN(n))
  }

  private render(): void {
    const [r1, r2] = this.#rows
    if (!r1 || !this.#cols || !this.#measure || !this.#data.length) {
      this.root.innerHTML = `<style>${STYLE}</style><div class="empty">Assign data, rows, cols, and measure.</div>`
      return
    }
    const colKeys = [...new Set(this.#data.map((r) => String(r[this.#cols] ?? '')))].sort()
    const r1Keys = [...new Set(this.#data.map((r) => String(r[r1] ?? '')))].sort()

    const head = `<tr><th class="rowhead">${escapeHtml(r1)}${r2 ? ` / ${escapeHtml(r2)}` : ''}</th>${colKeys
      .map((c) => `<th>${escapeHtml(c)}</th>`)
      .join('')}<th class="total">Total</th></tr>`

    const bodyRows: string[] = []
    const rowLine = (
      label: string,
      filter: (r: Row) => boolean,
      cls: string,
      key1: string,
      caret = '',
    ): string => {
      const cells = colKeys
        .map((c) => {
          const v = this.agg(this.cellValues(filter, c))
          return `<td data-r="${escapeHtml(key1)}" data-c="${escapeHtml(c)}">${this.format(v)}</td>`
        })
        .join('')
      const total = this.format(this.agg(this.cellValues(filter, null)))
      return `<tr class="${cls}"><td class="rowhead">${caret}${label}</td>${cells}<td class="total">${total}</td></tr>`
    }

    for (const k1 of r1Keys) {
      const f1 = (r: Row): boolean => String(r[r1] ?? '') === k1
      if (!r2) {
        bodyRows.push(rowLine(escapeHtml(k1), f1, '', k1))
        continue
      }
      const open = !this.collapsed.has(k1)
      const caret = `<button class="caret${open ? ' open' : ''}" data-k="${escapeHtml(k1)}" aria-expanded="${open}" aria-label="Toggle ${escapeHtml(k1)}">▶</button>`
      bodyRows.push(rowLine(escapeHtml(k1), f1, 'group', k1, caret))
      if (open) {
        const r2Keys = [...new Set(this.#data.filter(f1).map((r) => String(r[r2] ?? '')))].sort()
        for (const k2 of r2Keys) {
          const f2 = (r: Row): boolean => f1(r) && String(r[r2] ?? '') === k2
          bodyRows.push(
            rowLine(`<span class="pad"></span>${escapeHtml(k2)}`, f2, 'sub', `${k1}·${k2}`),
          )
        }
      }
    }
    const totals = `<tr class="totals"><td class="rowhead">Total</td>${colKeys
      .map((c) => `<td>${this.format(this.agg(this.cellValues(() => true, c)))}</td>`)
      .join(
        '',
      )}<td class="total">${this.format(this.agg(this.cellValues(() => true, null)))}</td></tr>`

    this.root.innerHTML = `<style>${STYLE}</style><div class="viewport"><table role="table" aria-label="Pivot table"><thead>${head}</thead><tbody>${bodyRows.join('')}${totals}</tbody></table></div>`

    this.root.querySelectorAll<HTMLButtonElement>('.caret').forEach((btn) =>
      btn.addEventListener('click', () => {
        const k = btn.dataset['k'] ?? ''
        if (this.collapsed.has(k)) this.collapsed.delete(k)
        else this.collapsed.add(k)
        this.render()
      }),
    )
    this.root.querySelectorAll<HTMLTableCellElement>('td[data-r]').forEach((td) =>
      td.addEventListener('click', () => {
        this.dispatchEvent(
          new CustomEvent('aurora-select', {
            detail: {
              row: td.dataset['r'],
              col: td.dataset['c'],
              value: td.textContent === '–' ? null : Number(td.textContent),
            },
          }),
        )
      }),
    )
  }
}

register('aurora-pivotgrid', AuroraPivotgrid)
