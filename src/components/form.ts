import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

export interface FormRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'custom'
  value?: number | string
  message?: string
  fn?: (value: unknown, data: Record<string, unknown>) => boolean
}

type FieldEl = HTMLElement & {
  value?: unknown
  checked?: boolean
  values?: string[]
  start?: number
  end?: number
}

const STYLE = `
  :host { display: block; }
  ::slotted(*) { min-width: 0; }
`

const ERROR_CLASS = 'aurora-form-error'

/**
 * `<aurora-form>` — a validation harness for aurora's form-associated
 * editors. Give named fields and a `rules` map (required, min/max,
 * pattern, email, custom); `submit()` (or a click on `[data-submit]`, or
 * Enter) validates everything, injects shaking inline error messages under
 * offending fields, and emits `aurora-submit` with the collected data when
 * clean — or `aurora-invalid` with the error map when not. `validate(name?)`
 * runs checks without submitting; fields re-validate as they change once
 * they've erred.
 */
export class AuroraForm extends AuroraElement {
  #rules: Record<string, FormRule[]> = {}
  private touched = new Set<string>()

  get rules(): Record<string, FormRule[]> {
    return this.#rules
  }

  set rules(map: Record<string, FormRule[]>) {
    this.#rules = map
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot>`
    this.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest?.('[data-submit]')) this.submit()
    })
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        const inField = (e.target as HTMLElement).closest?.('[name]')
        if (inField) {
          e.preventDefault()
          this.submit()
        }
      }
    })
    this.addEventListener('aurora-change', (e) => this.revalidate(e.target as HTMLElement))
    this.addEventListener('input', (e) => this.revalidate(e.target as HTMLElement))
  }

  fields(): FieldEl[] {
    return Array.from(this.querySelectorAll<FieldEl>('[name]'))
  }

  /** Collected `{ name: value }` snapshot across every named field. */
  get data(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const el of this.fields()) {
      const name = el.getAttribute('name') ?? ''
      if (!name) continue
      if (Array.isArray(el.values)) out[name] = el.values
      else if (typeof el.checked === 'boolean') out[name] = el.checked
      else if (typeof el.start === 'number' && typeof el.end === 'number')
        out[name] = { start: el.start, end: el.end }
      else out[name] = el.value ?? null
    }
    return out
  }

  /** Validate one field (by name) or everything. Returns the error map. */
  validate(name?: string): Record<string, string> {
    const data = this.data
    const errors: Record<string, string> = {}
    for (const el of this.fields()) {
      const field = el.getAttribute('name') ?? ''
      if (name && field !== name) continue
      const message = this.check(field, data[field], el, data)
      this.mark(el, message)
      if (message) errors[field] = message
    }
    return errors
  }

  submit(): void {
    this.fields().forEach((el) => this.touched.add(el.getAttribute('name') ?? ''))
    const errors = this.validate()
    if (Object.keys(errors).length) {
      this.dispatchEvent(new CustomEvent('aurora-invalid', { detail: { errors } }))
      const first = this.querySelector<HTMLElement>(
        `[name="${CSS.escape(Object.keys(errors)[0] ?? '')}"]`,
      )
      first?.focus?.()
      return
    }
    this.dispatchEvent(new CustomEvent('aurora-submit', { detail: { data: this.data } }))
  }

  private revalidate(target: HTMLElement | null): void {
    const el = target?.closest?.('[name]') as HTMLElement | null
    const name = el?.getAttribute('name')
    if (name && this.touched.has(name)) this.validate(name)
  }

  private empty(value: unknown): boolean {
    if (value === null || value === undefined || value === false) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    return false
  }

  private check(
    name: string,
    value: unknown,
    el: HTMLElement,
    data: Record<string, unknown>,
  ): string | null {
    const rules: FormRule[] = [...(this.#rules[name] ?? [])]
    if (el.hasAttribute('required') && !rules.some((r) => r.type === 'required'))
      rules.unshift({ type: 'required' })
    for (const rule of rules) {
      const msg = rule.message
      switch (rule.type) {
        case 'required':
          if (this.empty(value)) return msg ?? 'This field is required'
          break
        case 'min': {
          const n = typeof value === 'string' ? value.trim().length : Number(value)
          if (!this.empty(value) && n < Number(rule.value ?? 0))
            return msg ?? `Must be at least ${rule.value}`
          break
        }
        case 'max': {
          const n = typeof value === 'string' ? value.trim().length : Number(value)
          if (!this.empty(value) && n > Number(rule.value ?? 0))
            return msg ?? `Must be at most ${rule.value}`
          break
        }
        case 'pattern':
          if (!this.empty(value) && !new RegExp(String(rule.value ?? '')).test(String(value)))
            return msg ?? 'Invalid format'
          break
        case 'email':
          if (!this.empty(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value)))
            return msg ?? 'Enter a valid email'
          break
        case 'custom':
          if (rule.fn && !rule.fn(value, data)) return msg ?? 'Invalid value'
          break
      }
    }
    return null
  }

  private mark(el: HTMLElement, message: string | null): void {
    el.toggleAttribute('aria-invalid', message !== null)
    let note = el.nextElementSibling as HTMLElement | null
    if (!note?.classList.contains(ERROR_CLASS)) note = null
    if (!message) {
      note?.remove()
      return
    }
    if (!note) {
      note = document.createElement('div')
      note.className = ERROR_CLASS
      note.setAttribute('role', 'alert')
      note.style.cssText =
        'color: var(--aurora-danger, #f43f5e); font-size: 0.8rem; margin: 6px 0 0 2px;'
      el.after(note)
    }
    if (note.textContent !== message) {
      note.textContent = message
      if (!prefersReducedMotion())
        gsap.fromTo(note, { x: -5 }, { x: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.4)' })
    }
  }
}

register('aurora-form', AuroraForm)
