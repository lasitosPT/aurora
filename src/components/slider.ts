import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { isRtl } from '../core/dir'
import { clamp } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; }
  .track {
    position: relative;
    height: 0.4rem;
    border-radius: 999px;
    cursor: pointer;
    background: var(--aurora-slider-track, rgba(128, 128, 128, 0.3));
    touch-action: none;
  }
  .track:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 4px; }
  .fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 999px;
    background: var(--aurora-accent, #6d5cff);
  }
  .thumb {
    position: absolute;
    top: 50%;
    left: 0;
    margin-left: -0.6rem;
    margin-top: -0.6rem;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    will-change: transform;
  }
  :host([disabled]) { opacity: 0.5; pointer-events: none; }
`

/**
 * `<aurora-slider min max step value name>` — a draggable, keyboard-accessible
 * range slider. Form-associated. Emits `input` while sliding and `change` on release.
 */
export class AuroraSlider extends AuroraElement {
  static readonly formAssociated = true
  private track: HTMLElement | null = null
  private fill: HTMLElement | null = null
  private thumb: HTMLElement | null = null
  private internals: ElementInternals | null = null
  private min = 0
  private max = 100
  private step = 1
  private current = 0

  constructor() {
    super()
    if ('attachInternals' in this) {
      try {
        this.internals = this.attachInternals()
      } catch {
        this.internals = null
      }
    }
  }

  connectedCallback(): void {
    this.min = this.numberAttr('min', 0)
    this.max = this.numberAttr('max', 100)
    this.step = Math.max(this.numberAttr('step', 1), 0.0001)
    this.current = clamp(this.numberAttr('value', this.min), this.min, this.max)

    this.root.innerHTML = `<style>${STYLE}</style><div class="track" part="track" role="slider" tabindex="0"><div class="fill" part="fill"></div><div class="thumb" part="thumb"></div></div>`
    this.track = this.root.querySelector('.track')
    this.fill = this.root.querySelector('.fill')
    this.thumb = this.root.querySelector('.thumb')
    if (this.hasAttribute('disabled')) this.track?.setAttribute('aria-disabled', 'true')
    this.track?.addEventListener('pointerdown', this.onPointerDown)
    this.track?.addEventListener('keydown', this.onKeyDown)
    this.render()
  }

  get value(): number {
    return this.current
  }

  set value(next: number) {
    this.setValue(next, false)
  }

  private setValue(next: number, emit: boolean): void {
    const snapped = Math.round(next / this.step) * this.step
    const clamped = clamp(snapped, this.min, this.max)
    this.current = clamped
    this.render()
    if (emit) this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  }

  private percent(): number {
    if (this.max === this.min) return 0
    return (this.current - this.min) / (this.max - this.min)
  }

  private render(): void {
    const pct = this.percent() * 100
    const rtl = isRtl(this)
    if (this.fill) {
      this.fill.style.width = `${pct}%`
      this.fill.style.left = rtl ? 'auto' : '0'
      this.fill.style.right = rtl ? '0' : 'auto'
    }
    if (this.thumb) this.thumb.style.left = `${rtl ? 100 - pct : pct}%`
    this.track?.setAttribute('aria-valuemin', String(this.min))
    this.track?.setAttribute('aria-valuemax', String(this.max))
    this.track?.setAttribute('aria-valuenow', String(this.current))
    this.internals?.setFormValue(String(this.current))
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.hasAttribute('disabled')) return
    this.track?.setPointerCapture(event.pointerId)
    this.setFromClientX(event.clientX)
    if (this.thumb) gsap.to(this.thumb, { scale: 1.2, duration: 0.15, ease: 'power2.out' })

    const move = (e: PointerEvent): void => this.setFromClientX(e.clientX)
    const up = (e: PointerEvent): void => {
      this.track?.removeEventListener('pointermove', move)
      this.track?.removeEventListener('pointerup', up)
      this.track?.releasePointerCapture(e.pointerId)
      if (this.thumb) gsap.to(this.thumb, { scale: 1, duration: 0.15, ease: 'power2.out' })
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
    }
    this.track?.addEventListener('pointermove', move)
    this.track?.addEventListener('pointerup', up)
  }

  private setFromClientX(clientX: number): void {
    if (!this.track) return
    const rect = this.track.getBoundingClientRect()
    if (rect.width === 0) return
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1)
    const frac = isRtl(this) ? 1 - pct : pct
    this.setValue(this.min + frac * (this.max - this.min), true)
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.hasAttribute('disabled')) return
    let next: number | null = null
    const towardStart = isRtl(this) ? this.step : -this.step
    if (event.key === 'ArrowLeft') next = this.current + towardStart
    else if (event.key === 'ArrowRight') next = this.current - towardStart
    else if (event.key === 'ArrowDown') next = this.current - this.step
    else if (event.key === 'ArrowUp') next = this.current + this.step
    else if (event.key === 'Home') next = this.min
    else if (event.key === 'End') next = this.max
    if (next === null) return
    event.preventDefault()
    this.setValue(next, true)
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  }
}

register('aurora-slider', AuroraSlider)
