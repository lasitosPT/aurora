import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; width: 100%; max-width: 340px; color: var(--aurora-fg, #ececf2); }
  .head { display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 7px; color: var(--aurora-muted, #9a98b3); }
  .pct { font-variant-numeric: tabular-nums; color: var(--aurora-fg, #ececf2); }
  .track {
    height: var(--aurora-progressbar-height, 9px); border-radius: 99px; overflow: hidden;
    background: var(--aurora-progressbar-track, rgba(255, 255, 255, 0.08));
  }
  .fill {
    height: 100%; width: 0; border-radius: 99px;
    background: var(--aurora-progressbar-color, var(--aurora-accent, #6d5cff));
  }
  :host([indeterminate]) .fill { width: 34%; animation: slide 1.15s ease-in-out infinite; }
  @keyframes slide { 0% { transform: translateX(-120%); } 100% { transform: translateX(400%); } }
  @media (prefers-reduced-motion: reduce) { :host([indeterminate]) .fill { animation-duration: 2.6s; } }
`

/**
 * `<aurora-progressbar value="64">` — a determinate progress bar whose fill
 * tweens to each new `value` (against `max`, default 100) with a live
 * percentage readout, or a sweeping `indeterminate` mode. `label` captions
 * it; proper progressbar ARIA throughout.
 */
export class AuroraProgressbar extends AuroraElement {
  static readonly observedAttributes = ['value']
  private shown = 0
  private ready = false

  get value(): number {
    return this.numberAttr('value', 0)
  }

  set value(v: number) {
    this.setAttribute('value', String(v))
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    const indeterminate = this.hasAttribute('indeterminate')
    this.root.innerHTML = `<style>${STYLE}</style>${
      label || !indeterminate
        ? `<div class="head">${label ? `<span part="label">${escapeHtml(label)}</span>` : '<span></span>'}${
            indeterminate ? '' : '<span class="pct" part="value">0%</span>'
          }</div>`
        : ''
    }<div class="track" part="track"><div class="fill" part="fill"></div></div>`
    this.setAttribute('role', 'progressbar')
    this.setAttribute('aria-valuemin', '0')
    this.setAttribute('aria-valuemax', String(this.numberAttr('max', 100)))
    if (label && !this.hasAttribute('aria-label')) this.setAttribute('aria-label', label)
    this.ready = true
    if (!indeterminate) this.animateTo(this.value)
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (this.ready && oldValue !== newValue && !this.hasAttribute('indeterminate'))
      this.animateTo(this.value)
  }

  private animateTo(target: number): void {
    const max = this.numberAttr('max', 100)
    const fill = this.root.querySelector<HTMLElement>('.fill')
    const pct = this.root.querySelector('.pct')
    const apply = (v: number): void => {
      if (fill) fill.style.width = `${clamp(v / (max || 1), 0, 1) * 100}%`
      if (pct) pct.textContent = `${Math.round(clamp(v / (max || 1), 0, 1) * 100)}%`
      this.setAttribute('aria-valuenow', String(Math.round(v)))
    }
    if (prefersReducedMotion()) {
      this.shown = target
      apply(target)
      return
    }
    const state = { v: this.shown }
    gsap.to(state, {
      v: target,
      duration: 0.7,
      ease: 'power3.out',
      onUpdate: () => {
        this.shown = state.v
        apply(state.v)
      },
    })
  }
}

register('aurora-progressbar', AuroraProgressbar)
