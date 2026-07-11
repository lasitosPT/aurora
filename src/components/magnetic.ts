import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; }
  .wrap { display: inline-block; will-change: transform; }
`

/**
 * `<aurora-magnetic>` — its content is magnetically pulled toward the cursor and
 * springs back on leave. Attribute: `strength` (default 0.4).
 */
export class AuroraMagnetic extends AuroraElement {
  private wrap: HTMLElement | null = null
  private strength = 0.4

  connectedCallback(): void {
    this.strength = this.numberAttr('strength', 0.4)
    this.root.innerHTML = `<style>${STYLE}</style><span class="wrap" part="content"><slot></slot></span>`
    this.wrap = this.root.querySelector('.wrap')

    if (!prefersReducedMotion()) {
      this.addEventListener('pointermove', this.onMove)
      this.addEventListener('pointerleave', this.onLeave)
    }
  }

  disconnectedCallback(): void {
    this.removeEventListener('pointermove', this.onMove)
    this.removeEventListener('pointerleave', this.onLeave)
    if (this.wrap) gsap.killTweensOf(this.wrap)
  }

  private readonly onMove = (event: PointerEvent): void => {
    if (!this.wrap) return
    const rect = this.getBoundingClientRect()
    const relX = event.clientX - (rect.left + rect.width / 2)
    const relY = event.clientY - (rect.top + rect.height / 2)
    const max = Math.max(rect.width, rect.height)
    gsap.to(this.wrap, {
      x: clamp(relX * this.strength, -max, max),
      y: clamp(relY * this.strength, -max, max),
      duration: 0.4,
      ease: 'power3.out',
    })
  }

  private readonly onLeave = (): void => {
    if (this.wrap) gsap.to(this.wrap, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
  }
}

register('aurora-magnetic', AuroraMagnetic)
