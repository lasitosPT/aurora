import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: contents; }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--aurora-modal-z, 1000);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--aurora-modal-backdrop, rgba(0, 0, 0, 0.5));
  }
  .panel {
    background: var(--aurora-surface, #fff);
    color: var(--aurora-fg, #111);
    border-radius: var(--aurora-radius-lg, 1rem);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
    max-width: min(90vw, 32rem);
    max-height: 85vh;
    overflow: auto;
    padding: var(--aurora-modal-padding, 1.5rem);
    will-change: transform, opacity;
  }
`

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"]), ' +
  'aurora-button:not([disabled]), aurora-input, aurora-switch:not([disabled]), aurora-slider'

/**
 * `<aurora-modal>` — an animated dialog. Toggle with the `open` attribute or the
 * `show()` / `hide()` methods. Closes on Escape and on backdrop click, and emits
 * `aurora-open` / `aurora-close` events. While open, Tab is trapped inside the
 * dialog; on close, focus returns to the element that opened it.
 */
export class AuroraModal extends AuroraElement {
  static readonly observedAttributes = ['open']
  private backdrop: HTMLElement | null = null
  private panel: HTMLElement | null = null
  private visible = false
  private previouslyFocused: Element | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="backdrop" part="backdrop"><div class="panel" part="panel" role="dialog" aria-modal="true" tabindex="-1"><slot></slot></div></div>`
    this.backdrop = this.root.querySelector('.backdrop')
    this.panel = this.root.querySelector('.panel')
    this.backdrop?.addEventListener('pointerdown', this.onBackdrop)
    document.addEventListener('keydown', this.onKey)
    if (this.hasAttribute('open')) this.open()
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.onKey)
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name !== 'open' || oldValue === newValue || !this.backdrop) return
    if (newValue !== null) this.open()
    else this.close()
  }

  show(): void {
    this.setAttribute('open', '')
  }

  hide(): void {
    this.removeAttribute('open')
  }

  private open(): void {
    if (this.visible || !this.backdrop || !this.panel) return
    this.visible = true
    this.backdrop.style.display = 'flex'
    this.previouslyFocused = document.activeElement
    const first = this.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? this.panel).focus()
    this.dispatchEvent(new CustomEvent('aurora-open'))
    if (prefersReducedMotion()) return
    gsap.fromTo(this.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    gsap.fromTo(
      this.panel,
      { opacity: 0, y: 24, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.4)' },
    )
  }

  private close(): void {
    if (!this.visible || !this.backdrop) return
    this.visible = false
    const previous = this.previouslyFocused
    this.previouslyFocused = null
    if (previous instanceof HTMLElement) previous.focus()
    const done = (): void => {
      if (this.backdrop) this.backdrop.style.display = 'none'
      this.dispatchEvent(new CustomEvent('aurora-close'))
    }
    if (prefersReducedMotion()) {
      done()
      return
    }
    if (this.panel) {
      gsap.to(this.panel, { opacity: 0, y: 16, scale: 0.97, duration: 0.2, ease: 'power2.in' })
    }
    gsap.to(this.backdrop, { opacity: 0, duration: 0.2, onComplete: done })
  }

  private readonly onBackdrop = (event: Event): void => {
    if (event.target === this.backdrop) this.hide()
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!this.hasAttribute('open')) return
    if (event.key === 'Escape') {
      this.hide()
      return
    }
    if (event.key !== 'Tab') return

    // Trap Tab inside the dialog. document.activeElement reports shadow hosts,
    // so aurora-* controls participate at host granularity.
    const focusables = Array.from(this.querySelectorAll<HTMLElement>(FOCUSABLE))
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!first || !last) {
      event.preventDefault()
      this.panel?.focus()
      return
    }
    const active = document.activeElement
    if (active !== this && !this.contains(active)) {
      event.preventDefault()
      first.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && (active === first || active === this)) {
      event.preventDefault()
      last.focus()
    }
  }
}

register('aurora-modal', AuroraModal)
