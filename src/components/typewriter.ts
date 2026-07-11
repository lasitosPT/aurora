import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: inline-block; }
  .text { white-space: pre-wrap; }
  .caret {
    display: inline-block;
    width: 0.08em;
    min-width: 1.5px;
    height: 1em;
    margin-left: 0.06em;
    vertical-align: text-bottom;
    background: var(--aurora-accent, #6d5cff);
    animation: aurora-blink 1s steps(1) infinite;
  }
  @keyframes aurora-blink {
    50% { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .caret { animation: none; }
  }
  :host([no-caret]) .caret { display: none; }
`

/**
 * `<aurora-typewriter>` — types its text character by character behind a
 * blinking accent caret, the first time it scrolls into view. Attributes:
 * `speed` (chars per second, default 16), `delay`, `no-caret`.
 * Emits `aurora-complete`; call `start()` to trigger manually.
 */
export class AuroraTypewriter extends AuroraElement {
  private original = ''
  private span: HTMLElement | null = null
  private state = { p: 0 }
  private started = false
  private cleanup: (() => void) | null = null

  connectedCallback(): void {
    this.original = (this.textContent ?? '').trim()
    this.root.innerHTML = `<style>${STYLE}</style><span class="text" part="text"></span><span class="caret" part="caret"></span>`
    this.span = this.root.querySelector('.text')

    if (prefersReducedMotion()) {
      this.started = true
      if (this.span) this.span.textContent = this.original
      return
    }
    this.cleanup = whenVisible(this, () => this.start())
  }

  disconnectedCallback(): void {
    this.cleanup?.()
    gsap.killTweensOf(this.state)
  }

  /** Start typing now, regardless of visibility. */
  start(): void {
    if (this.started || !this.span || this.original.length === 0) return
    this.started = true
    gsap.to(this.state, {
      p: this.original.length,
      duration: this.original.length / Math.max(this.numberAttr('speed', 16), 1),
      delay: this.numberAttr('delay', 0),
      ease: 'none',
      onUpdate: () => {
        if (this.span) this.span.textContent = this.original.slice(0, Math.round(this.state.p))
      },
      onComplete: () => this.dispatchEvent(new CustomEvent('aurora-complete')),
    })
  }
}

register('aurora-typewriter', AuroraTypewriter)
