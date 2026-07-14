import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'
import './checkbox'
import type { AuroraCheckbox } from './checkbox'

export interface PropertyDef {
  key: string
  label?: string
  type?: 'string' | 'number' | 'boolean' | 'select' | 'color'
  options?: string[]
  group?: string
}

const STYLE = `
  :host {
    display: block; font-size: 0.88rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .group {
    padding: 0.55rem 1rem; font-size: 0.72rem; letter-spacing: 0.07em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); background: rgba(255, 255, 255, 0.025);
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.06));
  }
  .row {
    display: grid; grid-template-columns: 42% 1fr; align-items: center;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.05));
  }
  .row:last-child { border-bottom: none; }
  .key { padding: 0.55rem 1rem; color: var(--aurora-muted, #9a98b3); }
  .val { padding: 0.35rem 0.8rem 0.35rem 0; display: flex; align-items: center; gap: 8px; }
  input[type='text'], input[type='number'], select {
    all: unset; box-sizing: border-box; width: 100%; padding: 0.35rem 0.6rem; font: inherit;
    background: var(--aurora-field, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.35)); border-radius: 8px;
  }
  input:focus, select:focus { border-color: var(--aurora-accent, #6d5cff); }
  select { appearance: auto; cursor: pointer; }
  input[type='color'] {
    all: unset; width: 34px; height: 26px; border-radius: 7px; cursor: pointer; overflow: hidden;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.2));
  }
  .hex { font-variant-numeric: tabular-nums; color: var(--aurora-muted, #9a98b3); font-size: 0.8rem; }
`

/**
 * `<aurora-propertygrid>` — an object inspector: assign `value` (the object)
 * and optionally `properties` (key/label/type/options/group defs — inferred
 * from the object otherwise); each property gets the right editor (text,
 * number, checkbox, select, color), grouped under headers. Edits mutate the
 * object and emit `aurora-change` with `{ key, value, object }`.
 */
export class AuroraPropertygrid extends AuroraElement {
  #value: Record<string, unknown> = {}
  #props: PropertyDef[] | null = null

  get value(): Record<string, unknown> {
    return this.#value
  }

  set value(v: Record<string, unknown>) {
    this.#value = v ?? {}
    this.render()
  }

  get properties(): PropertyDef[] | null {
    return this.#props
  }

  set properties(v: PropertyDef[] | null) {
    this.#props = v
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  private defs(): PropertyDef[] {
    if (this.#props) return this.#props
    return Object.entries(this.#value).map(([key, v]) => ({
      key,
      type:
        typeof v === 'boolean'
          ? 'boolean'
          : typeof v === 'number'
            ? 'number'
            : /^#[0-9a-f]{6}$/i.test(String(v))
              ? 'color'
              : 'string',
    }))
  }

  private editor(def: PropertyDef): string {
    const raw = this.#value[def.key]
    const key = escapeHtml(def.key)
    switch (def.type ?? 'string') {
      case 'boolean':
        return `<aurora-checkbox data-k="${key}"></aurora-checkbox>`
      case 'number':
        return `<input type="number" data-k="${key}" value="${escapeHtml(String(raw ?? ''))}" aria-label="${key}" />`
      case 'select':
        return `<select data-k="${key}" aria-label="${key}">${(def.options ?? [])
          .map(
            (o) =>
              `<option ${o === raw ? 'selected' : ''} value="${escapeHtml(o)}">${escapeHtml(o)}</option>`,
          )
          .join('')}</select>`
      case 'color':
        return `<input type="color" data-k="${key}" value="${escapeHtml(String(raw ?? '#6d5cff'))}" aria-label="${key}" /><span class="hex">${escapeHtml(String(raw ?? ''))}</span>`
      default:
        return `<input type="text" data-k="${key}" value="${escapeHtml(String(raw ?? ''))}" aria-label="${key}" />`
    }
  }

  private render(): void {
    const defs = this.defs()
    const groups = new Map<string, PropertyDef[]>()
    for (const d of defs) {
      const g = d.group ?? ''
      if (!groups.has(g)) groups.set(g, [])
      groups.get(g)?.push(d)
    }
    let html = `<style>${STYLE}</style>`
    for (const [group, list] of groups) {
      if (group) html += `<div class="group">${escapeHtml(group)}</div>`
      html += list
        .map(
          (d) =>
            `<div class="row"><span class="key">${escapeHtml(d.label ?? d.key)}</span><span class="val">${this.editor(d)}</span></div>`,
        )
        .join('')
    }
    this.root.innerHTML = html
    this.root.querySelectorAll<AuroraCheckbox>('aurora-checkbox[data-k]').forEach((cb) => {
      cb.checked = Boolean(this.#value[cb.dataset['k'] ?? ''])
      cb.addEventListener('aurora-change', (e) => {
        e.stopPropagation()
        this.commit(cb.dataset['k'] ?? '', (e as CustomEvent<{ checked: boolean }>).detail.checked)
      })
    })
    this.root.querySelectorAll<HTMLInputElement>('input[data-k], select[data-k]').forEach((input) =>
      input.addEventListener('change', () => {
        const key = input.dataset['k'] ?? ''
        const def = defs.find((d) => d.key === key)
        const value: unknown =
          def?.type === 'number'
            ? Number((input as HTMLInputElement).value)
            : (input as HTMLInputElement).value
        if (def?.type === 'color') {
          const hex = input.parentElement?.querySelector('.hex')
          if (hex) hex.textContent = String(value)
        }
        this.commit(key, value)
      }),
    )
  }

  private commit(key: string, value: unknown): void {
    this.#value[key] = value
    this.dispatchEvent(
      new CustomEvent('aurora-change', { detail: { key, value, object: this.#value } }),
    )
  }
}

register('aurora-propertygrid', AuroraPropertygrid)
