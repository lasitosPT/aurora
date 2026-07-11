import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; align-items: stretch; min-width: 150px;
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease; }
  :host(:hover), :host(:focus-within) { border-color: var(--aurora-accent, #6d5cff); }
  input { all: unset; box-sizing: border-box; flex: 1; min-width: 0; padding: 0.6rem 0.9rem;
    font: inherit; color: var(--aurora-fg, inherit); font-variant-numeric: tabular-nums; text-align: center; }
  button { all: unset; cursor: pointer; padding: 0 0.85rem; color: var(--aurora-muted, #9a98b3);
    user-select: none; transition: color 0.15s ease; }
  button:hover { color: var(--aurora-accent, #6d5cff); }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); border-radius: 6px; }
  :host([disabled]) { opacity: 0.5; pointer-events: none; }
`

/**
 * `<aurora-numeric value="5" min="0" max="10" step="1">` — a numeric spinner:
 * −/+ buttons with a pop, typed input clamped and snapped on commit, ArrowUp/
 * ArrowDown steps, `decimals` for fixed-point display. Form-associated.
 * Emits `aurora-change` with `{ value }`.
 */
export class AuroraNumeric extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private input: HTMLInputElement | null = null
  private current = 0

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get value(): number {
    return this.current
  }

  set value(v: number) {
    this.set(v, false)
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><button data-d="-1" aria-label="Decrease">−</button><input inputmode="decimal" aria-label="${this.getAttribute('label') ?? 'Number'}" /><button data-d="1" aria-label="Increase">+</button>`
    this.input = this.root.querySelector('input')
    this.set(this.numberAttr('value', this.numberAttr('min', 0)), false)

    this.root
      .querySelectorAll<HTMLButtonElement>('[data-d]')
      .forEach((b) => b.addEventListener('click', () => this.step(Number(b.dataset.d))))
    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') this.step(1)
      else if (e.key === 'ArrowDown') this.step(-1)
      else if (e.key === 'Enter') this.commit()
      else return
      e.preventDefault()
    })
    this.input?.addEventListener('blur', () => this.commit())
  }

  private step(dir: number): void {
    this.set(this.current + dir * Math.abs(this.numberAttr('step', 1)), true)
    if (!prefersReducedMotion() && this.input) {
      gsap.fromTo(
        this.input,
        { scale: 1 },
        { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' },
      )
    }
  }

  private commit(): void {
    const n = Number(this.input?.value)
    this.set(Number.isFinite(n) ? n : this.current, true)
  }

  private set(v: number, emit: boolean): void {
    const step = Math.abs(this.numberAttr('step', 1)) || 1
    const min = this.numberAttr('min', -Infinity)
    const max = this.numberAttr('max', Infinity)
    const snapped = Math.round(v / step) * step
    const next = clamp(snapped, min, max)
    const changed = next !== this.current
    this.current = next
    if (this.input) this.input.value = next.toFixed(this.numberAttr('decimals', 0))
    this.internals?.setFormValue(String(next))
    if (emit && changed) {
      this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: next } }))
    }
  }
}

register('aurora-numeric', AuroraNumeric)
