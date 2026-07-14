import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

type Row = Record<string, unknown>

const STYLE = `
  :host { display: inline-block; width: 300px; position: relative; color: var(--aurora-fg, #ececf2); }
  .label {
    display: block; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); margin-bottom: 7px;
  }
  input {
    all: unset; box-sizing: border-box; width: 100%; padding: 0.6rem 0.9rem; font: inherit;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 11px;
    transition: border-color 0.15s ease;
  }
  input:focus { border-color: var(--aurora-accent, #6d5cff); }
  .panel {
    position: absolute; top: calc(100% + 6px); inset-inline-start: 0; min-width: 100%; max-height: 280px;
    overflow: auto; display: none; z-index: var(--aurora-menu-z, 60);
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 12px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  }
  :host([open]) .panel { display: block; }
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  th {
    text-align: start; padding: 0.5rem 0.9rem; font-size: 0.72rem; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--aurora-muted, #9a98b3);
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
    position: sticky; top: 0; background: var(--aurora-surface, #16161f);
  }
  td { padding: 0.5rem 0.9rem; border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.05)); }
  tbody tr { cursor: pointer; }
  tbody tr:hover, tbody tr.active { background: rgba(109, 92, 255, 0.14); }
  mark { background: none; color: var(--aurora-accent2, #22d3ee); }
  .none { padding: 14px; color: var(--aurora-muted, #9a98b3); font-size: 0.85rem; }
`

/**
 * `<aurora-multicolumncombobox>` — a combobox whose dropdown is a mini
 * table: assign `columns` (`{ field, title? }[]`), `data`, and the
 * `value-field`/`text-field` attrs; typing filters across every column with
 * highlighted matches, arrows/Enter pick rows. Form-associated; emits
 * `aurora-change` with `{ value, row }`.
 */
export class AuroraMulticolumncombobox extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  #columns: { field: string; title?: string }[] = []
  #data: Row[] = []
  private input: HTMLInputElement | null = null
  private activeIdx = -1

  constructor() {
    super()
    if ('attachInternals' in this) {
      try {
        this.internals = this.attachInternals()
      } catch {
        this.internals = null
      }
    }
  }

  get columns(): { field: string; title?: string }[] {
    return this.#columns
  }

  set columns(v: { field: string; title?: string }[]) {
    this.#columns = v ?? []
    this.renderList()
  }

  get data(): Row[] {
    return this.#data
  }

  set data(v: Row[]) {
    this.#data = v ?? []
    this.renderList()
  }

  get value(): string {
    return this.input?.value ?? ''
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label">${escapeHtml(label)}</label>` : ''
    }<input part="input" role="combobox" aria-expanded="false" aria-autocomplete="list" placeholder="${escapeHtml(
      this.getAttribute('placeholder') ?? '',
    )}"${label ? ` aria-label="${escapeHtml(label)}"` : ''}/><div class="panel" part="panel"></div>`
    this.input = this.root.querySelector('input')
    this.input?.addEventListener('input', () => {
      this.activeIdx = -1
      this.open()
      this.renderList()
    })
    this.input?.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (!this.root.activeElement) this.close()
      }, 120)
    })
    this.input?.addEventListener('keydown', (e) => {
      const rows = this.hits()
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!this.hasAttribute('open')) this.open()
        if (!rows.length) return
        this.activeIdx =
          e.key === 'ArrowDown'
            ? (this.activeIdx + 1) % rows.length
            : (this.activeIdx + rows.length - 1 + rows.length) % rows.length
        this.renderList()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const pickIdx = this.activeIdx >= 0 ? this.activeIdx : rows.length === 1 ? 0 : -1
        const row = rows[pickIdx]
        if (row) this.commit(row)
      } else if (e.key === 'Escape') {
        this.close()
      }
    })
  }

  open(): void {
    this.setAttribute('open', '')
    this.input?.setAttribute('aria-expanded', 'true')
    this.renderList()
  }

  close(): void {
    this.removeAttribute('open')
    this.input?.setAttribute('aria-expanded', 'false')
    this.activeIdx = -1
  }

  private hits(): Row[] {
    const q = this.value.trim().toLowerCase()
    if (!q) return this.#data
    return this.#data.filter((row) =>
      this.#columns.some((c) =>
        String(row[c.field] ?? '')
          .toLowerCase()
          .includes(q),
      ),
    )
  }

  private commit(row: Row): void {
    const textField = this.getAttribute('text-field') ?? this.#columns[0]?.field ?? ''
    const valueField = this.getAttribute('value-field') ?? textField
    if (this.input) this.input.value = String(row[textField] ?? '')
    this.close()
    const value = String(row[valueField] ?? '')
    this.internals?.setFormValue(value)
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value, row } }))
  }

  private renderList(): void {
    const panel = this.root.querySelector('.panel')
    if (!panel) return
    const rows = this.hits()
    if (!rows.length) {
      panel.innerHTML = '<div class="none">No matches</div>'
      return
    }
    const q = this.value.trim()
    const rx = q ? new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig') : null
    const mark = (s: string): string =>
      rx ? escapeHtml(s).replace(rx, '<mark>$1</mark>') : escapeHtml(s)
    panel.innerHTML = `<table role="listbox"><thead><tr>${this.#columns
      .map((c) => `<th>${escapeHtml(c.title ?? c.field)}</th>`)
      .join('')}</tr></thead><tbody>${rows
      .map(
        (row, i) =>
          `<tr role="option" data-i="${i}" class="${i === this.activeIdx ? 'active' : ''}">${this.#columns
            .map((c) => `<td>${mark(String(row[c.field] ?? ''))}</td>`)
            .join('')}</tr>`,
      )
      .join('')}</tbody></table>`
    panel.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((tr) =>
      tr.addEventListener('click', () => {
        const row = rows[Number(tr.dataset['i'])]
        if (row) this.commit(row)
      }),
    )
  }
}

register('aurora-multicolumncombobox', AuroraMulticolumncombobox)
