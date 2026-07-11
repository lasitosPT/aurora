import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; perspective: var(--aurora-tilt-perspective, 800px); }
  .card { display: block; transform-style: preserve-3d; will-change: transform; }
`

/**
 * `<aurora-tilt>` — tilts its content in 3D toward the cursor.
 * Attribute: `max` — maximum tilt in degrees (default 12).
 */
export class AuroraTilt extends AuroraElement {
  private card: HTMLElement | null = null
  private max = 12

  connectedCallback(): void {
    this.max = this.numberAttr('max', 12)
    this.root.innerHTML = `<style>${STYLE}</style><div class="card" part="card"><slot></slot></div>`
    this.card = this.root.querySelector('.card')

    if (!prefersReducedMotion()) {
      this.addEventListener('pointermove', this.onMove)
      this.addEventListener('pointerleave', this.onLeave)
    }
  }

  disconnectedCallback(): void {
    this.removeEventListener('pointermove', this.onMove)
    this.removeEventListener('pointerleave', this.onLeave)
    if (this.card) gsap.killTweensOf(this.card)
  }

  private readonly onMove = (event: PointerEvent): void => {
    if (!this.card) return
    const rect = this.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    gsap.to(this.card, {
      rotateY: px * this.max * 2,
      rotateX: -py * this.max * 2,
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  private readonly onLeave = (): void => {
    if (this.card) gsap.to(this.card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power2.out' })
  }
}

register('aurora-tilt', AuroraTilt)
