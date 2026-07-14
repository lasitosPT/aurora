import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: inline-block; width: 160px; color: var(--aurora-fg, #ececf2); }
  svg { display: block; width: 100%; height: auto; }
  .track { stroke: var(--aurora-gauge-track, rgba(255, 255, 255, 0.08)); }
  .val { stroke: var(--aurora-gauge-color, var(--aurora-accent, #6d5cff)); }
  .num { font-size: 26px; font-weight: 700; fill: currentColor; font-variant-numeric: tabular-nums; }
  .lbl { font-size: 11px; fill: var(--aurora-muted, #9a98b3); }
`

/**
 * `<aurora-gauge value="72" type="arc">` — an animated gauge: `arc`
 * (semi-circle, default), `circular` (full ring), `linear` (bar), or
 * `radial` (ticks and a needle). The value
 * sweeps in when scrolled into view and re-tweens when `value` changes.
 * `min`/`max`, `label`, `unit`; themed via `--aurora-gauge-color/-track`.
 */
export class AuroraGauge extends AuroraElement {
  static readonly observedAttributes = ['value']
  private shown = 0
  private started = false
  private cleanup: (() => void) | null = null

  get value(): number {
    return this.numberAttr('value', 0)
  }

  set value(v: number) {
    this.setAttribute('value', String(v))
  }

  connectedCallback(): void {
    this.render(0)
    this.cleanup = whenVisible(this, () => this.animateTo(this.value))
  }

  disconnectedCallback(): void {
    this.cleanup?.()
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'value' && oldValue !== newValue && this.started) this.animateTo(this.value)
  }

  private animateTo(target: number): void {
    this.started = true
    if (prefersReducedMotion()) {
      this.shown = target
      this.render(this.frac(target))
      return
    }
    const state = { v: this.shown }
    gsap.to(state, {
      v: target,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => {
        this.shown = state.v
        this.render(this.frac(state.v))
      },
    })
  }

  private frac(v: number): number {
    const min = this.numberAttr('min', 0)
    const max = this.numberAttr('max', 100)
    return clamp((v - min) / (max - min || 1), 0, 1)
  }

  private render(frac: number): void {
    const type = this.getAttribute('type') ?? 'arc'
    const label = escapeHtml(this.getAttribute('label') ?? '')
    const unit = escapeHtml(this.getAttribute('unit') ?? '')
    const num = `${Math.round(this.shown)}${unit}`
    let svg: string
    if (type === 'radial') {
      const sweep = 240
      const start = -120
      const angle = start + frac * sweep
      const cx = 80
      const cy = 84
      const r = 60
      const ticks: string[] = []
      for (let i = 0; i <= 8; i++) {
        const a = ((start + (i / 8) * sweep - 90) * Math.PI) / 180
        const x1 = cx + Math.cos(a) * (r - 2)
        const y1 = cy + Math.sin(a) * (r - 2)
        const x2 = cx + Math.cos(a) * (r - (i % 2 === 0 ? 10 : 6))
        const y2 = cy + Math.sin(a) * (r - (i % 2 === 0 ? 10 : 6))
        ticks.push(
          `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${i % 2 === 0 ? 'var(--aurora-muted, #9a98b3)' : 'var(--aurora-gauge-track, rgba(255,255,255,0.2))'}" stroke-width="1.6"/>`,
        )
      }
      svg = `<svg viewBox="0 0 160 140">
        ${ticks.join('')}
        <g transform="rotate(${angle.toFixed(1)} ${cx} ${cy})">
          <path d="M${cx} ${cy - r + 13} L${cx - 3.4} ${cy + 8} L${cx + 3.4} ${cy + 8} Z" style="fill: var(--aurora-gauge-color, var(--aurora-accent, #6d5cff))"/>
        </g>
        <circle cx="${cx}" cy="${cy}" r="5.5" style="fill: var(--aurora-gauge-color, var(--aurora-accent, #6d5cff))"/>
        <text class="num" x="${cx}" y="${cy + 34}" text-anchor="middle" style="font-size:20px">${num}</text>
        ${label ? `<text class="lbl" x="${cx}" y="${cy + 50}" text-anchor="middle">${label}</text>` : ''}
      </svg>`
    } else if (type === 'linear') {
      svg = `<svg viewBox="0 0 160 34">
        <rect class="track" x="4" y="10" width="152" height="10" rx="5" fill="none" stroke-width="0" style="fill: var(--aurora-gauge-track, rgba(255,255,255,0.08))"/>
        <rect x="4" y="10" width="${4 + frac * 148 > 8 ? frac * 152 : 8}" height="10" rx="5" style="fill: var(--aurora-gauge-color, var(--aurora-accent, #6d5cff))"/>
        <text class="num" x="4" y="32" style="font-size:11px; font-weight:600">${num}</text>
        ${label ? `<text class="lbl" x="156" y="32" text-anchor="end">${label}</text>` : ''}
      </svg>`
    } else {
      const full = type === 'circular'
      const r = 62
      const circumference = full ? 2 * Math.PI * r : Math.PI * r
      const dash = `${frac * circumference} ${circumference * 1.02}`
      const path = full ? `M80 18 a ${r} ${r} 0 1 1 -0.01 0` : `M18 92 A ${r} ${r} 0 0 1 142 92`
      const vb = full ? '0 0 160 160' : '0 0 160 104'
      const cy = full ? 88 : 84
      svg = `<svg viewBox="${vb}">
        <path class="track" d="${path}" fill="none" stroke-width="12" stroke-linecap="round"/>
        <path class="val" d="${path}" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${dash}"/>
        <text class="num" x="80" y="${cy}" text-anchor="middle">${num}</text>
        ${label ? `<text class="lbl" x="80" y="${cy + 16}" text-anchor="middle">${label}</text>` : ''}
      </svg>`
    }
    this.root.innerHTML = `<style>${STYLE}</style>${svg}`
    this.setAttribute('role', 'meter')
    this.setAttribute('aria-valuemin', String(this.numberAttr('min', 0)))
    this.setAttribute('aria-valuemax', String(this.numberAttr('max', 100)))
    this.setAttribute('aria-valuenow', String(Math.round(this.shown)))
    if (label && !this.hasAttribute('aria-label')) this.setAttribute('aria-label', label)
  }
}

register('aurora-gauge', AuroraGauge)
