import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { FOCUSABLE, trapTab } from '../core/focus'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: contents; }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--aurora-drawer-z, 1000);
    display: none;
    background: var(--aurora-modal-backdrop, rgba(0, 0, 0, 0.5));
  }
  .panel {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    width: min(88vw, var(--aurora-drawer-width, 360px));
    z-index: calc(var(--aurora-drawer-z, 1000) + 1);
    display: none;
    overflow: auto;
    padding: var(--aurora-drawer-padding, 1.5rem);
    background: var(--aurora-surface, #16161f);
    color: var(--aurora-fg, #ececf2);
    box-shadow: 0 0 90px rgba(0, 0, 0, 0.55);
    will-change: transform;
  }
  :host([side='left']) .panel { left: 0; right: auto; }
`

/**
 * `<aurora-drawer>` — a side panel that slides in from the right (or
 * `side="left"`). Toggle with the `open` attribute or `show()` / `hide()`.
 * Escape and backdrop clicks close it; Tab is trapped while open and focus
 * returns to the opener on close. Emits `aurora-open` / `aurora-close`.
 */
export class AuroraDrawer extends AuroraElement {
  static readonly observedAttributes = ['open']
  private backdrop: HTMLElement | null = null
  private panel: HTMLElement | null = null
  private visible = false
  private previouslyFocused: Element | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="backdrop" part="backdrop"></div><div class="panel" part="panel" role="dialog" aria-modal="true" tabindex="-1"><slot></slot></div>`
    this.backdrop = this.root.querySelector('.backdrop')
    this.panel = this.root.querySelector('.panel')
    this.backdrop?.addEventListener('pointerdown', () => this.hide())
    document.addEventListener('keydown', this.onKey)
    if (this.hasAttribute('open')) this.open()
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.onKey)
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name !== 'open' || oldValue === newValue || !this.panel) return
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
    this.backdrop.style.display = 'block'
    this.panel.style.display = 'block'
    this.previouslyFocused = document.activeElement
    const first = this.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? this.panel).focus()
    this.dispatchEvent(new CustomEvent('aurora-open'))
    if (prefersReducedMotion()) return
    const from = this.getAttribute('side') === 'left' ? -100 : 100
    gsap.fromTo(this.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    gsap.fromTo(this.panel, { xPercent: from }, { xPercent: 0, duration: 0.45, ease: 'power3.out' })
  }

  private close(): void {
    if (!this.visible || !this.backdrop || !this.panel) return
    this.visible = false
    const previous = this.previouslyFocused
    this.previouslyFocused = null
    if (previous instanceof HTMLElement) previous.focus()
    const done = (): void => {
      if (this.backdrop) this.backdrop.style.display = 'none'
      if (this.panel) this.panel.style.display = 'none'
      this.dispatchEvent(new CustomEvent('aurora-close'))
    }
    if (prefersReducedMotion()) {
      done()
      return
    }
    const to = this.getAttribute('side') === 'left' ? -100 : 100
    gsap.to(this.panel, { xPercent: to, duration: 0.32, ease: 'power2.in' })
    gsap.to(this.backdrop, { opacity: 0, duration: 0.32, onComplete: done })
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!this.hasAttribute('open')) return
    if (event.key === 'Escape') {
      this.hide()
      return
    }
    if (event.key !== 'Tab') return
    trapTab(this, event, this.panel)
  }
}

register('aurora-drawer', AuroraDrawer)
