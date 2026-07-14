import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'
import { evaluateFormula, indexToCol, registerFormulaFunction } from '../core/formula'
import { makeXlsx, parseXlsx } from '../core/xlsx'

export interface CellStyle {
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  color?: string
}

const STYLE = `
  :host {
    display: block; font-size: 0.86rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; background: var(--aurora-surface, #14141f); overflow: hidden;
    font-variant-numeric: tabular-nums;
  }
  .bar {
    display: flex; gap: 10px; align-items: center; padding: 8px 12px;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
  }
  .fmt { display: flex; gap: 3px; }
  .fmt button {
    all: unset; cursor: pointer; width: 26px; height: 26px; display: inline-grid;
    place-items: center; border-radius: 7px; font-size: 0.82rem; color: var(--aurora-muted, #9a98b3);
  }
  .fmt button:hover { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.06); }
  .fmt button.on { color: #fff; background: var(--aurora-accent, #6d5cff); }
  .fmt button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .fmt .swatch { position: relative; overflow: hidden; }
  .fmt .swatch input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .ref {
    min-width: 46px; text-align: center; font-size: 0.78rem; padding: 4px 8px;
    border-radius: 7px; background: rgba(255, 255, 255, 0.05);
    color: var(--aurora-muted, #9a98b3);
  }
  .fx {
    all: unset; flex: 1; min-width: 0; padding: 0.35rem 0.7rem; font: inherit; font-size: 0.86rem;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.35)); border-radius: 8px;
  }
  .fx:focus { border-color: var(--aurora-accent, #6d5cff); }
  .viewport { overflow: auto; max-height: var(--aurora-grid-height, 340px); }
  table { border-collapse: collapse; width: 100%; }
  th {
    position: sticky; top: 0; z-index: 2; background: var(--aurora-surface, #14141f);
    font-weight: 500; font-size: 0.72rem; color: var(--aurora-muted, #9a98b3);
    padding: 0.35rem 0.5rem; border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.06));
    min-width: 74px;
  }
  th.rowh { position: sticky; left: 0; z-index: 1; min-width: 34px; }
  th.corner { left: 0; z-index: 3; }
  td {
    padding: 0.35rem 0.6rem; border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.05));
    text-align: end; cursor: cell; white-space: nowrap; min-width: 74px; height: 1.4em;
  }
  td.text { text-align: start; }
  td.err { color: var(--aurora-danger, #f43f5e); font-size: 0.78rem; }
  td[aria-selected='true'] {
    outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px;
    background: rgba(109, 92, 255, 0.09);
  }
  td input {
    all: unset; width: 100%; font: inherit; text-align: end;
  }
`

/**
 * `<aurora-spreadsheet rows="12" cols="8">` — a formula-capable sheet:
 * type values or `=SUM(A1:B3)`-style formulas (SUM, AVG, MIN, MAX, COUNT,
 * arithmetic with cell refs and parentheses), recalculated on every commit
 * with circular-reference detection. Click or arrow between cells, edit with
 * Enter/F2/typing, commit with Enter (moves down) or Tab (moves right); the
 * formula bar shows and edits the raw value. `data` in/out as a
 * `{ A1: raw }` map; `styles` carries `{ A1: { bold, italic, align, color } }`
 * cell formatting (a toolbar edits the selected cell); `toCsv()` and
 * `toExcel()`/`exportExcel()` export computed values, `importExcel()` reads
 * .xlsx files back in (in-house zip reader, store and deflate);
 * `AuroraSpreadsheet.registerFunction()` extends the formula engine. Emits
 * `aurora-change` with `{ ref, raw, value }`.
 */
export class AuroraSpreadsheet extends AuroraElement {
  private cells = new Map<string, string>()
  private cellStyles = new Map<string, CellStyle>()
  private selected = 'A1'
  private editing = false

  /** Register a custom formula function usable across every sheet. */
  static registerFunction(name: string, fn: (values: number[]) => number): void {
    registerFormulaFunction(name, fn)
  }

  get styles(): Record<string, CellStyle> {
    return Object.fromEntries(this.cellStyles)
  }

  set styles(v: Record<string, CellStyle>) {
    this.cellStyles = new Map(Object.entries(v ?? {}))
    this.render()
  }

  /** Merge style patches into the selected cell (or a given ref). */
  formatCell(patch: CellStyle, ref = this.selected): void {
    const key = ref.toUpperCase()
    const current = this.cellStyles.get(key) ?? {}
    const next = { ...current, ...patch }
    if (patch.bold !== undefined && current.bold === patch.bold)
      next.bold = !patch.bold ? undefined : patch.bold
    this.cellStyles.set(key, next)
    this.render()
    this.focusCell(key)
  }

  /** Load a .xlsx file's first worksheet into the sheet (replaces data). */
  async importExcel(bytes: Uint8Array): Promise<void> {
    const cells = await parseXlsx(bytes)
    this.cells = new Map(Object.entries(cells))
    this.cellStyles.clear()
    this.render()
    this.dispatchEvent(new CustomEvent('aurora-import', { detail: { cells: this.data } }))
  }

  /** The current sheet as .xlsx bytes (computed values). */
  toExcel(): Uint8Array {
    const rows = this.numberAttr('rows', 12)
    const cols = this.numberAttr('cols', 8)
    const grid: unknown[][] = []
    for (let r = 1; r <= rows; r++)
      grid.push(Array.from({ length: cols }, (_, c) => this.valueAt(`${indexToCol(c)}${r}`)))
    return makeXlsx(null, grid, 'Sheet1')
  }

  /** Download the sheet as an Excel workbook. */
  exportExcel(filename = 'sheet.xlsx'): void {
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

  get data(): Record<string, string> {
    return Object.fromEntries(this.cells)
  }

  set data(v: Record<string, string>) {
    this.cells = new Map(Object.entries(v ?? {}))
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  setCell(ref: string, raw: string): void {
    const key = ref.toUpperCase()
    if (raw === '') this.cells.delete(key)
    else this.cells.set(key, raw)
    this.render()
    this.dispatchEvent(
      new CustomEvent('aurora-change', {
        detail: { ref: key, raw, value: this.valueAt(key) },
      }),
    )
  }

  getCell(ref: string): string {
    return this.cells.get(ref.toUpperCase()) ?? ''
  }

  /** The computed value of a cell (formulas evaluated, errors as strings). */
  valueAt(ref: string, visiting = new Set<string>()): number | string {
    const key = ref.toUpperCase()
    const raw = this.cells.get(key) ?? ''
    if (!raw.startsWith('=')) {
      const n = Number(raw)
      return raw !== '' && !Number.isNaN(n) ? n : raw
    }
    if (visiting.has(key)) return '#CIRC'
    visiting.add(key)
    try {
      return evaluateFormula(raw.slice(1), (r) => {
        const v = this.valueAt(r, visiting)
        if (v === '#CIRC') throw new Error('#CIRC')
        return v
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      return msg.startsWith('#') ? msg : '#ERR'
    } finally {
      visiting.delete(key)
    }
  }

  toCsv(): string {
    const rows = this.numberAttr('rows', 12)
    const cols = this.numberAttr('cols', 8)
    const esc = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines: string[] = []
    for (let r = 1; r <= rows; r++)
      lines.push(
        Array.from({ length: cols }, (_, c) => esc(this.valueAt(`${indexToCol(c)}${r}`))).join(','),
      )
    return lines.join('\n')
  }

  private render(): void {
    const rows = this.numberAttr('rows', 12)
    const cols = this.numberAttr('cols', 8)
    const head = Array.from({ length: cols }, (_, c) => `<th>${indexToCol(c)}</th>`).join('')
    let body = ''
    for (let r = 1; r <= rows; r++) {
      body += `<tr><th class="rowh">${r}</th>${Array.from({ length: cols }, (_, c) => {
        const ref = `${indexToCol(c)}${r}`
        const value = this.valueAt(ref)
        const isErr = typeof value === 'string' && value.startsWith('#')
        const isText = typeof value === 'string' && !isErr
        const cs = this.cellStyles.get(ref)
        const styleAttr = cs
          ? ` style="${cs.bold ? 'font-weight:700;' : ''}${cs.italic ? 'font-style:italic;' : ''}${cs.align ? `text-align:${cs.align};` : ''}${cs.color ? `color:${cs.color};` : ''}"`
          : ''
        return `<td data-ref="${ref}" tabindex="-1" class="${isErr ? 'err' : isText ? 'text' : ''}"${styleAttr} aria-selected="${ref === this.selected}">${escapeHtml(String(value))}</td>`
      }).join('')}</tr>`
    }
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="bar" part="bar"><span class="ref">${escapeHtml(this.selected)}</span><input class="fx" part="formula" aria-label="Formula" value="${escapeHtml(this.getCell(this.selected))}" spellcheck="false" /><div class="fmt" part="format"><button data-f="bold" aria-label="Bold"><b>B</b></button><button data-f="italic" aria-label="Italic"><i>I</i></button><button data-f="left" aria-label="Align left">⇤</button><button data-f="center" aria-label="Align center">↔</button><button data-f="right" aria-label="Align right">⇥</button><button class="swatch" aria-label="Text color">A<input type="color" data-f="color" value="#22d3ee" /></button><button data-f="xlsx" aria-label="Export Excel">⬇</button><button data-f="import" aria-label="Import Excel">📂</button></div></div><input type="file" accept=".xlsx" hidden />
      <div class="viewport"><table aria-label="Spreadsheet"><thead><tr><th class="corner rowh"></th>${head}</tr></thead><tbody>${body}</tbody></table></div>`
    this.wire()
  }

  private wire(): void {
    const cs = this.cellStyles.get(this.selected) ?? {}
    this.root.querySelectorAll<HTMLButtonElement>('.fmt button[data-f]').forEach((btn) => {
      const f = btn.dataset['f']
      if (f === 'bold') btn.classList.toggle('on', cs.bold === true)
      if (f === 'italic') btn.classList.toggle('on', cs.italic === true)
      if (f === cs.align) btn.classList.toggle('on', true)
      btn.addEventListener('click', () => {
        if (f === 'bold') this.formatCell({ bold: !cs.bold })
        else if (f === 'italic') this.formatCell({ italic: !cs.italic })
        else if (f === 'left' || f === 'center' || f === 'right') this.formatCell({ align: f })
        else if (f === 'xlsx') this.exportExcel()
        else if (f === 'import')
          this.root.querySelector<HTMLInputElement>('input[type="file"]')?.click()
      })
    })
    this.root
      .querySelector<HTMLInputElement>('input[type="file"]')
      ?.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        void file.arrayBuffer().then((buf) => this.importExcel(new Uint8Array(buf)))
      })
    this.root
      .querySelector<HTMLInputElement>('.fmt input[data-f="color"]')
      ?.addEventListener('input', (e) => {
        this.formatCell({ color: (e.target as HTMLInputElement).value })
      })
    const fx = this.root.querySelector<HTMLInputElement>('.fx')
    fx?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.setCell(this.selected, fx.value)
        this.focusCell(this.selected)
      }
    })
    this.root.querySelectorAll<HTMLTableCellElement>('td[data-ref]').forEach((td) => {
      const ref = td.dataset['ref'] ?? 'A1'
      td.addEventListener('click', () => this.select(ref))
      td.addEventListener('dblclick', () => this.edit(td))
      td.addEventListener('keydown', (e) => {
        if (this.editing) return
        if (e.key === 'Enter' || e.key === 'F2') {
          e.preventDefault()
          this.edit(td)
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          this.edit(td, e.key)
        } else if (e.key.startsWith('Arrow')) {
          e.preventDefault()
          this.move(ref, e.key)
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          this.setCell(ref, '')
          this.focusCell(ref)
        }
      })
    })
  }

  private select(ref: string): void {
    this.selected = ref
    this.root.querySelectorAll('td[data-ref]').forEach((td) => {
      td.setAttribute('aria-selected', String((td as HTMLTableCellElement).dataset['ref'] === ref))
    })
    const refBadge = this.root.querySelector('.ref')
    if (refBadge) refBadge.textContent = ref
    const fx = this.root.querySelector<HTMLInputElement>('.fx')
    if (fx) fx.value = this.getCell(ref)
    this.focusCell(ref)
  }

  private focusCell(ref: string): void {
    const td = this.root.querySelector<HTMLTableCellElement>(`td[data-ref="${ref}"]`)
    if (td) {
      td.tabIndex = 0
      td.focus()
    }
  }

  private move(ref: string, key: string): void {
    const m = /^([A-Z]+)(\d+)$/.exec(ref)
    if (!m) return
    let col = (m[1] ?? 'A').charCodeAt(0) - 65
    let row = Number(m[2])
    if (key === 'ArrowUp') row = Math.max(1, row - 1)
    else if (key === 'ArrowDown') row = Math.min(this.numberAttr('rows', 12), row + 1)
    else if (key === 'ArrowLeft') col = Math.max(0, col - 1)
    else if (key === 'ArrowRight') col = Math.min(this.numberAttr('cols', 8) - 1, col + 1)
    this.select(`${indexToCol(col)}${row}`)
  }

  private edit(td: HTMLTableCellElement, seed?: string): void {
    const ref = td.dataset['ref'] ?? 'A1'
    this.selected = ref
    this.editing = true
    const raw = seed ?? this.getCell(ref)
    td.innerHTML = `<input value="${escapeHtml(raw)}" aria-label="Edit ${ref}" />`
    const input = td.querySelector('input')
    if (!input) return
    input.focus()
    if (!seed) input.select()
    let done = false
    const commit = (advance: 'down' | 'right' | null): void => {
      if (done) return
      done = true
      this.editing = false
      this.setCell(ref, input.value)
      if (advance) this.move(ref, advance === 'down' ? 'ArrowDown' : 'ArrowRight')
      else this.focusCell(ref)
    }
    input.addEventListener('blur', () => commit(null))
    input.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        e.preventDefault()
        commit('down')
      } else if (e.key === 'Tab') {
        e.preventDefault()
        commit('right')
      } else if (e.key === 'Escape') {
        done = true
        this.editing = false
        this.render()
        this.focusCell(ref)
      }
    })
  }
}

register('aurora-spreadsheet', AuroraSpreadsheet)
