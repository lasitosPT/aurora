import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `:host { display: inline-block; } span { white-space: pre-wrap; }`
const GLYPHS = '!<>-_\\/[]{}—=+*^?#'

/**
 * `<aurora-scramble>` — decodes its text through a run of random glyphs, left to
 * right, the first time it scrolls into view. With the `hover` attribute the
 * effect replays on pointer enter. Attributes: `duration` (default 1.2s),
 * `chars` (custom glyph set), `hover`. Emits `aurora-complete`.
 */
export class AuroraScramble extends AuroraElement {
  private original = ''
  private span: HTMLElement | null = null
  private state = { p: 0 }
  private cleanup: (() => void) | null = null
  private onHover: (() => void) | null = null

  connectedCallback(): void {
    this.original = (this.textContent ?? '').trim()
    this.root.innerHTML = `<style>${STYLE}</style><span part="text"></span>`
    this.span = this.root.querySelector('span')
    if (this.span) this.span.textContent = this.original

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
    gsap.killTweensOf(this.state)
  }

  /** Run the decode effect now (restarts if already running). */
  play(): void {
    if (!this.span || this.original.length === 0) return
    const glyphs = this.getAttribute('chars') ?? GLYPHS
    gsap.killTweensOf(this.state)
    this.state.p = 0
    gsap.to(this.state, {
      p: this.original.length,
      duration: this.numberAttr('duration', 1.2),
      ease: 'power2.inOut',
      onUpdate: () => this.render(glyphs),
      onComplete: () => {
        if (this.span) this.span.textContent = this.original
        this.dispatchEvent(new CustomEvent('aurora-complete'))
      },
    })
  }

  private render(glyphs: string): void {
    if (!this.span) return
    const settled = Math.floor(this.state.p)
    let out = this.original.slice(0, settled)
    for (let i = settled; i < this.original.length; i++) {
      const char = this.original[i] ?? ''
      out += /\s/.test(char) ? char : (glyphs[Math.floor(Math.random() * glyphs.length)] ?? char)
    }
    this.span.textContent = out
  }
}

register('aurora-scramble', AuroraScramble)
