import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; position: relative; }
  .ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: var(--aurora-beam-thickness, 1.5px);
    background: conic-gradient(
      from var(--aurora-beam-angle, 0deg),
      transparent 0deg,
      transparent 290deg,
      var(--aurora-beam-color, #6d5cff) 330deg,
      var(--aurora-beam-color2, #22d3ee) 352deg,
      transparent 360deg
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
`

/**
 * `<aurora-beam>` — a luminous beam that travels the border of its content,
 * continuously. Style the host like a card (the ring inherits its
 * border-radius). Attributes: `speed` (seconds per lap, default 5). Theme with
 * `--aurora-beam-color/-color2/-thickness`. Holds a still frame under
 * `prefers-reduced-motion`.
 */
export class AuroraBeam extends AuroraElement {
  private tick: ((time: number) => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="ring" part="ring"></div><slot></slot>`
    if (prefersReducedMotion()) {
      this.style.setProperty('--aurora-beam-angle', '45deg')
      return
    }
    const speed = Math.max(this.numberAttr('speed', 5), 0.2)
    this.tick = (time: number): void => {
      this.style.setProperty('--aurora-beam-angle', `${((time / speed) * 360) % 360}deg`)
    }
    gsap.ticker.add(this.tick)
  }

  disconnectedCallback(): void {
    if (this.tick) gsap.ticker.remove(this.tick)
  }
}

register('aurora-beam', AuroraBeam)
