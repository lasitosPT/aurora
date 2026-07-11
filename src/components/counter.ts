import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `:host { display: inline-block; font-variant-numeric: tabular-nums; }`

/**
 * `<aurora-counter value="42">` — counts up from `from` (default 0) to `value`
 * the first time it scrolls into view; changing `value` later re-tweens to the
 * new number. Attributes: `value`, `from`, `duration`, `decimals`.
 * Emits `aurora-complete` when the count lands.
 */
export class AuroraCounter extends AuroraElement {
  static readonly observedAttributes = ['value']
  private span: HTMLElement | null = null
  private state = { v: 0 }
  private started = false
  private cleanup: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><span part="value"></span>`
    this.span = this.root.querySelector('span')
    this.state.v = this.numberAttr('from', 0)
    this.render()

    if (prefersReducedMotion()) {
      this.started = true
      this.state.v = this.numberAttr('value', 0)
      this.render()
      return
    }
    this.cleanup = whenVisible(this, () => this.start())
  }

  disconnectedCallback(): void {
    this.cleanup?.()
    gsap.killTweensOf(this.state)
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'value' && oldValue !== newValue && this.started) this.tween()
  }

  /** Start counting now, regardless of visibility. */
  start(): void {
    if (this.started) return
    this.started = true
    this.tween()
  }

  private tween(): void {
    gsap.killTweensOf(this.state)
    gsap.to(this.state, {
      v: this.numberAttr('value', 0),
      duration: this.numberAttr('duration', 1.6),
      ease: 'power2.out',
      onUpdate: () => this.render(),
      onComplete: () => this.dispatchEvent(new CustomEvent('aurora-complete')),
    })
  }

  private render(): void {
    if (this.span) this.span.textContent = this.state.v.toFixed(this.numberAttr('decimals', 0))
  }
}

register('aurora-counter', AuroraCounter)
