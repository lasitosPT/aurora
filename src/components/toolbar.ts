import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: flex; align-items: center; gap: 8px; padding: 8px;
    background: var(--aurora-surface, #14141f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 13px; position: relative;
  }
  ::slotted(hr) {
    all: unset; align-self: stretch; width: 1px; margin: 4px 3px;
    background: var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  ::slotted(*) { flex: none; }
  .spacer { flex: 1; }
  .more {
    all: unset; cursor: pointer; flex: none; width: 32px; height: 32px;
    display: none; place-items: center; border-radius: 9px;
    color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  :host([overflowing]) .more { display: inline-grid; }
  .more:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  .more:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .panel {
    position: absolute; top: calc(100% + 8px); right: 0; z-index: var(--aurora-menu-z, 60);
    display: none; flex-direction: column; gap: 6px; padding: 10px; min-width: 160px;
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 12px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  }
  .panel.open { display: flex; }
`

/**
 * `<aurora-toolbar>` — a toolbar for buttons, button groups, and anything
 * else. `<hr>` children become separators, `data-spacer` pushes what follows
 * to the right, and items that don't fit are reassigned (no DOM moves) into
 * a "⋯" overflow panel as the toolbar narrows. Arrow keys rove between
 * focusable items per the WAI-ARIA toolbar pattern.
 */
export class AuroraToolbar extends AuroraElement {
  private observer: ResizeObserver | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot><span class="spacer" aria-hidden="true"></span><button class="more" part="more" aria-label="More tools" aria-expanded="false">⋯</button><div class="panel" part="panel"><slot name="overflow"></slot></div>`
    this.setAttribute('role', 'toolbar')
    const more = this.root.querySelector<HTMLButtonElement>('.more')
    const panel = this.root.querySelector<HTMLElement>('.panel')
    more?.addEventListener('click', () => {
      const open = panel?.classList.toggle('open') ?? false
      more.setAttribute('aria-expanded', String(open))
      if (open && panel && !prefersReducedMotion())
        gsap.fromTo(
          panel,
          { opacity: 0, y: -6 },
          { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' },
        )
    })
    this.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const focusables = Array.from(this.children).filter(
        (c): c is HTMLElement => c instanceof HTMLElement && c.tagName !== 'HR' && !c.slot,
      )
      const idx = focusables.indexOf(e.target as HTMLElement)
      if (idx < 0) return
      e.preventDefault()
      const next =
        focusables[(idx + (e.key === 'ArrowRight' ? 1 : focusables.length - 1)) % focusables.length]
      next?.focus()
    })
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.recalc())
      this.observer.observe(this)
    }
    this.recalc()
  }

  disconnectedCallback(): void {
    this.observer?.disconnect()
  }

  /** Re-run the overflow computation (called automatically on resize). */
  recalc(): void {
    const width = this.clientWidth
    if (!width) return
    const items = Array.from(this.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement,
    )
    items.forEach((el) => el.removeAttribute('slot'))
    const moreWidth = 48
    let used = 16
    let overflowing = false
    for (const el of items) {
      used += el.offsetWidth + 8
      if (used > width - moreWidth) {
        el.setAttribute('slot', 'overflow')
        overflowing = true
      }
    }
    this.toggleAttribute('overflowing', overflowing)
    if (!overflowing) {
      const panel = this.root.querySelector('.panel')
      panel?.classList.remove('open')
      this.root.querySelector('.more')?.setAttribute('aria-expanded', 'false')
    }
  }
}

register('aurora-toolbar', AuroraToolbar)
