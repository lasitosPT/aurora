import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: inline-block; }
  .mask { display: inline-block; overflow: hidden; vertical-align: bottom; }
  .unit { display: inline-block; will-change: transform; }
  .space { white-space: pre; }
`

/**
 * `<aurora-text>` — reveals its text with a masked upward slide the first time
 * it scrolls into view. `by="words"` (default) rises word by word; `by="chars"`
 * rises character by character inside word masks, like a display headline.
 * Attributes: `by`, `stagger` (default 0.06s words / 0.02s chars), `delay`.
 */
export class AuroraText extends AuroraElement {
  private cleanup: (() => void) | null = null

  connectedCallback(): void {
    const text = (this.textContent ?? '').trim()
    const byChars = this.getAttribute('by') === 'chars'
    const html = text
      .split(/(\s+)/)
      .map((part) => {
        if (/^\s+$/.test(part)) return `<span class="space">${part}</span>`
        const inner = byChars
          ? [...part].map((char) => `<span class="unit">${escapeHtml(char)}</span>`).join('')
          : `<span class="unit">${escapeHtml(part)}</span>`
        return `<span class="mask">${inner}</span>`
      })
      .join('')

    this.root.innerHTML = `<style>${STYLE}</style>${html}`

    if (prefersReducedMotion()) return
    const units = this.root.querySelectorAll('.unit')
    if (units.length === 0) return
    gsap.set(units, { yPercent: 120 })
    this.cleanup = whenVisible(this, () => {
      gsap.to(units, {
        yPercent: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: this.numberAttr('stagger', byChars ? 0.02 : 0.06),
        delay: this.numberAttr('delay', 0),
        onComplete: () => this.dispatchEvent(new CustomEvent('aurora-complete')),
      })
    })
  }

  disconnectedCallback(): void {
    this.cleanup?.()
  }
}

register('aurora-text', AuroraText)
