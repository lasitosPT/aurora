import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; gap: 4px; }
  button { all: unset; cursor: pointer; font-size: var(--aurora-rating-size, 1.4rem); line-height: 1; color: var(--aurora-rating-off, rgba(255,255,255,0.22)); transition: color 0.15s ease; }
  button.on { color: var(--aurora-rating-on, #f5b83d); }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; border-radius: 4px; }
  :host([readonly]) button { cursor: default; }
`

/**
 * `<aurora-rating value="3" max="5">` — a star rating. Click or use arrow keys
 * to rate; picking pops the stars; `readonly` displays only. Form-associated.
 * Theme with `--aurora-rating-on/-off/-size` or a custom `char`. Emits
 * `aurora-change` with `{ value }`.
 */
export class AuroraRating extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
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
    this.current = v
    this.internals?.setFormValue(String(v))
    this.paint()
  }

  connectedCallback(): void {
    const max = this.numberAttr('max', 5)
    const char = this.getAttribute('char') ?? '★'
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      Array.from(
        { length: max },
        (_, i) =>
          `<button data-i="${i + 1}" role="radio" aria-label="${i + 1} of ${max}"></button>`,
      ).join('')
    this.setAttribute('role', 'radiogroup')
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.textContent = char
      if (!this.hasAttribute('readonly')) {
        b.addEventListener('click', () => this.pick(Number(b.dataset.i)))
        b.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
            this.pick(Math.min(this.current + 1, this.numberAttr('max', 5)))
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
            this.pick(Math.max(this.current - 1, 1))
          else return
          e.preventDefault()
        })
      }
    })
    this.value = this.numberAttr('value', 0)
  }

  private pick(v: number): void {
    this.value = v
    if (!prefersReducedMotion()) {
      const on = Array.from(this.root.querySelectorAll('button.on'))
      gsap.fromTo(
        on,
        { scale: 1 },
        {
          scale: 1.25,
          duration: 0.14,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
          stagger: 0.03,
          transformOrigin: 'center',
        },
      )
    }
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: v } }))
  }

  private paint(): void {
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      const on = Number(b.dataset.i) <= this.current
      b.classList.toggle('on', on)
      b.setAttribute('aria-checked', String(Number(b.dataset.i) === this.current))
    })
  }
}

register('aurora-rating', AuroraRating)
