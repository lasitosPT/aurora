import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const VIEW_W = 400
const VIEW_H = 160

const STYLE = `
  :host { display: block; width: 100%; max-width: 420px; position: relative; }
  .pad {
    position: relative; aspect-ratio: ${VIEW_W} / ${VIEW_H}; cursor: crosshair;
    touch-action: none; border-radius: 13px; overflow: hidden;
    background: var(--aurora-field, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
  }
  .pad:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  svg { display: block; width: 100%; height: 100%; }
  path {
    fill: none; stroke: var(--aurora-signature-color, var(--aurora-fg, #ececf2));
    stroke-linecap: round; stroke-linejoin: round;
  }
  .base { position: absolute; left: 8%; right: 8%; top: 76%; border-top: 1.5px dashed var(--aurora-border, rgba(255, 255, 255, 0.2)); pointer-events: none; }
  .hint {
    position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none;
    color: var(--aurora-muted, #9a98b3); font-size: 0.9rem; transition: opacity 0.2s ease;
  }
  :host([signed]) .hint { opacity: 0; }
  .clear {
    all: unset; position: absolute; top: 8px; right: 8px; cursor: pointer;
    width: 26px; height: 26px; display: grid; place-items: center; border-radius: 8px;
    color: var(--aurora-muted, #9a98b3); background: rgba(255, 255, 255, 0.05);
    opacity: 0; transition: opacity 0.2s ease, color 0.15s ease;
  }
  :host([signed]) .clear { opacity: 1; }
  .clear:hover { color: var(--aurora-fg, #ececf2); }
  .clear:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); opacity: 1; }
`

/**
 * `<aurora-signature name="sig">` — a signature pad. Pointer strokes are
 * captured into a fixed 400×160 coordinate space, smoothed with quadratic
 * midpoints, and rendered as SVG. Form-associated: submits an
 * `image/svg+xml` data URL. `clear()`, `undo()`, `addStroke()` for restoring
 * saved ink; reflects a `signed` attribute and emits `aurora-change`.
 */
export class AuroraSignature extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private strokeList: [number, number][][] = []
  private live: [number, number][] | null = null

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

  get strokes(): [number, number][][] {
    return this.strokeList.map((s) => [...s])
  }

  get value(): string {
    return this.strokeList.length ? this.toDataUrl() : ''
  }

  connectedCallback(): void {
    const hint = this.getAttribute('placeholder') ?? 'Sign here'
    this.root.innerHTML = `<style>${STYLE}</style><div class="pad" part="pad" tabindex="0" role="img" aria-label="Signature pad"><svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="none"></svg><span class="base" part="baseline"></span><span class="hint" part="hint">${escapeHtml(hint)}</span><button class="clear" part="clear" aria-label="Clear signature">✕</button></div>`
    const pad = this.root.querySelector<HTMLElement>('.pad')
    if (!pad) return
    const toPoint = (e: PointerEvent): [number, number] | null => {
      const r = pad.getBoundingClientRect()
      if (!r.width || !r.height) return null
      return [
        Math.round(((e.clientX - r.left) / r.width) * VIEW_W * 10) / 10,
        Math.round(((e.clientY - r.top) / r.height) * VIEW_H * 10) / 10,
      ]
    }
    pad.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.clear')) return
      const p = toPoint(e)
      if (!p) return
      pad.setPointerCapture?.(e.pointerId)
      this.live = [p]
      this.strokeList.push(this.live)
      this.paint()
    })
    pad.addEventListener('pointermove', (e) => {
      if (!this.live) return
      const p = toPoint(e)
      if (!p) return
      const last = this.live[this.live.length - 1]
      if (last && Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 1.2) return
      this.live.push(p)
      this.paint()
    })
    const end = (): void => {
      if (!this.live) return
      this.live = null
      this.commit()
    }
    pad.addEventListener('pointerup', end)
    pad.addEventListener('pointercancel', end)
    this.root.querySelector('.clear')?.addEventListener('click', () => this.clear())
    this.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        this.undo()
      }
    })
  }

  /** Programmatic ink — points in the 400×160 viewBox space. */
  addStroke(points: [number, number][]): void {
    if (!points.length) return
    this.strokeList.push(points.map((p) => [...p] as [number, number]))
    this.paint()
    this.commit()
  }

  undo(): void {
    if (!this.strokeList.length) return
    this.strokeList.pop()
    this.paint()
    this.commit()
  }

  clear(): void {
    if (!this.strokeList.length) return
    this.strokeList = []
    this.paint()
    this.commit()
  }

  toSvg(): string {
    const width = this.getAttribute('stroke-width') ?? '2.5'
    const paths = this.strokeList
      .map((s) => `<path d="${pathFor(s)}" stroke-width="${escapeHtml(width)}"/>`)
      .join('')
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  }

  toDataUrl(): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(this.toSvg())}`
  }

  private paint(): void {
    const svg = this.root.querySelector('svg')
    if (!svg) return
    const width = this.getAttribute('stroke-width') ?? '2.5'
    svg.innerHTML = this.strokeList
      .map((s) => `<path d="${pathFor(s)}" stroke-width="${escapeHtml(width)}"/>`)
      .join('')
    if (this.strokeList.length) this.setAttribute('signed', '')
    else this.removeAttribute('signed')
  }

  private commit(): void {
    this.internals?.setFormValue(this.value)
    this.dispatchEvent(
      new CustomEvent('aurora-change', {
        detail: { value: this.value, strokes: this.strokeList.length },
      }),
    )
  }
}

function pathFor(points: [number, number][]): string {
  const first = points[0]
  if (!first) return ''
  if (points.length < 3) {
    const last = points[points.length - 1] ?? first
    return `M${first[0]} ${first[1]}L${last[0]} ${last[1]}`
  }
  let d = `M${first[0]} ${first[1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (!a || !b) continue
    d += `Q${a[0]} ${a[1]} ${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2}`
  }
  return d
}

register('aurora-signature', AuroraSignature)
