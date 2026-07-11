import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; perspective: 1100px; }
  .inner {
    position: relative;
    transform-style: preserve-3d;
    will-change: transform;
  }
  .face {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .front { position: relative; }
  .back {
    position: absolute;
    inset: 0;
    transform: rotateY(180deg);
  }
`

/**
 * `<aurora-flip>` — a 3D flip card. Front content in `slot="front"`, back in
 * `slot="back"` (the front defines the size). `trigger="hover"` (default),
 * `"click"`, or `"manual"` with the `flip()` method. Emits `aurora-flip`.
 */
export class AuroraFlip extends AuroraElement {
  private inner: HTMLElement | null = null
  private flipped = false

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="inner" part="inner"><div class="face front" part="front"><slot name="front"></slot></div><div class="face back" part="back"><slot name="back"></slot></div></div>`
    this.inner = this.root.querySelector('.inner')

    const trigger = this.getAttribute('trigger') ?? 'hover'
    if (trigger === 'hover') {
      this.addEventListener('pointerenter', () => this.flip(true))
      this.addEventListener('pointerleave', () => this.flip(false))
    } else if (trigger === 'click') {
      this.addEventListener('click', () => this.flip())
    }
  }

  /** Flip to the back (`true`), the front (`false`), or toggle (no argument). */
  flip(force?: boolean): void {
    const target = force ?? !this.flipped
    if (target === this.flipped || !this.inner) return
    this.flipped = target
    gsap.to(this.inner, {
      rotationY: target ? 180 : 0,
      duration: prefersReducedMotion() ? 0 : 0.7,
      ease: 'power3.inOut',
      overwrite: 'auto',
    })
    this.dispatchEvent(new CustomEvent('aurora-flip', { detail: { flipped: target } }))
  }
}

register('aurora-flip', AuroraFlip)
