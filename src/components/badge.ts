import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const TONES: Record<string, string> = {
  accent: 'var(--aurora-accent, #6d5cff)',
  success: '#34d399',
  danger: '#f43f5e',
  warn: '#fbbf24',
  neutral: '#6b7280',
}

const STYLE = `
  :host { display: inline-block; position: relative; }
  .tag {
    display: inline-grid; place-items: center; min-width: 19px; height: 19px;
    padding: 0 5px; border-radius: 10px; box-sizing: border-box;
    background: var(--tone); color: #fff; font-size: 11px; font-weight: 700;
    font-variant-numeric: tabular-nums; line-height: 1;
  }
  .tag.overlay {
    position: absolute; top: 0; right: 0; transform: translate(45%, -45%);
    border: 2px solid var(--aurora-bg, #0b0b12);
  }
  .tag.dot { min-width: 11px; width: 11px; height: 11px; padding: 0; border-radius: 50%; }
  .tag[hidden] { display: none; }
`

/**
 * `<aurora-badge value="7">…</aurora-badge>` — a notification badge. Wrapped
 * content gets an overlaid count pill (or a plain `dot`); standalone use
 * renders an inline pill. Values above `max` show as "99+", zero hides unless
 * `show-zero`, and count changes pop.
 */
export class AuroraBadge extends AuroraElement {
  static readonly observedAttributes = ['value']
  private ready = false

  connectedCallback(): void {
    this.renderBadge()
    this.ready = true
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.ready || oldValue === newValue) return
    this.renderBadge()
    const tag = this.root.querySelector('.tag')
    if (tag && !prefersReducedMotion())
      gsap.fromTo(tag, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' })
  }

  private renderBadge(): void {
    const raw = this.getAttribute('value') ?? ''
    const max = this.numberAttr('max', 99)
    const dot = this.hasAttribute('dot')
    const tone = TONES[this.getAttribute('tone') ?? 'accent'] ?? TONES['accent']
    const num = Number(raw)
    const isNum = raw !== '' && !Number.isNaN(num)
    const text = dot ? '' : isNum && num > max ? `${max}+` : raw
    const hasContent = this.childElementCount > 0 || (this.textContent ?? '').trim() !== ''
    const hidden = !dot && isNum && num === 0 && !this.hasAttribute('show-zero')
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot><span class="tag${
      hasContent ? ' overlay' : ''
    }${dot ? ' dot' : ''}" part="badge" style="--tone:${tone}" ${hidden ? 'hidden' : ''}>${text}</span>`
  }
}

register('aurora-badge', AuroraBadge)
