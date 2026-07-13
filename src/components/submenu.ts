import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; position: relative; }
  .row {
    all: unset; box-sizing: border-box; cursor: pointer; display: flex; width: 100%;
    align-items: center; justify-content: space-between; gap: 12px;
    padding: 0.55rem 0.8rem; border-radius: 8px; font: inherit;
  }
  .row:hover, .row:focus-visible, :host([open]) .row { background: rgba(109, 92, 255, 0.14); }
  .row .arr { font-size: 0.7em; opacity: 0.6; }
  .panel {
    position: absolute; left: calc(100% + 4px); top: -6px; min-width: 180px;
    display: none; flex-direction: column; padding: 6px;
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 12px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
    z-index: calc(var(--aurora-menu-z, 60) + 1);
  }
  :host([open]) .panel { display: flex; }
  ::slotted(button) {
    all: unset; box-sizing: border-box; cursor: pointer; display: block; width: 100%;
    padding: 0.55rem 0.8rem; border-radius: 8px; font: inherit;
  }
  ::slotted(button:hover), ::slotted(button:focus-visible) { background: rgba(109, 92, 255, 0.14); }
`

/**
 * `<aurora-submenu label="More">` — a flyout inside `<aurora-menu>`: hover or
 * ArrowRight opens the panel of child `<button>`s to the side, ArrowLeft or
 * Escape steps back. Selections bubble to the parent menu.
 */
export class AuroraSubmenu extends AuroraElement {
  private closeTimer = 0

  connectedCallback(): void {
    const label = escapeHtml(this.getAttribute('label') ?? 'More')
    this.root.innerHTML = `<style>${STYLE}</style><button class="row" part="row" aria-haspopup="menu" aria-expanded="false">${label}<span class="arr" aria-hidden="true">▸</span></button><div class="panel" part="panel" role="menu"><slot></slot></div>`
    const row = this.root.querySelector<HTMLButtonElement>('.row')
    row?.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.hasAttribute('open')) this.close()
      else this.open()
    })
    this.addEventListener('pointerenter', () => {
      window.clearTimeout(this.closeTimer)
      this.open()
    })
    this.addEventListener('pointerleave', () => {
      this.closeTimer = window.setTimeout(() => this.close(), 180)
    })
    this.addEventListener('keydown', (e) => {
      const key = e.key
      const buttons = Array.from(this.querySelectorAll<HTMLButtonElement>(':scope > button'))
      if (key === 'ArrowRight' && document.activeElement === this) {
        e.preventDefault()
        e.stopPropagation()
        this.open()
        buttons[0]?.focus()
      } else if ((key === 'ArrowLeft' || key === 'Escape') && this.hasAttribute('open')) {
        e.preventDefault()
        e.stopPropagation()
        this.close()
        this.focus()
      } else if ((key === 'ArrowDown' || key === 'ArrowUp') && buttons.length) {
        const idx = buttons.indexOf(document.activeElement as HTMLButtonElement)
        if (idx >= 0) {
          e.preventDefault()
          e.stopPropagation()
          buttons[(idx + (key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus()
        }
      } else if (key === 'Enter' && document.activeElement === this) {
        e.preventDefault()
        e.stopPropagation()
        this.open()
        buttons[0]?.focus()
      }
    })
  }

  open(): void {
    if (this.hasAttribute('open')) return
    this.setAttribute('open', '')
    this.root.querySelector('.row')?.setAttribute('aria-expanded', 'true')
    const panel = this.root.querySelector('.panel')
    if (panel && !prefersReducedMotion())
      gsap.fromTo(
        panel,
        { opacity: 0, x: -6 },
        { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' },
      )
  }

  close(): void {
    this.removeAttribute('open')
    this.root.querySelector('.row')?.setAttribute('aria-expanded', 'false')
  }
}

register('aurora-submenu', AuroraSubmenu)
