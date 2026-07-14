import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; overflow: hidden; }
  .track { display: inline-flex; white-space: nowrap; will-change: transform; }
  .group { display: inline-flex; align-items: center; padding-right: var(--aurora-marquee-gap, 2rem); }
`

/**
 * `<aurora-marquee>` — scrolls its content horizontally in a seamless loop.
 * Attribute: `speed` in pixels/second (default 60).
 */
export class AuroraMarquee extends AuroraElement {
  private tween: gsap.core.Tween | null = null

  connectedCallback(): void {
    const content = this.innerHTML
    // decorative marquees (aria-hidden hosts) hide their whole track from AT
    if (this.hasAttribute('aria-hidden')) this.setAttribute('role', 'presentation')
    const hideAll = this.hasAttribute('aria-hidden')
    this.root.innerHTML =
      `<style>${STYLE}</style><div class="track">` +
      `<span class="group" part="content"${hideAll ? ' aria-hidden="true"' : ''}>${content}</span>` +
      `<span class="group" part="content" aria-hidden="true">${content}</span>` +
      `</div>`
    requestAnimationFrame(() => this.start())
  }

  disconnectedCallback(): void {
    this.tween?.kill()
  }

  private start(): void {
    const track = this.root.querySelector<HTMLElement>('.track')
    const group = this.root.querySelector<HTMLElement>('.group')
    if (!track || !group) return

    const distance = group.offsetWidth
    if (distance === 0 || prefersReducedMotion()) return

    const speed = this.numberAttr('speed', 60)
    this.tween = gsap.to(track, {
      x: -distance,
      duration: distance / speed,
      ease: 'none',
      repeat: -1,
    })
  }
}

register('aurora-marquee', AuroraMarquee)
