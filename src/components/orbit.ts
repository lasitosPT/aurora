import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: grid;
    place-items: center;
    position: relative;
  }
  ::slotted(:not([slot])) {
    position: absolute;
    top: 50%;
    left: 50%;
    will-change: transform;
  }
`

/**
 * `<aurora-orbit>` — its children revolve around the (optional) `slot="center"`
 * content. Size the host; tune with `radius` (px, default 80), `speed`
 * (seconds per revolution, default 14) and `reverse`. Under
 * `prefers-reduced-motion` the items hold their positions.
 */
export class AuroraOrbit extends AuroraElement {
  private tick: ((time: number) => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot name="center"></slot><slot></slot>`
    const items = (Array.from(this.children) as HTMLElement[]).filter(
      (el) => el.getAttribute('slot') !== 'center',
    )
    if (items.length === 0) return

    const radius = this.numberAttr('radius', 80)
    const speed = Math.max(this.numberAttr('speed', 14), 0.1)
    const direction = this.hasAttribute('reverse') ? -1 : 1
    const step = (Math.PI * 2) / items.length

    const place = (t: number): void => {
      items.forEach((item, i) => {
        const angle = t + i * step
        gsap.set(item, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          xPercent: -50,
          yPercent: -50,
        })
      })
    }

    if (prefersReducedMotion()) {
      place(-Math.PI / 2)
      return
    }
    this.tick = (time: number): void => {
      place((time / speed) * Math.PI * 2 * direction - Math.PI / 2)
    }
    gsap.ticker.add(this.tick)
  }

  disconnectedCallback(): void {
    if (this.tick) gsap.ticker.remove(this.tick)
  }
}

register('aurora-orbit', AuroraOrbit)
