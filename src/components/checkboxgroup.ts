import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'
import './checkbox'
import type { AuroraCheckbox } from './checkbox'

const STYLE = `
  :host { display: inline-flex; flex-direction: column; gap: 11px; }
  :host([inline]) { flex-direction: row; gap: 20px; flex-wrap: wrap; }
`

/**
 * `<aurora-checkboxgroup values="a,b">` — a group of composed
 * `<aurora-checkbox>`es built from `<option>` children. `values` (array in,
 * comma attr out) tracks the checked set; FormData gets one entry per
 * checked value. Emits `aurora-change` with `{ values }`.
 */
export class AuroraCheckboxgroup extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private set = new Set<string>()

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

  get values(): string[] {
    return [...this.set]
  }

  set values(v: string[]) {
    this.set = new Set(v)
    this.sync()
  }

  connectedCallback(): void {
    const opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
    }))
    this.set = new Set(
      (this.getAttribute('values') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    this.setAttribute('role', 'group')
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      opts
        .map(
          (o) =>
            `<aurora-checkbox data-v="${escapeHtml(o.value)}" label="${escapeHtml(o.label)}"></aurora-checkbox>`,
        )
        .join('')
    this.root.querySelectorAll<AuroraCheckbox>('aurora-checkbox').forEach((cb) => {
      cb.addEventListener('aurora-change', (e) => {
        e.stopPropagation()
        const v = cb.dataset['v'] ?? ''
        if ((e as CustomEvent<{ checked: boolean }>).detail.checked) this.set.add(v)
        else this.set.delete(v)
        this.commit()
      })
    })
    this.sync()
  }

  private sync(): void {
    this.root.querySelectorAll<AuroraCheckbox>('aurora-checkbox').forEach((cb) => {
      cb.checked = this.set.has(cb.dataset['v'] ?? '')
    })
    if (this.internals) {
      const name = this.getAttribute('name')
      if (name) {
        const fd = new FormData()
        for (const v of this.set) fd.append(name, v)
        this.internals.setFormValue(fd)
      }
    }
  }

  private commit(): void {
    this.sync()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { values: this.values } }))
  }
}

register('aurora-checkboxgroup', AuroraCheckboxgroup)
