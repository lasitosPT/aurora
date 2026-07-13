import { AuroraElement } from '../core/base'
import { clamp } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; width: 100%; max-width: 320px; padding: 10px 0; color: var(--aurora-fg, #ececf2); }
  .track {
    position: relative; height: 7px; border-radius: 99px; cursor: pointer; touch-action: none;
    background: var(--aurora-slider-track, rgba(255, 255, 255, 0.1));
  }
  .fill {
    position: absolute; top: 0; bottom: 0; border-radius: 99px;
    background: var(--aurora-accent, #6d5cff);
  }
  .thumb {
    all: unset; position: absolute; top: 50%; width: 20px; height: 20px; border-radius: 50%;
    transform: translate(-50%, -50%); cursor: grab; box-sizing: border-box;
    background: #fff; border: 2px solid var(--aurora-accent, #6d5cff);
    transition: box-shadow 0.15s ease;
  }
  .thumb:hover { box-shadow: 0 0 0 7px rgba(109, 92, 255, 0.18); }
  .thumb:focus-visible { outline: none; box-shadow: 0 0 0 7px rgba(109, 92, 255, 0.3); }
  .vals {
    display: flex; justify-content: space-between; margin-top: 12px;
    font-size: 0.82rem; color: var(--aurora-muted, #9a98b3); font-variant-numeric: tabular-nums;
  }
`

/**
 * `<aurora-rangeslider start="20" end="70">` — a dual-thumb range slider:
 * drag either thumb (they can't cross), click the track to move the nearest
 * one, arrow keys step. `min`/`max`/`step`; form-associated as
 * `name-start`/`name-end` FormData entries. Emits `aurora-change` with
 * `{ start, end }`.
 */
export class AuroraRangeslider extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private a = 0
  private b = 100

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

  get start(): number {
    return this.a
  }

  get end(): number {
    return this.b
  }

  setRange(start: number, end: number): void {
    const min = this.numberAttr('min', 0)
    const max = this.numberAttr('max', 100)
    this.a = clamp(Math.min(start, end), min, max)
    this.b = clamp(Math.max(start, end), min, max)
    this.sync()
  }

  connectedCallback(): void {
    const min = this.numberAttr('min', 0)
    const max = this.numberAttr('max', 100)
    this.a = clamp(this.numberAttr('start', min), min, max)
    this.b = clamp(this.numberAttr('end', max), min, max)
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="track" part="track">
        <div class="fill" part="fill"></div>
        <button class="thumb" data-t="a" role="slider" aria-label="Range start" aria-valuemin="${min}" aria-valuemax="${max}"></button>
        <button class="thumb" data-t="b" role="slider" aria-label="Range end" aria-valuemin="${min}" aria-valuemax="${max}"></button>
      </div>
      <div class="vals" part="values"><span class="va"></span><span class="vb"></span></div>`
    this.wire()
    this.sync()
  }

  private frac(v: number): number {
    const min = this.numberAttr('min', 0)
    const max = this.numberAttr('max', 100)
    return (v - min) / (max - min || 1)
  }

  private fromClientX(x: number): number | null {
    const track = this.root.querySelector('.track')?.getBoundingClientRect()
    if (!track || !track.width) return null
    const min = this.numberAttr('min', 0)
    const max = this.numberAttr('max', 100)
    const step = this.numberAttr('step', 1)
    const raw = min + clamp((x - track.left) / track.width, 0, 1) * (max - min)
    return clamp(Math.round(raw / step) * step, min, max)
  }

  private wire(): void {
    const track = this.root.querySelector<HTMLElement>('.track')
    let active: 'a' | 'b' | null = null
    track?.addEventListener('pointerdown', (e) => {
      const v = this.fromClientX(e.clientX)
      if (v === null) return
      const thumb = (e.target as HTMLElement).closest?.('.thumb') as HTMLElement | null
      if (thumb) active = thumb.dataset['t'] === 'a' ? 'a' : 'b'
      else active = Math.abs(v - this.a) <= Math.abs(v - this.b) ? 'a' : 'b'
      track.setPointerCapture?.(e.pointerId)
      this.apply(active, v)
    })
    track?.addEventListener('pointermove', (e) => {
      if (!active) return
      const v = this.fromClientX(e.clientX)
      if (v !== null) this.apply(active, v)
    })
    const drop = (): void => {
      active = null
    }
    track?.addEventListener('pointerup', drop)
    track?.addEventListener('pointercancel', drop)
    this.root.querySelectorAll<HTMLButtonElement>('.thumb').forEach((thumb) =>
      thumb.addEventListener('keydown', (e) => {
        const step = this.numberAttr('step', 1)
        const key = e.key
        const delta =
          key === 'ArrowRight' || key === 'ArrowUp'
            ? step
            : key === 'ArrowLeft' || key === 'ArrowDown'
              ? -step
              : 0
        if (!delta && key !== 'Home' && key !== 'End') return
        e.preventDefault()
        const which = thumb.dataset['t'] === 'a' ? 'a' : 'b'
        const min = this.numberAttr('min', 0)
        const max = this.numberAttr('max', 100)
        const cur = which === 'a' ? this.a : this.b
        const next = key === 'Home' ? min : key === 'End' ? max : cur + delta
        this.apply(which, clamp(next, min, max))
      }),
    )
  }

  private apply(which: 'a' | 'b', v: number): void {
    if (which === 'a') this.a = Math.min(v, this.b)
    else this.b = Math.max(v, this.a)
    this.sync()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { start: this.a, end: this.b } }))
  }

  private sync(): void {
    const fa = this.frac(this.a) * 100
    const fb = this.frac(this.b) * 100
    const fill = this.root.querySelector<HTMLElement>('.fill')
    if (fill) {
      fill.style.left = `${fa}%`
      fill.style.width = `${fb - fa}%`
    }
    const ta = this.root.querySelector<HTMLElement>('.thumb[data-t="a"]')
    const tb = this.root.querySelector<HTMLElement>('.thumb[data-t="b"]')
    if (ta) {
      ta.style.left = `${fa}%`
      ta.setAttribute('aria-valuenow', String(this.a))
    }
    if (tb) {
      tb.style.left = `${fb}%`
      tb.setAttribute('aria-valuenow', String(this.b))
    }
    const va = this.root.querySelector('.va')
    const vb = this.root.querySelector('.vb')
    if (va) va.textContent = String(this.a)
    if (vb) vb.textContent = String(this.b)
    if (this.internals) {
      const name = this.getAttribute('name')
      if (name) {
        const fd = new FormData()
        fd.set(`${name}-start`, String(this.a))
        fd.set(`${name}-end`, String(this.b))
        this.internals.setFormValue(fd)
      }
    }
  }
}

register('aurora-rangeslider', AuroraRangeslider)
