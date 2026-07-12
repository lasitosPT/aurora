import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: block; position: relative; color: var(--aurora-fg, #ececf2); }
  canvas { display: block; width: 100%; height: var(--aurora-chart-height, 240px); }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; padding-top: 10px; font-size: 0.82rem; color: var(--aurora-muted, #9a98b3); }
  .key { display: inline-flex; align-items: center; gap: 7px; }
  .swab { width: 10px; height: 10px; border-radius: 3px; }
  .tip {
    position: absolute; pointer-events: none; display: none; padding: 6px 10px; font-size: 0.8rem;
    background: var(--aurora-surface, #16161f); border: 1px solid var(--aurora-border, rgba(255,255,255,0.16));
    border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); white-space: nowrap; z-index: 2;
  }
`

const PALETTE = ['#6d5cff', '#22d3ee', '#f472b6', '#34d399', '#f5b83d', '#a99bff']

export interface ChartSeries {
  label: string
  data: number[]
  color?: string
}

/**
 * `<aurora-chart type="bar|line|donut">` — a 2D-canvas chart with axes,
 * gridlines, an HTML legend, hover tooltips, and an animated intro. Assign
 * `labels` (string[] categories) and `series` (`{ label, data, color? }[]`;
 * donut uses the first series). Height via `--aurora-chart-height`.
 */
export class AuroraChart extends AuroraElement {
  #series: ChartSeries[] = []
  #labels: string[] = []
  private progress = 0
  private cleanup: (() => void) | null = null

  get series(): ChartSeries[] {
    return this.#series
  }

  set series(v: ChartSeries[]) {
    this.#series = v ?? []
    this.boot()
  }

  get labels(): string[] {
    return this.#labels
  }

  set labels(v: string[]) {
    this.#labels = v ?? []
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><canvas></canvas><div class="legend" part="legend"></div><div class="tip"></div>`
    this.setAttribute('role', 'img')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Chart')
    const canvas = this.root.querySelector('canvas')
    canvas?.addEventListener('pointermove', (e) => this.hover(e))
    canvas?.addEventListener('pointerleave', () => this.tip(null, 0, 0))
    this.boot()
  }

  disconnectedCallback(): void {
    this.cleanup?.()
  }

  private color(i: number): string {
    return this.#series[i]?.color ?? PALETTE[i % PALETTE.length] ?? '#6d5cff'
  }

  private boot(): void {
    this.cleanup?.()
    if (this.#series.length === 0) return
    const legend = this.root.querySelector('.legend')
    if (legend) {
      legend.innerHTML = this.#series
        .map(
          (s, i) =>
            `<span class="key"><span class="swab" style="background:${this.color(i)}"></span>${escapeHtml(s.label)}</span>`,
        )
        .join('')
    }
    this.cleanup = whenVisible(this, () => {
      if (prefersReducedMotion()) {
        this.progress = 1
        this.draw()
      } else {
        const state = { p: 0 }
        gsap.to(state, {
          p: 1,
          duration: 1,
          ease: 'power3.out',
          onUpdate: () => {
            this.progress = state.p
            this.draw()
          },
        })
      }
    })
  }

  private geom(): { ctx: CanvasRenderingContext2D | null; w: number; h: number; pad: number } {
    const canvas = this.root.querySelector('canvas')
    const ctx = canvas?.getContext('2d') ?? null
    const w = canvas?.clientWidth ?? 300
    const h = canvas?.clientHeight ?? 240
    if (canvas && ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    return { ctx, w, h, pad: 34 }
  }

  private draw(): void {
    const { ctx, w, h, pad } = this.geom()
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    const type = this.getAttribute('type') ?? 'bar'
    if (type === 'donut') {
      this.drawDonut(ctx, w, h)
      return
    }
    const all = this.#series.flatMap((s) => s.data)
    const max = Math.max(...all, 1)
    const n = Math.max(...this.#series.map((s) => s.data.length), 1)
    const x0 = pad + 8
    const plotW = w - x0 - 8
    const plotH = h - pad - 6
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'right'
    for (let t = 0; t <= 4; t++) {
      const v = (max / 4) * t
      const y = 6 + plotH - (v / max) * plotH
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(w - 8, y)
      ctx.stroke()
      ctx.fillText(String(Math.round(v)), x0 - 6, y + 3)
    }
    ctx.textAlign = 'center'
    this.#labels.slice(0, n).forEach((label, i) => {
      ctx.fillText(label, x0 + ((i + 0.5) / n) * plotW, h - 6)
    })
    this.#series.forEach((s, si) => {
      ctx.fillStyle = this.color(si)
      ctx.strokeStyle = this.color(si)
      if (type === 'bar') {
        const group = plotW / n
        const bw = (group * 0.7) / this.#series.length
        s.data.forEach((v, i) => {
          const bh = (v / max) * plotH * this.progress
          ctx.fillRect(x0 + i * group + group * 0.15 + si * bw, 6 + plotH - bh, bw - 2, bh)
        })
      } else {
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        ctx.beginPath()
        const upto = Math.max(Math.floor((s.data.length - 1) * this.progress), 1)
        s.data.slice(0, upto + 1).forEach((v, i) => {
          const x = x0 + ((i + 0.5) / n) * plotW
          const y = 6 + plotH - (v / max) * plotH
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }
    })
  }

  private drawDonut(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const data = this.#series[0]?.data ?? []
    const total = data.reduce((a, b) => a + b, 0) || 1
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 2 - 12
    let angle = -Math.PI / 2
    data.forEach((v, i) => {
      const slice = (v / total) * Math.PI * 2 * this.progress
      ctx.beginPath()
      ctx.arc(cx, cy, r, angle, angle + slice)
      ctx.arc(cx, cy, r * 0.62, angle + slice, angle, true)
      ctx.closePath()
      ctx.fillStyle = PALETTE[i % PALETTE.length] ?? '#6d5cff'
      ctx.fill()
      angle += slice
    })
  }

  private hover(e: PointerEvent): void {
    const canvas = this.root.querySelector('canvas')
    if (!canvas || this.#series.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const type = this.getAttribute('type') ?? 'bar'
    const n = Math.max(...this.#series.map((s) => s.data.length), 1)
    if (type === 'donut') {
      this.tip(null, 0, 0)
      return
    }
    const x0 = 42
    const plotW = rect.width - x0 - 8
    const i = Math.min(Math.max(Math.floor(((e.clientX - rect.left - x0) / plotW) * n), 0), n - 1)
    const lines = this.#series.map(
      (s, si) =>
        `<span style="color:${this.color(si)}">●</span> ${escapeHtml(s.label)}: ${s.data[i] ?? '–'}`,
    )
    this.tip(
      `<strong>${escapeHtml(this.#labels[i] ?? String(i))}</strong><br>${lines.join('<br>')}`,
      e.clientX - rect.left,
      e.clientY - rect.top,
    )
  }

  private tip(html: string | null, x: number, y: number): void {
    const tip = this.root.querySelector<HTMLElement>('.tip')
    if (!tip) return
    if (!html) {
      tip.style.display = 'none'
      return
    }
    tip.innerHTML = html
    tip.style.display = 'block'
    tip.style.left = `${x + 14}px`
    tip.style.top = `${y - 10}px`
  }
}

register('aurora-chart', AuroraChart)
