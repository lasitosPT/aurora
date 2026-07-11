import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  .ring {
    position: fixed;
    top: 0;
    left: 0;
    width: var(--aurora-cursor-size, 36px);
    height: var(--aurora-cursor-size, 36px);
    border: 1px solid var(--aurora-cursor-color, rgba(169, 155, 255, 0.55));
    border-radius: 50%;
    pointer-events: none;
    z-index: var(--aurora-cursor-z, 9999);
    opacity: 0;
    transition:
      width 0.25s ease,
      height 0.25s ease,
      border-color 0.25s ease;
  }
  .ring.is-active {
    width: calc(var(--aurora-cursor-size, 36px) * 1.6);
    height: calc(var(--aurora-cursor-size, 36px) * 1.6);
    border-color: var(--aurora-cursor-active, rgba(34, 211, 238, 0.75));
  }
`

const INTERACTIVE =
  'a, button, input, textarea, select, summary, label, [data-cursor], ' +
  'aurora-button, aurora-switch, aurora-slider'

/**
 * `<aurora-cursor>` — a trailing cursor glow ring that follows the pointer and
 * grows over interactive elements (or anything marked `data-cursor`). Renders
 * nothing on touch devices and under `prefers-reduced-motion`; the system
 * cursor is never hidden. Theme with `--aurora-cursor-size` / `-color` / `-active`.
 */
export class AuroraCursor extends AuroraElement {
  private ring: HTMLElement | null = null
  private onMove: ((event: PointerEvent) => void) | null = null
  private onOver: ((event: Event) => void) | null = null
  private onLeave: (() => void) | null = null

  connectedCallback(): void {
    const fine =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches
    if (!fine || prefersReducedMotion()) {
      this.root.innerHTML = ''
      return
    }

    this.root.innerHTML = `<style>${STYLE}</style><div class="ring" part="ring"></div>`
    this.ring = this.root.querySelector('.ring')
    if (!this.ring) return

    gsap.set(this.ring, { xPercent: -50, yPercent: -50 })
    const xTo = gsap.quickTo(this.ring, 'x', { duration: 0.35, ease: 'power3' })
    const yTo = gsap.quickTo(this.ring, 'y', { duration: 0.35, ease: 'power3' })

    let shown = false
    this.onMove = (event: PointerEvent): void => {
      if (!this.ring) return
      if (!shown) {
        shown = true
        gsap.set(this.ring, { x: event.clientX, y: event.clientY })
      }
      gsap.to(this.ring, { opacity: 1, duration: 0.3, overwrite: 'auto' })
      xTo(event.clientX)
      yTo(event.clientY)
    }
    this.onOver = (event: Event): void => {
      const target = event.target as Element | null
      this.ring?.classList.toggle('is-active', Boolean(target?.closest?.(INTERACTIVE)))
    }
    this.onLeave = (): void => {
      if (this.ring) gsap.to(this.ring, { opacity: 0, duration: 0.3 })
    }

    window.addEventListener('pointermove', this.onMove, { passive: true })
    document.addEventListener('mouseover', this.onOver)
    document.documentElement.addEventListener('mouseleave', this.onLeave)
  }

  disconnectedCallback(): void {
    if (this.onMove) window.removeEventListener('pointermove', this.onMove)
    if (this.onOver) document.removeEventListener('mouseover', this.onOver)
    if (this.onLeave) document.documentElement.removeEventListener('mouseleave', this.onLeave)
  }
}

register('aurora-cursor', AuroraCursor)
