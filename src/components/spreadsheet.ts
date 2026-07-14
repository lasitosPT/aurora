import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'
import { evaluateFormula, indexToCol, registerFormulaFunction } from '../core/formula'
import { makeXlsxSheets, parseXlsxSheets } from '../core/xlsx'

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
  .tabs {
    display: flex; gap: 3px; align-items: center; padding: 5px 8px;
    border-top: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
    overflow-x: auto;
  }
  .tabs .tab {
    all: unset; cursor: pointer; padding: 3px 13px; border-radius: 7px;
    font-size: 0.78rem; color: var(--aurora-muted, #9a98b3); white-space: nowrap;
  }
  .tabs .tab:hover { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.05); }
  .tabs .tab.on { color: #fff; background: var(--aurora-accent, #6d5cff); }
  .tabs .tab:focus-visible, .tabs .add:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .tabs .tab input { all: unset; width: 72px; font: inherit; color: inherit; }
  .tabs .add {
    all: unset; cursor: pointer; width: 22px; height: 22px; display: inline-grid;
    place-items: center; border-radius: 6px; color: var(--aurora-muted, #9a98b3);
  }
  .tabs .add:hover { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.06); }
  td.cm { position: relative; }
  td.cm::after {
    content: ''; position: absolute; top: 0; inset-inline-end: 0;
    border: 4px solid transparent; border-top-color: #f5b83d; border-inline-end-color: #f5b83d;
  }
  .cpanel {
    display: flex; gap: 8px; align-items: center; padding: 7px 12px;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
  }
  .cpanel input {
    all: unset; flex: 1; min-width: 0; padding: 0.3rem 0.7rem; font-size: 0.84rem;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.35)); border-radius: 8px;
  }
  .cpanel button {
    all: unset; cursor: pointer; font-size: 0.78rem; padding: 4px 12px; border-radius: 7px;
    color: var(--aurora-muted, #9a98b3); border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .cpanel button:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  .cpanel button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
`

interface SheetState {
  name: string
  cells: Map<string, string>
  styles: Map<string, CellStyle>
  comments: Map<string, string>
}

/**
 * `<aurora-spreadsheet rows="12" cols="8">` — a formula-capable sheet:
 * type values or `=SUM(A1:B3)`-style formulas (SUM, AVG, MIN, MAX, COUNT,
 * arithmetic with cell refs and parentheses), recalculated on every commit
 * with circular-reference detection. Click or arrow between cells, edit with
 * Enter/F2/typing, commit with Enter (moves down) or Tab (moves right); the
 * formula bar shows and edits the raw value. `data` in/out as a
 * `{ A1: raw }` map; `styles` carries `{ A1: { bold, italic, align, color } }`
 * cell formatting (a toolbar edits the selected cell). Sheet tabs along the
 * bottom hold independent worksheets — click to switch, double-click to
 * rename, `+` / `addSheet()` to append, `activeSheet` to drive it from code.
 * `toCsv()` exports the active sheet; `toExcel()`/`exportExcel()` write every
 * tab as a real worksheet and `importExcel()` reads all worksheets back into
 * tabs (in-house zip reader, store and deflate). Cell comments (💬 or
 * `setComment()`) mark cells with a corner flag and show on hover, per sheet.
 * `editors` maps refs ("B2") or whole columns ("B") to value lists, turning
 * those cells' editors into selects;
 * `AuroraSpreadsheet.registerFunction()` extends the formula engine. Emits
 * `aurora-change` with `{ ref, raw, value }`.
 */
export class AuroraSpreadsheet extends AuroraElement {
  private sheets: SheetState[] = [
    { name: 'Sheet1', cells: new Map(), styles: new Map(), comments: new Map() },
  ]
  /** Cell/column list editors: keys are refs ("B2") or column letters ("B"). */
  editors: Record<string, string[]> = {}
  private commenting = false
  private active = 0
  private selected = 'A1'
  private editing = false

  private get cells(): Map<string, string> {
    return (this.sheets[this.active] as SheetState).cells
  }

  private set cells(v: Map<string, string>) {
    ;(this.sheets[this.active] as SheetState).cells = v
  }

  private get cellStyles(): Map<string, CellStyle> {
    return (this.sheets[this.active] as SheetState).styles
  }

  private set cellStyles(v: Map<string, CellStyle>) {
    ;(this.sheets[this.active] as SheetState).styles = v
  }

  /** The active sheet's comments as an `{ A1: text }` map. */
  get comments(): Record<string, string> {
    return Object.fromEntries((this.sheets[this.active] as SheetState).comments)
  }

  set comments(v: Record<string, string>) {
    ;(this.sheets[this.active] as SheetState).comments = new Map(Object.entries(v ?? {}))
    this.render()
  }

  /** Attach, replace, or (with null/'') remove a cell comment. */
  setComment(ref: string, text: string | null): void {
    const key = ref.toUpperCase()
    const comments = (this.sheets[this.active] as SheetState).comments
    if (text) comments.set(key, text)
    else comments.delete(key)
    this.render()
    this.dispatchEvent(new CustomEvent('aurora-comment', { detail: { ref: key, text } }))
  }

  getComment(ref: string): string {
    return (this.sheets[this.active] as SheetState).comments.get(ref.toUpperCase()) ?? ''
  }

  /** The list editor (if any) governing a cell ref. */
  private editorFor(ref: string): string[] | null {
    const key = ref.toUpperCase()
    const direct = this.editors[key]
    if (direct) return direct
    const col = /^([A-Z]+)\d+$/.exec(key)?.[1]
    return (col ? this.editors[col] : undefined) ?? null
  }

  /** Sheet names in tab order. */
  get sheetNames(): string[] {
    return this.sheets.map((sh) => sh.name)
  }

  /** Index of the active sheet; assign to switch tabs. */
  get activeSheet(): number {
    return this.active
  }

  set activeSheet(i: number) {
    const next = Math.max(0, Math.min(this.sheets.length - 1, i))
    if (next === this.active) return
    this.active = next
    this.selected = 'A1'
    this.render()
    this.dispatchEvent(
      new CustomEvent('aurora-sheet', {
        detail: { index: this.active, name: this.sheets[this.active]?.name },
      }),
    )
  }

  /** Append a sheet (auto-named unless given) and switch to it. */
  addSheet(name?: string): number {
    this.sheets.push({
      name: name ?? `Sheet${this.sheets.length + 1}`,
      cells: new Map(),
      styles: new Map(),
      comments: new Map(),
    })
    this.active = this.sheets.length - 1
    this.selected = 'A1'
    this.render()
    this.dispatchEvent(
      new CustomEvent('aurora-sheet', {
        detail: { index: this.active, name: this.sheets[this.active]?.name },
      }),
    )
    return this.active
  }

  /** Remove a sheet by index (the last sheet cannot be removed). */
  removeSheet(i: number): void {
    if (this.sheets.length <= 1 || !this.sheets[i]) return
    this.sheets.splice(i, 1)
    this.active = Math.min(this.active, this.sheets.length - 1)
    this.render()
  }

  renameSheet(i: number, name: string): void {
    const sheet = this.sheets[i]
    if (!sheet || !name.trim()) return
    sheet.name = name.trim()
    this.render()
  }

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

  /** Load every worksheet of a .xlsx file into tabs (replaces all sheets). */
  async importExcel(bytes: Uint8Array): Promise<void> {
    const parsed = await parseXlsxSheets(bytes)
    if (!parsed.length) return
    this.sheets = parsed.map((sh) => ({
      name: sh.name,
      cells: new Map(Object.entries(sh.cells)),
      styles: new Map(),
      comments: new Map(),
    }))
    this.active = 0
    this.selected = 'A1'
    this.render()
    this.dispatchEvent(
      new CustomEvent('aurora-import', {
        detail: { cells: this.data, sheets: this.sheetNames },
      }),
    )
  }

  /** The whole workbook as .xlsx bytes — one worksheet per tab, computed values. */
  toExcel(): Uint8Array {
    const rows = this.numberAttr('rows', 12)
    const cols = this.numberAttr('cols', 8)
    const remembered = this.active
    const workbook = this.sheets.map((sh, i) => {
      this.active = i
      const grid: unknown[][] = []
      for (let r = 1; r <= rows; r++)
        grid.push(Array.from({ length: cols }, (_, c) => this.valueAt(`${indexToCol(c)}${r}`)))
      return { name: sh.name, headers: null, rows: grid }
    })
    this.active = remembered
    return makeXlsxSheets(workbook)
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
        const note = this.getComment(ref)
        const noteAttr = note ? ` title="${escapeHtml(note)}"` : ''
        return `<td data-ref="${ref}" tabindex="-1" class="${[isErr ? 'err' : isText ? 'text' : '', note ? 'cm' : ''].filter(Boolean).join(' ')}"${styleAttr}${noteAttr} aria-selected="${ref === this.selected}">${escapeHtml(String(value))}</td>`
      }).join('')}</tr>`
    }
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="bar" part="bar"><span class="ref">${escapeHtml(this.selected)}</span><input class="fx" part="formula" aria-label="Formula" value="${escapeHtml(this.getCell(this.selected))}" spellcheck="false" /><div class="fmt" part="format"><button data-f="bold" aria-label="Bold"><b>B</b></button><button data-f="italic" aria-label="Italic"><i>I</i></button><button data-f="left" aria-label="Align left">⇤</button><button data-f="center" aria-label="Align center">↔</button><button data-f="right" aria-label="Align right">⇥</button><button class="swatch" aria-label="Text color">A<input type="color" data-f="color" value="#22d3ee" /></button><button data-f="comment" aria-label="Cell comment">💬</button><button data-f="xlsx" aria-label="Export Excel">⬇</button><button data-f="import" aria-label="Import Excel">📂</button></div></div><input type="file" accept=".xlsx" hidden />${
        this.commenting
          ? `<div class="cpanel" part="comment"><span class="ref">${escapeHtml(this.selected)}</span><input class="ctext" aria-label="Comment for ${escapeHtml(this.selected)}" value="${escapeHtml(this.getComment(this.selected))}" placeholder="Add a comment…" /><button data-csave>Save</button><button data-cremove>Remove</button></div>`
          : ''
      }
      <div class="viewport"><table aria-label="Spreadsheet"><thead><tr><th class="corner rowh"></th>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <div class="tabs" part="tabs" role="tablist" aria-label="Sheets">${this.sheets
        .map(
          (sh, i) =>
            `<button class="tab${i === this.active ? ' on' : ''}" role="tab" aria-selected="${i === this.active}" data-s="${i}">${escapeHtml(sh.name)}</button>`,
        )
        .join('')}<button class="add" aria-label="Add sheet">+</button></div>`
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
        else if (f === 'comment') {
          this.commenting = !this.commenting
          this.render()
          if (this.commenting) this.root.querySelector<HTMLInputElement>('.ctext')?.focus()
        } else if (f === 'import')
          this.root.querySelector<HTMLInputElement>('input[type="file"]')?.click()
      })
    })
    const ctext = this.root.querySelector<HTMLInputElement>('.ctext')
    const commitComment = (): void => {
      this.commenting = false
      this.setComment(this.selected, ctext?.value ?? '')
    }
    this.root.querySelector('[data-csave]')?.addEventListener('click', commitComment)
    this.root.querySelector('[data-cremove]')?.addEventListener('click', () => {
      this.commenting = false
      this.setComment(this.selected, null)
    })
    ctext?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitComment()
      else if (e.key === 'Escape') {
        this.commenting = false
        this.render()
      }
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
    this.root.querySelectorAll<HTMLButtonElement>('.tabs .tab').forEach((tab) => {
      const i = Number(tab.dataset['s'])
      tab.addEventListener('click', () => {
        this.activeSheet = i
      })
      tab.addEventListener('dblclick', () => {
        const current = this.sheets[i]?.name ?? ''
        tab.innerHTML = `<input value="${escapeHtml(current)}" aria-label="Rename sheet" />`
        const input = tab.querySelector('input')
        if (!input) return
        input.focus()
        input.select()
        const commit = (): void => this.renameSheet(i, input.value || current)
        input.addEventListener('blur', commit)
        input.addEventListener('keydown', (e) => {
          e.stopPropagation()
          if (e.key === 'Enter') commit()
          else if (e.key === 'Escape') this.render()
        })
      })
    })
    this.root.querySelector('.tabs .add')?.addEventListener('click', () => {
      this.addSheet()
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
    const list = this.editorFor(ref)
    if (list) {
      this.editing = true
      const current = this.getCell(ref)
      td.innerHTML = `<select aria-label="Edit ${ref}">${list
        .map(
          (v) =>
            `<option value="${escapeHtml(v)}"${v === current ? ' selected' : ''}>${escapeHtml(v)}</option>`,
        )
        .join('')}</select>`
      const select = td.querySelector('select')
      if (!select) return
      select.focus()
      let selDone = false
      const commitSel = (): void => {
        if (selDone) return
        selDone = true
        this.editing = false
        this.setCell(ref, select.value)
        this.focusCell(ref)
      }
      select.addEventListener('change', commitSel)
      select.addEventListener('blur', commitSel)
      select.addEventListener('keydown', (e) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
          selDone = true
          this.editing = false
          this.render()
          this.focusCell(ref)
        }
      })
      return
    }
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
