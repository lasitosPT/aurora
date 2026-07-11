import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: inline-flex;
    align-items: flex-end;
    gap: var(--aurora-dock-gap, 10px);
  }
`

/**
 * `<aurora-dock>` — its children magnify as the cursor approaches, macOS-dock
 * style. Attributes: `max` (peak scale, default 1.6), `range` (px falloff,
 * default 110), `lift` (px rise at peak, default 16).
 */
export class AuroraDock extends AuroraElement {
  private onMove: ((event: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot>`
    if (prefersReducedMotion()) return

    const max = this.numberAttr('max', 1.6)
    const range = this.numberAttr('range', 110)
    const lift = this.numberAttr('lift', 16)

    this.onMove = (event: PointerEvent): void => {
      for (const item of Array.from(this.children) as HTMLElement[]) {
        const rect = item.getBoundingClientRect()
        const center = rect.left + rect.width / 2
        const t = clamp(1 - Math.abs(event.clientX - center) / range, 0, 1)
        const eased = t * t * (3 - 2 * t)
        const scale = 1 + (max - 1) * eased
        gsap.to(item, {
          scale,
          y: -(scale - 1) * lift,
          transformOrigin: 'bottom center',
          duration: 0.25,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
    }
    this.onLeave = (): void => {
      gsap.to(Array.from(this.children), {
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }
    this.addEventListener('pointermove', this.onMove, { passive: true })
    this.addEventListener('pointerleave', this.onLeave)
  }

  disconnectedCallback(): void {
    if (this.onMove) this.removeEventListener('pointermove', this.onMove)
    if (this.onLeave) this.removeEventListener('pointerleave', this.onLeave)
  }
}

register('aurora-dock', AuroraDock)
