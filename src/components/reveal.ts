import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: block; }
  .wrap { will-change: transform, opacity; }
`

/**
 * `<aurora-reveal>` — fades and rises its content the first time it scrolls into
 * view. With `stagger`, direct children animate one after another instead.
 * Attributes: `y` (px, default 36), `duration`, `delay`, `stagger`.
 * Emits `aurora-reveal` when the animation completes.
 */
export class AuroraReveal extends AuroraElement {
  private cleanup: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="wrap" part="wrap"><slot></slot></div>`
    if (prefersReducedMotion()) return

    const wrap = this.root.querySelector('.wrap')
    if (!wrap) return
    const y = this.numberAttr('y', 36)
    const duration = this.numberAttr('duration', 0.9)
    const delay = this.numberAttr('delay', 0)
    const stagger = this.numberAttr('stagger', 0)
    const targets: Element[] =
      stagger > 0 && this.children.length > 0 ? Array.from(this.children) : [wrap]

    gsap.set(targets, { opacity: 0, y })
    this.cleanup = whenVisible(this, () => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
        onComplete: () => this.dispatchEvent(new CustomEvent('aurora-reveal')),
      })
    })
  }

  disconnectedCallback(): void {
    this.cleanup?.()
  }
}

register('aurora-reveal', AuroraReveal)
