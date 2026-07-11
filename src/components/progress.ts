import { AuroraElement } from '../core/base'
import { clamp } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--aurora-progress-height, 2px);
    z-index: var(--aurora-progress-z, 1200);
    pointer-events: none;
  }
  .bar {
    height: 100%;
    transform-origin: left;
    transform: scaleX(0);
    background: linear-gradient(
      90deg,
      var(--aurora-accent, #6d5cff),
      var(--aurora-accent2, #22d3ee)
    );
  }
`

/**
 * `<aurora-progress>` — a fixed hairline at the top of the viewport showing
 * how far the page has been scrolled. Drop it in once; theme the height and
 * colors with `--aurora-progress-height` / `--aurora-accent` / `--aurora-accent2`.
 */
export class AuroraProgress extends AuroraElement {
  private bar: HTMLElement | null = null
  private frame = 0
  private onScroll: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="bar" part="bar"></div>`
    this.bar = this.root.querySelector('.bar')
    this.setAttribute('aria-hidden', 'true')

    this.onScroll = (): void => {
      if (this.frame) return
      this.frame = requestAnimationFrame(() => {
        this.frame = 0
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
        if (this.bar) this.bar.style.transform = `scaleX(${p})`
      })
    }
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onScroll, { passive: true })
    this.onScroll()
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.frame)
    if (this.onScroll) {
      window.removeEventListener('scroll', this.onScroll)
      window.removeEventListener('resize', this.onScroll)
    }
  }
}

register('aurora-progress', AuroraProgress)
