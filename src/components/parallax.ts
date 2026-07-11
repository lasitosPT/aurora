import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `:host { display: block; position: relative; }`

/**
 * `<aurora-parallax strength="24">` — children with `data-depth` drift toward
 * the pointer at their own depth (0–1), settling back on leave. Deeper values
 * move more; static children are untouched.
 */
export class AuroraParallax extends AuroraElement {
  private onMove: ((event: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot>`
    if (prefersReducedMotion()) return

    const strength = this.numberAttr('strength', 24)
    const layers = (): HTMLElement[] =>
      Array.from(this.querySelectorAll<HTMLElement>('[data-depth]'))

    this.onMove = (event: PointerEvent): void => {
      const rect = this.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const nx = (event.clientX - rect.left) / rect.width - 0.5
      const ny = (event.clientY - rect.top) / rect.height - 0.5
      for (const layer of layers()) {
        const depth = Number.parseFloat(layer.dataset.depth ?? '0.5') || 0.5
        gsap.to(layer, {
          x: nx * strength * depth,
          y: ny * strength * depth,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
    }
    this.onLeave = (): void => {
      gsap.to(layers(), { x: 0, y: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
    }
    this.addEventListener('pointermove', this.onMove, { passive: true })
    this.addEventListener('pointerleave', this.onLeave)
  }

  disconnectedCallback(): void {
    if (this.onMove) this.removeEventListener('pointermove', this.onMove)
    if (this.onLeave) this.removeEventListener('pointerleave', this.onLeave)
  }
}

register('aurora-parallax', AuroraParallax)
