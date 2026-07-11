import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: inline-block; position: relative; }
  .layer {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    will-change: transform, clip-path;
  }
  .layer.a { color: var(--aurora-glitch-a, #6d5cff); }
  .layer.b { color: var(--aurora-glitch-b, #22d3ee); }
`

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * `<aurora-glitch>` — a burst of RGB-split, slice-clipped glitch over its text,
 * once on scroll into view and again on every pointer enter with the `hover`
 * attribute. Call `play()` to trigger manually. Theme the split colors with
 * `--aurora-glitch-a` / `--aurora-glitch-b`.
 */
export class AuroraGlitch extends AuroraElement {
  private layers: HTMLElement[] = []
  private playing = false
  private cleanup: (() => void) | null = null
  private onHover: (() => void) | null = null

  connectedCallback(): void {
    const text = escapeHtml((this.textContent ?? '').trim())
    this.root.innerHTML = `<style>${STYLE}</style><span class="base">${text}</span><span class="layer a" aria-hidden="true">${text}</span><span class="layer b" aria-hidden="true">${text}</span>`
    this.layers = Array.from(this.root.querySelectorAll('.layer'))
    if (prefersReducedMotion()) return

    this.cleanup = whenVisible(this, () => this.play())
    if (this.hasAttribute('hover')) {
      this.onHover = (): void => this.play()
      this.addEventListener('pointerenter', this.onHover)
    }
  }

  disconnectedCallback(): void {
    this.cleanup?.()
    if (this.onHover) this.removeEventListener('pointerenter', this.onHover)
    this.layers.forEach((layer) => gsap.killTweensOf(layer))
  }

  /** Run one glitch burst. */
  play(): void {
    if (this.playing || this.layers.length < 2) return
    this.playing = true
    const [a, b] = this.layers as [HTMLElement, HTMLElement]
    const tl = gsap.timeline({
      onComplete: () => {
        this.playing = false
      },
    })
    const steps = 9
    for (let i = 0; i < steps; i++) {
      const at = i * 0.055
      tl.set(
        a,
        {
          opacity: 0.85,
          x: rand(-5, 5),
          y: rand(-2, 2),
          clipPath: `inset(${rand(0, 70)}% 0 ${rand(0, 40)}% 0)`,
        },
        at,
      )
      tl.set(
        b,
        {
          opacity: 0.85,
          x: rand(-5, 5),
          y: rand(-2, 2),
          clipPath: `inset(${rand(0, 40)}% 0 ${rand(0, 70)}% 0)`,
        },
        at,
      )
    }
    tl.set([a, b], { opacity: 0, x: 0, y: 0, clipPath: 'inset(0 0 0 0)' }, steps * 0.055)
  }
}

register('aurora-glitch', AuroraGlitch)
