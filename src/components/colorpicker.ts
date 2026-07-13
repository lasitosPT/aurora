import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number): number => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const to = (x: number): string =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(f(5))}${to(f(3))}${to(f(1))}`
}

function hexToHsv(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1] ?? '', 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  return [h, max ? d / max : 0, max]
}

const STYLE = `
  :host { display: inline-block; width: 230px; color: var(--aurora-fg, #ececf2); }
  .sv {
    position: relative; height: 140px; border-radius: 10px; cursor: crosshair; touch-action: none;
    background:
      linear-gradient(to top, #000, transparent),
      linear-gradient(to right, #fff, hsl(var(--h, 265) 100% 50%));
  }
  .sv-handle, .hue-handle {
    all: unset; position: absolute; width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid #fff; box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.55); cursor: grab;
    transform: translate(-50%, -50%); box-sizing: border-box;
  }
  .sv-handle:focus-visible, .hue-handle:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .hue {
    position: relative; height: 14px; border-radius: 7px; margin-top: 12px; cursor: pointer; touch-action: none;
    background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  }
  .hue-handle { top: 50%; }
  .row { display: flex; gap: 10px; margin-top: 12px; align-items: center; }
  .preview { width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--aurora-border, rgba(255,255,255,0.16)); flex: none; }
  .hex {
    all: unset; box-sizing: border-box; flex: 1; min-width: 0; padding: 0.45rem 0.65rem; font: inherit;
    font-variant-numeric: tabular-nums; text-transform: lowercase;
    background: var(--aurora-field, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 9px;
  }
  .hex:focus { border-color: var(--aurora-accent, #6d5cff); }
  .swatches { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .swatches button {
    all: unset; width: 22px; height: 22px; border-radius: 7px; cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.18); box-sizing: border-box;
  }
  .swatches button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
`

/**
 * `<aurora-colorpicker value="#6d5cff">` — an HSV color picker: gradient
 * saturation/value area, hue strip, hex field, live preview, and optional
 * `swatches="#a,#b"` presets. Both handles are keyboard-adjustable. Emits
 * `aurora-change` with `{ value }` (6-digit hex) and is form-associated.
 */
export class AuroraColorpicker extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private h = 265
  private s = 0.65
  private v = 1

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

  get value(): string {
    return hsvToHex(this.h, this.s, this.v)
  }

  set value(hex: string) {
    const p = hexToHsv(hex)
    if (!p) return
    ;[this.h, this.s, this.v] = p
    this.sync()
  }

  connectedCallback(): void {
    const swatches = (this.getAttribute('swatches') ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter((c) => hexToHsv(c))
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="sv" part="area"><button class="sv-handle" aria-label="Saturation and brightness"></button></div>
      <div class="hue" part="hue"><button class="hue-handle" role="slider" aria-label="Hue" aria-valuemin="0" aria-valuemax="360"></button></div>
      <div class="row"><div class="preview" part="preview"></div><input class="hex" part="input" spellcheck="false" aria-label="Hex color" /></div>
      ${
        swatches.length
          ? `<div class="swatches" part="swatches">${swatches
              .map(
                (c) =>
                  `<button style="background:${escapeHtml(c)}" data-c="${escapeHtml(c)}" aria-label="${escapeHtml(c)}"></button>`,
              )
              .join('')}</div>`
          : ''
      }`
    const initial = this.getAttribute('value')
    if (initial) {
      const p = hexToHsv(initial)
      if (p) [this.h, this.s, this.v] = p
    }
    this.wire()
    this.sync()
  }

  private wire(): void {
    const sv = this.root.querySelector<HTMLElement>('.sv')
    const hue = this.root.querySelector<HTMLElement>('.hue')
    const hex = this.root.querySelector<HTMLInputElement>('.hex')
    const pickSv = (e: PointerEvent): void => {
      const r = sv?.getBoundingClientRect()
      if (!r || !r.width) return
      this.s = clamp((e.clientX - r.left) / r.width, 0, 1)
      this.v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1)
      this.sync()
      this.emit()
    }
    const pickHue = (e: PointerEvent): void => {
      const r = hue?.getBoundingClientRect()
      if (!r || !r.width) return
      this.h = clamp((e.clientX - r.left) / r.width, 0, 1) * 360
      this.sync()
      this.emit()
    }
    for (const [el, pick] of [
      [sv, pickSv],
      [hue, pickHue],
    ] as const) {
      el?.addEventListener('pointerdown', (e) => {
        el.setPointerCapture?.(e.pointerId)
        pick(e)
      })
      el?.addEventListener('pointermove', (e) => {
        if (e.buttons) pick(e)
      })
    }
    this.root.querySelector('.sv-handle')?.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key
      const step = 0.03
      if (k === 'ArrowRight') this.s = clamp(this.s + step, 0, 1)
      else if (k === 'ArrowLeft') this.s = clamp(this.s - step, 0, 1)
      else if (k === 'ArrowUp') this.v = clamp(this.v + step, 0, 1)
      else if (k === 'ArrowDown') this.v = clamp(this.v - step, 0, 1)
      else return
      e.preventDefault()
      this.sync()
      this.emit()
    })
    this.root.querySelector('.hue-handle')?.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key
      if (k === 'ArrowRight' || k === 'ArrowUp') this.h = (this.h + 4) % 360
      else if (k === 'ArrowLeft' || k === 'ArrowDown') this.h = (this.h + 356) % 360
      else return
      e.preventDefault()
      this.sync()
      this.emit()
    })
    hex?.addEventListener('change', () => {
      const p = hexToHsv(hex.value)
      if (p) {
        ;[this.h, this.s, this.v] = p
        this.emit()
      }
      this.sync()
    })
    this.root.querySelectorAll<HTMLButtonElement>('.swatches button').forEach((b) =>
      b.addEventListener('click', () => {
        this.value = b.dataset.c ?? ''
        if (!prefersReducedMotion())
          gsap.fromTo(
            b,
            { scale: 1 },
            { scale: 1.25, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' },
          )
        this.emit()
      }),
    )
  }

  private emit(): void {
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.value } }))
  }

  private sync(): void {
    const hexVal = this.value
    this.root
      .querySelector<HTMLElement>('.sv')
      ?.style.setProperty('--h', String(Math.round(this.h)))
    const svHandle = this.root.querySelector<HTMLElement>('.sv-handle')
    if (svHandle) {
      svHandle.style.left = `${this.s * 100}%`
      svHandle.style.top = `${(1 - this.v) * 100}%`
      svHandle.style.background = hexVal
    }
    const hueHandle = this.root.querySelector<HTMLElement>('.hue-handle')
    if (hueHandle) {
      hueHandle.style.left = `${(this.h / 360) * 100}%`
      hueHandle.style.background = `hsl(${Math.round(this.h)} 100% 50%)`
      hueHandle.setAttribute('aria-valuenow', String(Math.round(this.h)))
    }
    const preview = this.root.querySelector<HTMLElement>('.preview')
    if (preview) preview.style.background = hexVal
    const hex = this.root.querySelector<HTMLInputElement>('.hex')
    if (hex && this.root.activeElement !== hex) hex.value = hexVal
    this.internals?.setFormValue(hexVal)
  }
}

register('aurora-colorpicker', AuroraColorpicker)
