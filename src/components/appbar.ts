import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: block; position: sticky; top: 0; z-index: var(--aurora-appbar-z, 50);
    background: color-mix(in srgb, var(--aurora-bg, #0b0b12) 82%, transparent);
    backdrop-filter: blur(14px) saturate(1.3);
    -webkit-backdrop-filter: blur(14px) saturate(1.3);
    border-bottom: 1px solid transparent;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.3s ease;
  }
  :host([elevated]) {
    border-bottom-color: var(--aurora-border, rgba(255, 255, 255, 0.1));
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  }
  :host([hidden-by-scroll]) { transform: translateY(-100%); }
  .row {
    display: flex; align-items: center; gap: 16px;
    padding: var(--aurora-appbar-pad, 0.7rem 1.2rem);
    max-width: var(--aurora-appbar-width, none); margin: 0 auto;
  }
  .start, .end { display: flex; align-items: center; gap: 12px; }
  .center { flex: 1; display: flex; align-items: center; gap: 12px; justify-content: var(--aurora-appbar-center, flex-start); }
`

/**
 * `<aurora-appbar>` — a sticky application header with `start`, default
 * (center), and `end` slots, frosted-glass background, an `elevated` shadow
 * that appears once the page scrolls, and optional `hide-on-scroll`
 * (slides away scrolling down, returns scrolling up).
 */
export class AuroraAppbar extends AuroraElement {
  private lastY = 0
  private onScroll: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="row" part="row"><div class="start" part="start"><slot name="start"></slot></div><div class="center" part="center"><slot></slot></div><div class="end" part="end"><slot name="end"></slot></div></div>`
    this.setAttribute('role', 'banner')
    this.onScroll = (): void => {
      const y = window.scrollY
      this.toggleAttribute('elevated', y > 4)
      if (this.hasAttribute('hide-on-scroll')) {
        if (y > this.lastY + 6 && y > 80) this.setAttribute('hidden-by-scroll', '')
        else if (y < this.lastY - 6 || y <= 80) this.removeAttribute('hidden-by-scroll')
      }
      this.lastY = y
    }
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.onScroll()
  }

  disconnectedCallback(): void {
    if (this.onScroll) window.removeEventListener('scroll', this.onScroll)
  }
}

register('aurora-appbar', AuroraAppbar)
