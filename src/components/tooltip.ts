import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; }
  .anchor { position: absolute; z-index: var(--aurora-tooltip-z, 1000); pointer-events: none; }
  .anchor[data-pos='top'] { bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); }
  .anchor[data-pos='bottom'] { top: calc(100% + 8px); left: 50%; transform: translateX(-50%); }
  .anchor[data-pos='left'] { right: calc(100% + 8px); top: 50%; transform: translateY(-50%); }
  .anchor[data-pos='right'] { left: calc(100% + 8px); top: 50%; transform: translateY(-50%); }
  .tip {
    background: var(--aurora-tooltip-bg, #111);
    color: var(--aurora-tooltip-fg, #fff);
    padding: 0.4em 0.6em;
    border-radius: 0.4rem;
    font-size: 0.85em;
    line-height: 1.3;
    white-space: nowrap;
    opacity: 0;
    will-change: transform, opacity;
  }
`

/**
 * `<aurora-tooltip text="..." position="top|bottom|left|right">` — shows a tooltip
 * on hover or focus of its content.
 */
export class AuroraTooltip extends AuroraElement {
  private tip: HTMLElement | null = null

  connectedCallback(): void {
    const text = this.getAttribute('text') ?? ''
    const position = this.getAttribute('position') ?? 'top'
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot><span class="anchor" data-pos="${position}"><span class="tip" part="tip" role="tooltip">${escapeHtml(text)}</span></span>`
    this.tip = this.root.querySelector('.tip')

    this.addEventListener('pointerenter', this.onShow)
    this.addEventListener('pointerleave', this.onHide)
    this.addEventListener('focusin', this.onShow)
    this.addEventListener('focusout', this.onHide)
  }

  disconnectedCallback(): void {
    this.removeEventListener('pointerenter', this.onShow)
    this.removeEventListener('pointerleave', this.onHide)
    this.removeEventListener('focusin', this.onShow)
    this.removeEventListener('focusout', this.onHide)
  }

  private readonly onShow = (): void => {
    if (!this.tip) return
    if (prefersReducedMotion()) {
      this.tip.style.opacity = '1'
      return
    }
    gsap.killTweensOf(this.tip)
    gsap.fromTo(
      this.tip,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' },
    )
  }

  private readonly onHide = (): void => {
    if (!this.tip) return
    if (prefersReducedMotion()) {
      this.tip.style.opacity = '0'
      return
    }
    gsap.killTweensOf(this.tip)
    gsap.to(this.tip, { opacity: 0, scale: 0.9, duration: 0.15, ease: 'power2.in' })
  }
}

register('aurora-tooltip', AuroraTooltip)
