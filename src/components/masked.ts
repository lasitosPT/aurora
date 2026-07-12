import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; min-width: 190px; }
  input {
    all: unset; box-sizing: border-box; width: 100%; padding: 0.6rem 0.9rem; font: inherit;
    font-variant-numeric: tabular-nums; color: var(--aurora-fg, inherit);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease;
  }
  input:hover, input:focus { border-color: var(--aurora-accent, #6d5cff); }
  input::placeholder { color: var(--aurora-muted, #9a98b3); }
  :host([complete]) input { border-color: var(--aurora-success, #34d399); }
`

const RULES: Record<string, RegExp> = { '#': /\d/, A: /[a-zA-Z]/, '*': /[a-zA-Z0-9]/ }

/**
 * `<aurora-masked mask="(###) ###-####">` — a pattern-masked text input.
 * `#` digit, `A` letter, `*` alphanumeric; anything else is a literal typed for
 * you. The `complete` attribute reflects a fully filled mask (border turns
 * success). `value` is the display text, `raw` the user characters only.
 * Form-associated (submits raw). Emits `aurora-change` with `{ value, raw, complete }`.
 */
export class AuroraMasked extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private input: HTMLInputElement | null = null

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get value(): string {
    return this.input?.value ?? ''
  }

  get raw(): string {
    const mask = this.getAttribute('mask') ?? ''
    return [...this.value]
      .filter((ch, i) => RULES[mask[i] ?? ''] !== undefined && ch !== ' ')
      .join('')
  }

  connectedCallback(): void {
    const mask = this.getAttribute('mask') ?? '####'
    const ph = this.getAttribute('placeholder') ?? mask.replace(/[#A*]/g, '_')
    this.root.innerHTML = `<style>${STYLE}</style><input inputmode="${/A|\*/.test(mask) ? 'text' : 'numeric'}" placeholder="${ph}" aria-label="${this.getAttribute('label') ?? mask}" />`
    this.input = this.root.querySelector('input')
    this.input?.addEventListener('input', () => this.apply())
    const initial = this.getAttribute('value')
    if (initial && this.input) {
      this.input.value = initial
      this.apply(false)
    }
  }

  private apply(emit = true): void {
    if (!this.input) return
    const mask = this.getAttribute('mask') ?? '####'
    const chars = [...this.input.value].filter((c) => /[a-zA-Z0-9]/.test(c))
    let out = ''
    let ci = 0
    for (const m of mask) {
      const rule = RULES[m]
      if (rule) {
        while (ci < chars.length && !rule.test(chars[ci] as string)) ci++
        if (ci >= chars.length) break
        out += chars[ci]
        ci++
      } else {
        out += m
      }
    }
    this.input.value = out
    const slots = [...mask].filter((m) => RULES[m]).length
    const filled = [...out].filter((_, i) => RULES[mask[i] ?? ''] !== undefined).length
    const complete = slots > 0 && filled === slots
    this.toggleAttribute('complete', complete)
    this.internals?.setFormValue(this.raw)
    if (emit) {
      this.dispatchEvent(
        new CustomEvent('aurora-change', { detail: { value: out, raw: this.raw, complete } }),
      )
    }
  }
}

register('aurora-masked', AuroraMasked)
