import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; }
  .mask { display: inline-block; overflow: hidden; vertical-align: bottom; }
  .word { display: inline-block; will-change: transform; }
  .space { white-space: pre; }
`

/**
 * `<aurora-text>` — reveals its text word by word with a masked upward slide.
 * Attributes: `stagger` (default 0.06s), `delay` (default 0s).
 */
export class AuroraText extends AuroraElement {
  connectedCallback(): void {
    const text = (this.textContent ?? '').trim()
    const html = text
      .split(/(\s+)/)
      .map((part) =>
        /^\s+$/.test(part)
          ? `<span class="space">${part}</span>`
          : `<span class="mask"><span class="word">${escapeHtml(part)}</span></span>`,
      )
      .join('')

    this.root.innerHTML = `<style>${STYLE}</style>${html}`

    if (prefersReducedMotion()) return
    gsap.from(this.root.querySelectorAll('.word'), {
      yPercent: 120,
      duration: 0.8,
      ease: 'power3.out',
      stagger: this.numberAttr('stagger', 0.06),
      delay: this.numberAttr('delay', 0),
    })
  }
}

register('aurora-text', AuroraText)
