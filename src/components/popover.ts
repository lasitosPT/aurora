import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; }
  .panel {
    position: absolute; display: none; min-width: 200px; max-width: 300px; padding: 0.9rem 1rem;
    font-size: 0.9rem; background: var(--aurora-surface, #16161f); color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 12px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
    z-index: var(--aurora-menu-z, 60); will-change: transform, opacity;
  }
  :host([placement='bottom']) .panel, :host(:not([placement])) .panel { top: calc(100% + 9px); left: 50%; transform: translateX(-50%); }
  :host([placement='top']) .panel { bottom: calc(100% + 9px); left: 50%; transform: translateX(-50%); }
  :host([placement='right']) .panel { left: calc(100% + 9px); top: 50%; transform: translateY(-50%); }
  :host([placement='left']) .panel { right: calc(100% + 9px); top: 50%; transform: translateY(-50%); }
`

/**
 * `<aurora-popover placement="bottom">` — an anchored floating panel. The
 * trigger goes in `slot="trigger"`, the content in the default slot. Click
 * toggles (or `hover`); Escape and outside clicks close; placement
 * top/bottom/left/right. Emits `aurora-open`/`aurora-close`.
 */
export class AuroraPopover extends AuroraElement {
  private panel: HTMLElement | null = null
  private isOpen = false
  private onDocDown: ((e: Event) => void) | null = null
  private onDocKey: ((e: KeyboardEvent) => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot name="trigger"></slot><div class="panel" part="panel" role="dialog"><slot></slot></div>`
    this.panel = this.root.querySelector('.panel')
    const trigger = this.querySelector('[slot="trigger"]')
    if (this.hasAttribute('hover')) {
      this.addEventListener('pointerenter', () => this.open())
      this.addEventListener('pointerleave', () => this.close())
    } else {
      trigger?.addEventListener('click', () => this.toggle())
    }
    trigger?.setAttribute('aria-haspopup', 'dialog')
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.contains(e.target as Node) && e.target !== this) this.close()
    }
    this.onDocKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && this.isOpen) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
    document.addEventListener('keydown', this.onDocKey)
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
    if (this.onDocKey) document.removeEventListener('keydown', this.onDocKey)
  }

  open(): void {
    if (this.isOpen || !this.panel) return
    this.isOpen = true
    this.setAttribute('open', '')
    this.panel.style.display = 'block'
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        this.panel,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.out' },
      )
    }
    this.dispatchEvent(new CustomEvent('aurora-open'))
  }

  close(): void {
    if (!this.isOpen || !this.panel) return
    this.isOpen = false
    this.removeAttribute('open')
    const done = (): void => {
      if (this.panel) this.panel.style.display = 'none'
    }
    if (prefersReducedMotion()) done()
    else
      gsap.to(this.panel, {
        opacity: 0,
        scale: 0.97,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: done,
      })
    this.dispatchEvent(new CustomEvent('aurora-close'))
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }
}

register('aurora-popover', AuroraPopover)
