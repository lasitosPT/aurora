import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; position: relative; }
  .main, .arrow {
    all: unset; box-sizing: border-box; cursor: pointer; font: inherit; color: #fff;
    background: var(--aurora-accent, #6d5cff); transition: background 0.15s ease;
  }
  .main { padding: 0.6rem 1.15rem; border-radius: var(--aurora-radius, 0.6rem) 0 0 var(--aurora-radius, 0.6rem); }
  .arrow { padding: 0.6rem 0.7rem; border-radius: 0 var(--aurora-radius, 0.6rem) var(--aurora-radius, 0.6rem) 0;
    border-left: 1px solid rgba(0, 0, 0, 0.25); }
  .main:hover, .arrow:hover { background: var(--aurora-accent-hover, #5a49e0); }
  .main:focus-visible, .arrow:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: 2px; }
  .panel {
    position: absolute; top: calc(100% + 6px); right: 0; min-width: 100%; display: none;
    flex-direction: column; padding: 5px; z-index: var(--aurora-menu-z, 60);
    background: var(--aurora-surface, #16161f); color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255,255,255,0.14));
    border-radius: 11px; box-shadow: 0 16px 48px rgba(0,0,0,0.45);
  }
  .panel button { all: unset; cursor: pointer; padding: 0.5rem 0.85rem; border-radius: 7px; white-space: nowrap; }
  .panel button:hover, .panel button:focus-visible { background: rgba(109, 92, 255, 0.14); }
`

/**
 * `<aurora-splitbutton label="Deploy">` — a primary action with an attached
 * dropdown of alternatives (child `<option value>` elements). The main button
 * emits `aurora-click`; menu items emit `aurora-select` and close the panel.
 * Escape and outside clicks close.
 */
export class AuroraSplitbutton extends AuroraElement {
  private isOpen = false
  private onDocDown: ((e: Event) => void) | null = null

  connectedCallback(): void {
    const label = escapeHtml(this.getAttribute('label') ?? 'Action')
    const opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
    }))
    this.root.innerHTML = `<style>${STYLE}</style><button class="main" part="main">${label}</button><button class="arrow" part="arrow" aria-haspopup="menu" aria-expanded="false" aria-label="More actions">▾</button><div class="panel" part="panel" role="menu">${opts
      .map(
        (o) =>
          `<button role="menuitem" data-v="${escapeHtml(o.value)}">${escapeHtml(o.label)}</button>`,
      )
      .join('')}</div>`

    this.root.querySelector('.main')?.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent('aurora-click', { detail: { value: this.getAttribute('value') ?? label } }),
      )
    })
    this.root.querySelector('.arrow')?.addEventListener('click', () => this.toggle())
    this.root.querySelectorAll<HTMLButtonElement>('.panel button').forEach((b) =>
      b.addEventListener('click', () => {
        this.close()
        this.dispatchEvent(new CustomEvent('aurora-select', { detail: { value: b.dataset.v } }))
      }),
    )
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close()
    })
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.contains(e.target as Node) && e.target !== this) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.root.querySelector('.arrow')?.setAttribute('aria-expanded', 'true')
    const panel = this.root.querySelector<HTMLElement>('.panel')
    if (panel) {
      panel.style.display = 'flex'
      if (!prefersReducedMotion())
        gsap.fromTo(
          panel,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' },
        )
    }
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.root.querySelector('.arrow')?.setAttribute('aria-expanded', 'false')
    const panel = this.root.querySelector<HTMLElement>('.panel')
    if (panel) panel.style.display = 'none'
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }
}

register('aurora-splitbutton', AuroraSplitbutton)
