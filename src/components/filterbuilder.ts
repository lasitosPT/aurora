import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

export interface FilterField {
  field: string
  label?: string
  type?: 'string' | 'number'
}

export interface FilterRule {
  field: string
  op: string
  value: string
}

export interface FilterExpression {
  logic: 'and' | 'or'
  rules: FilterRule[]
}

const OPS: Record<string, { op: string; label: string }[]> = {
  string: [
    { op: 'contains', label: 'contains' },
    { op: 'equals', label: 'equals' },
    { op: 'starts', label: 'starts with' },
    { op: 'ends', label: 'ends with' },
  ],
  number: [
    { op: 'eq', label: '=' },
    { op: 'neq', label: '≠' },
    { op: 'gt', label: '>' },
    { op: 'lt', label: '<' },
    { op: 'gte', label: '≥' },
    { op: 'lte', label: '≤' },
  ],
}

const STYLE = `
  :host {
    display: block; font-size: 0.88rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; background: var(--aurora-surface, #14141f); padding: 14px;
  }
  .logic { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.8rem; color: var(--aurora-muted, #9a98b3); }
  .logic button {
    all: unset; cursor: pointer; padding: 3px 12px; border-radius: 7px; font-size: 0.8rem;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12)); color: var(--aurora-muted, #9a98b3);
  }
  .logic button[aria-pressed='true'] { background: var(--aurora-accent, #6d5cff); color: #fff; border-color: var(--aurora-accent, #6d5cff); }
  .logic button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .rule { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; flex-wrap: wrap; }
  select, input {
    all: unset; box-sizing: border-box; padding: 0.42rem 0.65rem; font: inherit; font-size: 0.86rem;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 9px;
  }
  select { appearance: auto; cursor: pointer; }
  select:focus, input:focus { border-color: var(--aurora-accent, #6d5cff); }
  input { flex: 1; min-width: 110px; }
  .remove {
    all: unset; cursor: pointer; width: 26px; height: 26px; display: grid; place-items: center;
    border-radius: 8px; color: var(--aurora-muted, #9a98b3);
  }
  .remove:hover { color: var(--aurora-danger, #f43f5e); background: rgba(255, 255, 255, 0.05); }
  .remove:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .add {
    all: unset; cursor: pointer; font-size: 0.82rem; padding: 5px 12px; border-radius: 8px;
    color: var(--aurora-accent, #6d5cff); border: 1px dashed var(--aurora-border, rgba(255, 255, 255, 0.2));
  }
  .add:hover { border-color: var(--aurora-accent, #6d5cff); }
  .add:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
`

/**
 * `<aurora-filterbuilder>` — a standalone filter expression builder: rows of
 * field / operator / value with AND-OR logic, add and remove. Assign
 * `fields`; read `expression`, evaluate rows with `test(row)` or
 * `apply(rows)`. Emits `aurora-change` with the expression on every edit.
 */
export class AuroraFilterbuilder extends AuroraElement {
  #fields: FilterField[] = []
  private logic: 'and' | 'or' = 'and'
  private rules: FilterRule[] = []

  get fields(): FilterField[] {
    return this.#fields
  }

  set fields(v: FilterField[]) {
    this.#fields = v ?? []
    if (!this.rules.length && this.#fields[0])
      this.rules = [
        {
          field: this.#fields[0].field,
          op: this.opsFor(this.#fields[0].field)[0]?.op ?? 'contains',
          value: '',
        },
      ]
    this.render()
  }

  get expression(): FilterExpression {
    return { logic: this.logic, rules: this.rules.map((r) => ({ ...r })) }
  }

  set expression(v: FilterExpression) {
    this.logic = v.logic
    this.rules = v.rules.map((r) => ({ ...r }))
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  /** Evaluate one row against the current expression. */
  test(row: Record<string, unknown>): boolean {
    const results = this.rules
      .filter((r) => r.value !== '')
      .map((r) => {
        const raw = row[r.field]
        const s = String(raw ?? '').toLowerCase()
        const q = r.value.toLowerCase()
        const a = Number(raw)
        const b = Number(r.value)
        switch (r.op) {
          case 'contains':
            return s.includes(q)
          case 'equals':
            return s === q
          case 'starts':
            return s.startsWith(q)
          case 'ends':
            return s.endsWith(q)
          case 'eq':
            return a === b
          case 'neq':
            return a !== b
          case 'gt':
            return a > b
          case 'lt':
            return a < b
          case 'gte':
            return a >= b
          case 'lte':
            return a <= b
          default:
            return true
        }
      })
    if (!results.length) return true
    return this.logic === 'and' ? results.every(Boolean) : results.some(Boolean)
  }

  /** Filter an array of rows through the expression. */
  apply<T extends Record<string, unknown>>(rows: T[]): T[] {
    return rows.filter((r) => this.test(r))
  }

  private opsFor(field: string): { op: string; label: string }[] {
    const type = this.#fields.find((f) => f.field === field)?.type ?? 'string'
    return OPS[type] ?? OPS['string'] ?? []
  }

  private render(): void {
    const rows = this.rules
      .map((rule, i) => {
        const ops = this.opsFor(rule.field)
        return `<div class="rule" data-i="${i}">
          <select data-r="field" aria-label="Field">${this.#fields
            .map(
              (f) =>
                `<option value="${escapeHtml(f.field)}" ${f.field === rule.field ? 'selected' : ''}>${escapeHtml(f.label ?? f.field)}</option>`,
            )
            .join('')}</select>
          <select data-r="op" aria-label="Operator">${ops
            .map(
              (o) =>
                `<option value="${escapeHtml(o.op)}" ${o.op === rule.op ? 'selected' : ''}>${escapeHtml(o.label)}</option>`,
            )
            .join('')}</select>
          <input data-r="value" value="${escapeHtml(rule.value)}" placeholder="Value…" aria-label="Value" />
          <button class="remove" aria-label="Remove rule">✕</button>
        </div>`
      })
      .join('')
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="logic">Match <button data-l="and" aria-pressed="${this.logic === 'and'}">ALL</button><button data-l="or" aria-pressed="${this.logic === 'or'}">ANY</button> of the rules</div>
      ${rows}
      <button class="add">+ Add rule</button>`
    this.root.querySelectorAll<HTMLButtonElement>('[data-l]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.logic = btn.dataset['l'] === 'or' ? 'or' : 'and'
        this.render()
        this.emit()
      }),
    )
    this.root.querySelector('.add')?.addEventListener('click', () => {
      const first = this.#fields[0]
      if (!first) return
      this.rules.push({
        field: first.field,
        op: this.opsFor(first.field)[0]?.op ?? 'contains',
        value: '',
      })
      this.render()
      this.emit()
    })
    this.root.querySelectorAll<HTMLElement>('.rule').forEach((row) => {
      const i = Number(row.dataset['i'])
      row.querySelector('.remove')?.addEventListener('click', () => {
        this.rules.splice(i, 1)
        this.render()
        this.emit()
      })
      row.querySelectorAll<HTMLSelectElement>('select').forEach((sel) =>
        sel.addEventListener('change', () => {
          const rule = this.rules[i]
          if (!rule) return
          if (sel.dataset['r'] === 'field') {
            rule.field = sel.value
            rule.op = this.opsFor(sel.value)[0]?.op ?? 'contains'
          } else rule.op = sel.value
          this.render()
          this.emit()
        }),
      )
      row.querySelector<HTMLInputElement>('input')?.addEventListener('input', (e) => {
        const rule = this.rules[i]
        if (rule) rule.value = (e.target as HTMLInputElement).value
        this.emit()
      })
    })
  }

  private emit(): void {
    this.dispatchEvent(
      new CustomEvent('aurora-change', { detail: { expression: this.expression } }),
    )
  }
}

register('aurora-filterbuilder', AuroraFilterbuilder)
