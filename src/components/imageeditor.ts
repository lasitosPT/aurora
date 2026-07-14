import { AuroraElement } from '../core/base'
import { clamp } from '../core/motion'
import { register } from '../core/register'

interface EditState {
  rotation: 0 | 90 | 180 | 270
  flipH: boolean
  flipV: boolean
  brightness: number
  contrast: number
  saturate: number
}

const FRESH: EditState = {
  rotation: 0,
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  saturate: 100,
}

const STYLE = `
  :host {
    display: block; width: 100%; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .tools {
    display: flex; gap: 4px; flex-wrap: wrap; align-items: center; padding: 9px;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
  }
  .tools button {
    all: unset; cursor: pointer; min-width: 32px; height: 30px; padding: 0 8px;
    display: inline-grid; place-items: center; border-radius: 8px; font-size: 0.82rem;
    color: var(--aurora-muted, #9a98b3);
  }
  .tools button:hover { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.06); }
  .tools button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .tools .sep { width: 1px; height: 20px; background: var(--aurora-border, rgba(255, 255, 255, 0.12)); margin: 0 5px; }
  .tools label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--aurora-muted, #9a98b3); }
  .tools input[type='range'] { width: 74px; accent-color: var(--aurora-accent, #6d5cff); }
  .stagewrap { display: grid; place-items: center; padding: 18px; min-height: 220px; position: relative; }
  canvas { max-width: 100%; height: auto; border-radius: 8px; }
  .cropov { position: absolute; cursor: crosshair; touch-action: none; }
  .marq {
    position: absolute; display: none; border: 1.5px dashed #fff; pointer-events: none;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45); border-radius: 2px;
  }
  .cropbar {
    position: absolute; top: 6px; inset-inline-end: 6px; display: flex; gap: 5px; z-index: 2;
  }
  .cropbar button {
    all: unset; cursor: pointer; font-size: 0.76rem; padding: 4px 12px; border-radius: 7px;
    background: var(--aurora-surface, #16161f); color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.2));
  }
  .cropbar button:hover { border-color: var(--aurora-accent, #6d5cff); }
  .cropbar button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .empty { color: var(--aurora-muted, #9a98b3); font-size: 0.88rem; }
  input[type='file'] { display: none; }
`

/**
 * `<aurora-imageeditor src="…">` — a canvas image editor: open a file or
 * pass `src`, rotate in quarter turns, flip either axis, adjust brightness,
 * contrast, and saturation live, crop (✂ then drag a marquee — applying
 * bakes the current edits and the cropped result becomes the working image),
 * reset (restores the originally opened image), and export (`toDataUrl()`
 * or a download). Emits `aurora-change` with the edit state after every
 * operation.
 */
export class AuroraImageeditor extends AuroraElement {
  private img: HTMLImageElement | null = null
  private original: HTMLImageElement | null = null
  private state: EditState = { ...FRESH }
  private cropping = false

  get edits(): EditState {
    return { ...this.state }
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="tools" part="tools" role="toolbar" aria-label="Image tools">
        <button data-a="open" aria-label="Open image">📂 Open</button>
        <span class="sep"></span>
        <button data-a="rotl" aria-label="Rotate left">⟲</button>
        <button data-a="rotr" aria-label="Rotate right">⟳</button>
        <button data-a="fliph" aria-label="Flip horizontally">⇋</button>
        <button data-a="flipv" aria-label="Flip vertically">⇅</button>
        <button data-a="crop" aria-label="Crop">✂ Crop</button>
        <span class="sep"></span>
        <label>☀ <input type="range" data-f="brightness" min="20" max="180" value="100" aria-label="Brightness" /></label>
        <label>◐ <input type="range" data-f="contrast" min="20" max="180" value="100" aria-label="Contrast" /></label>
        <label>🎨 <input type="range" data-f="saturate" min="0" max="200" value="100" aria-label="Saturation" /></label>
        <span class="sep"></span>
        <button data-a="reset" aria-label="Reset edits">↺ Reset</button>
        <button data-a="save" aria-label="Download image">⬇ Save</button>
      </div>
      <div class="stagewrap"><canvas hidden></canvas><span class="empty">Open an image to start editing</span></div>
      <input type="file" accept="image/*" />`
    const file = this.root.querySelector<HTMLInputElement>('input[type="file"]')
    this.root.querySelector('[data-a="open"]')?.addEventListener('click', () => file?.click())
    file?.addEventListener('change', () => {
      const picked = file.files?.[0]
      if (picked) this.loadUrl(URL.createObjectURL(picked))
    })
    this.root.querySelector('[data-a="rotl"]')?.addEventListener('click', () => this.rotate(-90))
    this.root.querySelector('[data-a="rotr"]')?.addEventListener('click', () => this.rotate(90))
    this.root.querySelector('[data-a="fliph"]')?.addEventListener('click', () => this.flip('h'))
    this.root.querySelector('[data-a="flipv"]')?.addEventListener('click', () => this.flip('v'))
    this.root.querySelector('[data-a="crop"]')?.addEventListener('click', () => this.startCrop())
    this.root.querySelector('[data-a="reset"]')?.addEventListener('click', () => this.reset())
    this.root.querySelector('[data-a="save"]')?.addEventListener('click', () => this.download())
    this.root.querySelectorAll<HTMLInputElement>('input[data-f]').forEach((range) =>
      range.addEventListener('input', () => {
        const key = range.dataset['f'] as 'brightness' | 'contrast' | 'saturate'
        this.state[key] = clamp(Number(range.value), 0, 200)
        this.redraw()
        this.emit()
      }),
    )
    const src = this.getAttribute('src')
    if (src) this.loadUrl(src)
  }

  /** Load an image URL (also the file-picker path). */
  loadUrl(url: string): void {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = (): void => {
      this.img = img
      this.original = img
      this.state = { ...FRESH }
      this.root.querySelectorAll<HTMLInputElement>('input[data-f]').forEach((r) => {
        r.value = '100'
      })
      this.redraw()
      this.emit()
    }
    img.src = url
  }

  rotate(delta: 90 | -90): void {
    this.state.rotation = ((((this.state.rotation + delta) % 360) + 360) %
      360) as EditState['rotation']
    this.redraw()
    this.emit()
  }

  flip(axis: 'h' | 'v'): void {
    if (axis === 'h') this.state.flipH = !this.state.flipH
    else this.state.flipV = !this.state.flipV
    this.redraw()
    this.emit()
  }

  /** Enter crop mode: drag a marquee over the image, then Apply or Cancel. */
  startCrop(): void {
    if (!this.img || this.cropping) return
    const canvas = this.root.querySelector('canvas')
    const wrap = this.root.querySelector<HTMLElement>('.stagewrap')
    if (!canvas || !wrap) return
    this.cropping = true
    const ov = document.createElement('div')
    ov.className = 'cropov'
    ov.style.left = `${canvas.offsetLeft}px`
    ov.style.top = `${canvas.offsetTop}px`
    ov.style.width = `${canvas.offsetWidth || canvas.width}px`
    ov.style.height = `${canvas.offsetHeight || canvas.height}px`
    ov.innerHTML = `<div class="marq"></div><div class="cropbar"><button data-crop-apply>Apply</button><button data-crop-cancel>Cancel</button></div>`
    wrap.appendChild(ov)
    const marq = ov.querySelector<HTMLElement>('.marq')
    let rect: { x: number; y: number; w: number; h: number } | null = null
    ov.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.cropbar')) return
      e.preventDefault()
      ov.setPointerCapture?.(e.pointerId)
      const base = ov.getBoundingClientRect()
      const sx = e.clientX - base.left
      const sy = e.clientY - base.top
      const onMove = (move: PointerEvent): void => {
        const cx = clamp(move.clientX - base.left, 0, base.width || Infinity)
        const cy = clamp(move.clientY - base.top, 0, base.height || Infinity)
        rect = {
          x: Math.min(sx, cx),
          y: Math.min(sy, cy),
          w: Math.abs(cx - sx),
          h: Math.abs(cy - sy),
        }
        if (marq) {
          marq.style.display = 'block'
          marq.style.left = `${rect.x}px`
          marq.style.top = `${rect.y}px`
          marq.style.width = `${rect.w}px`
          marq.style.height = `${rect.h}px`
        }
      }
      const onUp = (): void => {
        ov.removeEventListener('pointermove', onMove)
        ov.removeEventListener('pointerup', onUp)
      }
      ov.addEventListener('pointermove', onMove)
      ov.addEventListener('pointerup', onUp)
    })
    ov.querySelector('[data-crop-cancel]')?.addEventListener('click', () => this.cancelCrop())
    ov.querySelector('[data-crop-apply]')?.addEventListener('click', () => {
      if (!rect || rect.w < 2 || rect.h < 2) {
        this.cancelCrop()
        return
      }
      const scaleX = canvas.width / (canvas.offsetWidth || canvas.width)
      const scaleY = canvas.height / (canvas.offsetHeight || canvas.height)
      this.applyCrop({
        x: rect.x * scaleX,
        y: rect.y * scaleY,
        w: rect.w * scaleX,
        h: rect.h * scaleY,
      })
    })
  }

  /** Leave crop mode without cutting. */
  cancelCrop(): void {
    this.cropping = false
    this.root.querySelector('.cropov')?.remove()
  }

  /**
   * Cut a region (canvas-pixel coordinates) out of the rendered image. The
   * current rotation/flip/filters are baked in and the crop becomes the new
   * working image; Reset still restores the originally opened file.
   */
  applyCrop(rect: { x: number; y: number; w: number; h: number }): void {
    const canvas = this.root.querySelector('canvas')
    const w = Math.round(rect.w)
    const h = Math.round(rect.h)
    if (!canvas || !this.img || w < 1 || h < 1) return
    const cut = document.createElement('canvas')
    cut.width = w
    cut.height = h
    const ctx = cut.getContext('2d')
    if (!ctx) return
    ctx.drawImage(canvas, Math.round(rect.x), Math.round(rect.y), w, h, 0, 0, w, h)
    const next = new Image()
    next.onload = (): void => {
      this.img = next
      this.state = { ...FRESH }
      this.root.querySelectorAll<HTMLInputElement>('input[data-f]').forEach((r) => {
        r.value = '100'
      })
      this.redraw()
      this.emit()
    }
    next.src = cut.toDataURL()
    this.cancelCrop()
  }

  reset(): void {
    if (this.original) this.img = this.original
    this.state = { ...FRESH }
    this.root.querySelectorAll<HTMLInputElement>('input[data-f]').forEach((r) => {
      r.value = '100'
    })
    this.redraw()
    this.emit()
  }

  /** The edited image as a data URL (empty string before an image loads). */
  toDataUrl(type = 'image/png'): string {
    const canvas = this.root.querySelector('canvas')
    if (!canvas || !this.img) return ''
    try {
      return canvas.toDataURL(type)
    } catch {
      return ''
    }
  }

  private download(): void {
    const url = this.toDataUrl()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited.png'
    a.click()
  }

  private redraw(): void {
    const canvas = this.root.querySelector('canvas')
    const empty = this.root.querySelector<HTMLElement>('.empty')
    if (!canvas || !this.img) return
    canvas.hidden = false
    if (empty) empty.hidden = true
    const { rotation, flipH, flipV, brightness, contrast, saturate } = this.state
    const sideways = rotation === 90 || rotation === 270
    const w = this.img.naturalWidth || 300
    const h = this.img.naturalHeight || 200
    canvas.width = sideways ? h : w
    canvas.height = sideways ? w : h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.drawImage(this.img, -w / 2, -h / 2)
    ctx.restore()
  }

  private emit(): void {
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { edits: this.edits } }))
  }
}

register('aurora-imageeditor', AuroraImageeditor)
