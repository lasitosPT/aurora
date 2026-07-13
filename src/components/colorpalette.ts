import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const DEFAULT_COLORS =
  '#6d5cff,#22d3ee,#34d399,#f5b83d,#f472b6,#f43f5e,#a99bff,#0ea5e9,#10b981,#f59e0b,#ec4899,#ef4444,#ffffff,#9a98b3,#4b4b5e,#16161f'

const STYLE = `
  :host { display: inline-grid; grid-template-columns: repeat(var(--aurora-palette-cols, 8), 1fr); gap: 7px; }
  button {
    all: unset; cursor: pointer; width: 26px; height: 26px; border-radius: 8px;
    box-sizing: border-box; border: 1px solid rgba(255, 255, 255, 0.14); position: relative;
  }
  button:hover { transform: scale(1.12); }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  button[aria-selected='true']::after {
    content: '✓'; position: absolute; inset: 0; display: grid; place-items: center;
    color: #fff; font-size: 0.7rem; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }
`

/**
 * `<aurora-colorpalette>` — a fixed swatch grid: pass `colors` (comma hexes,
 * default 16 aurora tones), arrows rove in two dimensions, picks pop and
 * submit with the form. Emits `aurora-change` with `{ value }`.
 */
export class AuroraColorpalette extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private current = ''

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

  get value(): string {
    return this.current
  }

  set value(v: string) {
    this.current = v
    this.sync()
  }

  connectedCallback(): void {
    const colors = (this.getAttribute('colors') ?? DEFAULT_COLORS)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    this.current = this.getAttribute('value') ?? ''
    this.setAttribute('role', 'listbox')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Color palette')
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      colors
        .map(
          (c, i) =>
            `<button role="option" data-c="${escapeHtml(c)}" style="background:${escapeHtml(c)}" aria-label="${escapeHtml(c)}" aria-selected="false" tabindex="${i === 0 ? 0 : -1}"></button>`,
        )
        .join('')
    const btns = Array.from(this.root.querySelectorAll<HTMLButtonElement>('button'))
    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => this.pick(btn))
      btn.addEventListener('keydown', (e) => {
        const cols = this.numberAttr('columns', 8)
        let next: number
        if (e.key === 'ArrowRight') next = i + 1
        else if (e.key === 'ArrowLeft') next = i - 1
        else if (e.key === 'ArrowDown') next = i + cols
        else if (e.key === 'ArrowUp') next = i - cols
        else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.pick(btn)
          return
        } else return
        e.preventDefault()
        const target = btns[next]
        if (target) {
          btns.forEach((b) => (b.tabIndex = -1))
          target.tabIndex = 0
          target.focus()
        }
      })
    })
    if (this.hasAttribute('columns'))
      this.style.setProperty('--aurora-palette-cols', this.getAttribute('columns') ?? '8')
    this.sync()
  }

  private pick(btn: HTMLButtonElement): void {
    this.current = btn.dataset['c'] ?? ''
    this.sync()
    if (!prefersReducedMotion())
      gsap.fromTo(btn, { scale: 0.8 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' })
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.current } }))
  }

  private sync(): void {
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
      btn.setAttribute('aria-selected', String(btn.dataset['c'] === this.current))
    })
    this.internals?.setFormValue(this.current || null)
  }
}

register('aurora-colorpalette', AuroraColorpalette)
