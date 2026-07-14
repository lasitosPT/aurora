import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import './calendar'
import type { AuroraCalendar } from './calendar'

const STYLE = `
  :host { display: inline-block; position: relative; min-width: 200px; }
  .trigger {
    all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center;
    justify-content: space-between; gap: 10px; width: 100%; padding: 0.6rem 0.9rem; font: inherit;
    color: var(--aurora-fg, inherit);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease;
  }
  .trigger:hover, .trigger:focus-visible { border-color: var(--aurora-accent, #6d5cff); outline: none; }
  .trigger .ph { color: var(--aurora-muted, #9a98b3); }
  .trigger svg { flex: none; stroke: var(--aurora-muted, #9a98b3); }
  .pop {
    position: absolute; top: calc(100% + 6px); inset-inline-start: 0; display: none;
    z-index: var(--aurora-menu-z, 60); will-change: transform, opacity;
  }
`

/**
 * `<aurora-datepicker>` — a date input that pops an `<aurora-calendar>`.
 * ISO `value`, `placeholder`, `format` (`iso` default or `locale`);
 * form-associated. Escape/outside-click closes; picking closes and refocuses.
 * Emits `aurora-change` with `{ value }`.
 */
export class AuroraDatepicker extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private cal: AuroraCalendar | null = null
  private isOpen = false
  private onDocDown: ((e: Event) => void) | null = null

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get value(): string | null {
    return this.cal?.value ?? this.getAttribute('value')
  }

  set value(v: string | null) {
    if (this.cal && v) this.cal.value = v
    if (v) this.internals?.setFormValue(v)
    this.renderLabel()
  }

  connectedCallback(): void {
    const ph = escapeHtml(this.getAttribute('placeholder') ?? 'Pick a date')
    this.root.innerHTML = `<style>${STYLE}</style><button class="trigger" part="trigger" aria-haspopup="dialog" aria-expanded="false"><span class="label ph">${ph}</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke-width="1.4" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="12" rx="2.5"/><path d="M1.5 6h13M5 1v3M11 1v3"/></svg></button><div class="pop" part="pop"></div>`
    const pop = this.root.querySelector('.pop')
    this.cal = document.createElement('aurora-calendar') as AuroraCalendar
    pop?.append(this.cal)
    const initial = this.getAttribute('value')
    if (initial) this.value = initial

    this.cal.addEventListener('aurora-change', (e) => {
      const { value } = (e as CustomEvent<{ value: string }>).detail
      this.internals?.setFormValue(value)
      this.renderLabel()
      this.close()
      this.root.querySelector<HTMLElement>('.trigger')?.focus()
      this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value } }))
    })
    this.root.querySelector('.trigger')?.addEventListener('click', () => this.toggle())
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
        this.root.querySelector<HTMLElement>('.trigger')?.focus()
      }
    })
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.contains(e.target as Node) && e.target !== this) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  private renderLabel(): void {
    const label = this.root.querySelector('.label')
    if (!label) return
    const v = this.cal?.value
    if (!v) return
    label.classList.remove('ph')
    label.textContent =
      this.getAttribute('format') === 'locale' ? new Date(`${v}T00:00`).toLocaleDateString() : v
  }

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.root.querySelector('.trigger')?.setAttribute('aria-expanded', 'true')
    const pop = this.root.querySelector<HTMLElement>('.pop')
    if (pop) {
      pop.style.display = 'block'
      if (!prefersReducedMotion())
        gsap.fromTo(
          pop,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' },
        )
    }
    this.cal?.shadowRoot?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.root.querySelector('.trigger')?.setAttribute('aria-expanded', 'false')
    const pop = this.root.querySelector<HTMLElement>('.pop')
    if (pop) pop.style.display = 'none'
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }
}

register('aurora-datepicker', AuroraDatepicker)
