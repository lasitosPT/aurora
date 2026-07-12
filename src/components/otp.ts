import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; gap: 8px; }
  input {
    all: unset; box-sizing: border-box; width: 2.4rem; height: 2.9rem; text-align: center;
    font: inherit; font-size: 1.15em; font-variant-numeric: tabular-nums;
    color: var(--aurora-fg, inherit);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.15s ease;
  }
  input:focus { border-color: var(--aurora-accent, #6d5cff); }
  :host([complete]) input { border-color: var(--aurora-success, #34d399); }
`

/**
 * `<aurora-otp length="6">` — a segmented one-time-code input: auto-advance,
 * Backspace steps back, arrow keys move, pasting distributes the code.
 * Reflects `complete` (success border) and emits `aurora-complete` with
 * `{ value }` when the last digit lands. Form-associated. `alphanumeric`
 * allows letters.
 */
export class AuroraOtp extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private cells: HTMLInputElement[] = []

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get value(): string {
    return this.cells.map((c) => c.value).join('')
  }

  set value(v: string) {
    this.cells.forEach((c, i) => {
      c.value = v[i] ?? ''
    })
    this.sync(false)
  }

  connectedCallback(): void {
    const length = Math.max(this.numberAttr('length', 6), 1)
    const mode = this.hasAttribute('alphanumeric') ? 'text' : 'numeric'
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      Array.from(
        { length },
        (_, i) =>
          `<input maxlength="1" inputmode="${mode}" aria-label="Digit ${i + 1} of ${length}" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" />`,
      ).join('')
    this.cells = Array.from(this.root.querySelectorAll('input'))
    const ok = this.hasAttribute('alphanumeric') ? /[a-zA-Z0-9]/ : /\d/

    this.cells.forEach((cell, i) => {
      cell.addEventListener('input', () => {
        if (cell.value && !ok.test(cell.value)) {
          cell.value = ''
          return
        }
        if (cell.value && i < this.cells.length - 1) this.cells[i + 1]?.focus()
        this.sync(true)
      })
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !cell.value && i > 0) {
          const prev = this.cells[i - 1]
          prev?.focus()
          if (prev) prev.value = ''
          this.sync(true)
          e.preventDefault()
        } else if (e.key === 'ArrowLeft' && i > 0) this.cells[i - 1]?.focus()
        else if (e.key === 'ArrowRight' && i < this.cells.length - 1) this.cells[i + 1]?.focus()
      })
      cell.addEventListener('paste', (e) => {
        e.preventDefault()
        const text = (e.clipboardData?.getData('text') ?? '').split('').filter((ch) => ok.test(ch))
        this.cells.forEach((c, j) => {
          c.value = j >= i ? (text[j - i] ?? c.value) : c.value
        })
        this.cells[Math.min(i + text.length, this.cells.length - 1)]?.focus()
        this.sync(true)
      })
    })
  }

  private sync(emit: boolean): void {
    const v = this.value
    this.internals?.setFormValue(v)
    const complete = v.length === this.cells.length
    const was = this.hasAttribute('complete')
    this.toggleAttribute('complete', complete)
    if (complete && !was) {
      if (!prefersReducedMotion()) {
        gsap.fromTo(
          this.cells,
          { scale: 1 },
          { scale: 1.1, duration: 0.13, yoyo: true, repeat: 1, ease: 'power2.out', stagger: 0.04 },
        )
      }
      if (emit) this.dispatchEvent(new CustomEvent('aurora-complete', { detail: { value: v } }))
    }
  }
}

register('aurora-otp', AuroraOtp)
