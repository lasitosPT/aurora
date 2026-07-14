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
  .heading { text-align: center; font-weight: 600; font-size: 0.95rem; padding-bottom: 8px; }
  .axis-x { text-align: center; font-size: 0.74rem; color: var(--aurora-muted, #9a98b3); padding-top: 4px; }
  .frame { display: flex; align-items: stretch; }
  .axis-y {
    writing-mode: vertical-rl; transform: rotate(180deg); text-align: center;
    font-size: 0.74rem; color: var(--aurora-muted, #9a98b3); flex: none; padding-inline-start: 2px;
  }
  .framebody { flex: 1; min-width: 0; }
  .nodata {
    display: grid; place-items: center; height: var(--aurora-chart-height, 240px);
    color: var(--aurora-muted, #9a98b3); font-size: 0.88rem;
  }
  .nodata[hidden] { display: none; }
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
  /** Per-point error bars: a symmetric ± number, an absolute [low, high], or null. */
  errors?: ([number, number] | number | null)[]
}

export type DateUnit = 'day' | 'week' | 'month' | 'year'

function unitFloor(t: number, unit: DateUnit): number {
  const d = new Date(t)
  if (unit === 'year') return new Date(d.getFullYear(), 0, 1).getTime()
  if (unit === 'month') return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  if (unit === 'week') {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    day.setDate(day.getDate() - ((day.getDay() + 6) % 7))
    return day.getTime()
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function unitNext(t: number, unit: DateUnit): number {
  const d = new Date(t)
  if (unit === 'year') return new Date(d.getFullYear() + 1, 0, 1).getTime()
  if (unit === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
  d.setDate(d.getDate() + (unit === 'week' ? 7 : 1))
  return d.getTime()
}

function unitLabel(t: number, unit: DateUnit): string {
  const d = new Date(t)
  if (unit === 'year') return String(d.getFullYear())
  if (unit === 'month') return d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

/**
 * Bucket date-labelled points into calendar units, aggregating collisions and
 * zero-filling empty buckets so the axis is a true time axis. Error bars are
 * carried through only when a bucket holds a single point.
 */
export function aggregateByDate(
  labels: string[],
  series: ChartSeries[],
  unit: DateUnit | 'auto' = 'auto',
  aggregate: 'sum' | 'avg' | 'min' | 'max' = 'sum',
): { labels: string[]; series: ChartSeries[]; unit: DateUnit } {
  const times = labels.map((l) => new Date(l.includes('T') ? l : `${l}T00:00`).getTime())
  const valid = times.filter((t) => !Number.isNaN(t))
  if (!valid.length) return { labels, series, unit: 'day' }
  const lo = Math.min(...valid)
  const hi = Math.max(...valid)
  let u: DateUnit
  if (unit !== 'auto') u = unit
  else {
    const span = (hi - lo) / 86400000
    u = span > 730 ? 'year' : span > 120 ? 'month' : span > 21 ? 'week' : 'day'
  }
  const buckets: number[] = []
  for (let t = unitFloor(lo, u); t <= hi; t = unitNext(t, u)) buckets.push(t)
  const index = new Map(buckets.map((t, i) => [t, i]))
  const outSeries = series.map((s) => {
    const groups: number[][] = buckets.map(() => [])
    const errGroups: (([number, number] | number | null)[] | null)[] = buckets.map(() => null)
    s.data.forEach((v, i) => {
      const t = times[i]
      if (t === undefined || Number.isNaN(t)) return
      const bi = index.get(unitFloor(t, u))
      if (bi === undefined) return
      ;(groups[bi] as number[]).push(v)
      const err = s.errors?.[i]
      if (err !== undefined) {
        const list = errGroups[bi] ?? []
        list.push(err)
        errGroups[bi] = list
      }
    })
    const data = groups.map((g) => {
      if (!g.length) return 0
      if (aggregate === 'avg') return g.reduce((a, b) => a + b, 0) / g.length
      if (aggregate === 'min') return Math.min(...g)
      if (aggregate === 'max') return Math.max(...g)
      return g.reduce((a, b) => a + b, 0)
    })
    const errors = s.errors
      ? groups.map((g, i) => {
          const list = errGroups[i]
          return g.length === 1 && list?.length === 1 ? (list[0] ?? null) : null
        })
      : undefined
    return { ...s, data, ...(errors ? { errors } : {}) }
  })
  return { labels: buckets.map((t) => unitLabel(t, u)), series: outSeries, unit: u }
}

/**
 * `<aurora-chart type="bar|line|area|donut|pie|scatter|funnel|pyramid">` — a 2D-canvas
 * chart with axes, gridlines, an HTML legend, hover tooltips, and an
 * animated intro, plus `chart-title`/`x-title`/`y-title` captions, a no-data
 * state (`empty-text`), and PNG export (`toImage()`/`exportImage()`). Assign
 * `labels` (string[] categories) and `series`
 * (`{ label, data, color?, errors? }[]`; donut/pie use the first series).
 * Bars can `stacked`; height via `--aurora-chart-height`. With `date-axis`,
 * labels parse as dates and bucket into calendar units (`base-unit`
 * day/week/month/year, default auto by span) aggregating collisions
 * (`aggregate` sum/avg/min/max) and zero-filling gaps — a true date series.
 * `series.errors` draws per-point error-bar whiskers (± number or [low, high]).
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

  /** labels/series after date bucketing (identity without date-axis). */
  private view(): { labels: string[]; series: ChartSeries[] } {
    if (!this.hasAttribute('date-axis')) return { labels: this.#labels, series: this.#series }
    const unitAttr = this.getAttribute('base-unit')
    const aggAttr = this.getAttribute('aggregate')
    return aggregateByDate(
      this.#labels,
      this.#series,
      unitAttr === 'day' || unitAttr === 'week' || unitAttr === 'month' || unitAttr === 'year'
        ? unitAttr
        : 'auto',
      aggAttr === 'avg' || aggAttr === 'min' || aggAttr === 'max' ? aggAttr : 'sum',
    )
  }

  private errorRange(
    v: number,
    err: [number, number] | number | null | undefined,
  ): [number, number] | null {
    if (err === null || err === undefined) return null
    if (typeof err === 'number') return [v - err, v + err]
    return err
  }

  connectedCallback(): void {
    const heading = this.getAttribute('chart-title')
    const xTitle = this.getAttribute('x-title')
    const yTitle = this.getAttribute('y-title')
    this.root.innerHTML = `<style>${STYLE}</style>${
      heading ? `<div class="heading" part="title">${escapeHtml(heading)}</div>` : ''
    }<div class="frame">${
      yTitle ? `<div class="axis-y" part="y-title">${escapeHtml(yTitle)}</div>` : ''
    }<div class="framebody"><canvas></canvas><div class="nodata" hidden>${escapeHtml(
      this.getAttribute('empty-text') ?? 'No data available',
    )}</div>${xTitle ? `<div class="axis-x" part="x-title">${escapeHtml(xTitle)}</div>` : ''}</div></div><div class="legend" part="legend"></div><div class="tip"></div>`
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

  /** The rendered chart as a PNG data URL (empty before first draw). */
  toImage(type = 'image/png'): string {
    const canvas = this.root.querySelector('canvas')
    if (!canvas) return ''
    try {
      return canvas.toDataURL(type)
    } catch {
      return ''
    }
  }

  /** Download the chart as an image file. */
  exportImage(filename = 'chart.png'): void {
    const url = this.toImage()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  private color(i: number): string {
    return this.#series[i]?.color ?? PALETTE[i % PALETTE.length] ?? '#6d5cff'
  }

  private boot(): void {
    this.cleanup?.()
    const empty = this.#series.length === 0 || this.#series.every((s) => s.data.length === 0)
    const nodata = this.root.querySelector<HTMLElement>('.nodata')
    const canvas = this.root.querySelector<HTMLElement>('canvas')
    if (nodata) nodata.hidden = !empty
    if (canvas) canvas.style.display = empty ? 'none' : 'block'
    if (empty) {
      const legend = this.root.querySelector('.legend')
      if (legend) legend.innerHTML = ''
      return
    }
    if (this.#series.length === 0) return
    const legend = this.root.querySelector('.legend')
    if (legend) {
      const type = this.getAttribute('type') ?? 'bar'
      const keys =
        type === 'donut' || type === 'pie' || type === 'funnel' || type === 'pyramid'
          ? this.#labels.map((label, i) => ({
              label,
              color: PALETTE[i % PALETTE.length] ?? '#6d5cff',
            }))
          : this.#series.map((s, i) => ({ label: s.label, color: this.color(i) }))
      legend.innerHTML = keys
        .map(
          (k) =>
            `<span class="key"><span class="swab" style="background:${k.color}"></span>${escapeHtml(k.label)}</span>`,
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
    if (type === 'donut' || type === 'pie') {
      this.drawDonut(ctx, w, h, type === 'donut' ? 0.62 : 0)
      return
    }
    if (type === 'funnel' || type === 'pyramid') {
      this.drawFunnel(ctx, w, h, type === 'pyramid')
      return
    }
    const stacked = type === 'bar' && this.hasAttribute('stacked')
    const { labels, series } = this.view()
    const n0 = Math.max(...series.map((s) => s.data.length), 1)
    const max = stacked
      ? Math.max(
          ...Array.from({ length: n0 }, (_, i) =>
            series.reduce((sum, s) => sum + (s.data[i] ?? 0), 0),
          ),
          1,
        )
      : Math.max(
          ...series.flatMap((s) =>
            s.data.map((v, i) => this.errorRange(v, s.errors?.[i])?.[1] ?? v),
          ),
          1,
        )
    const n = Math.max(...series.map((s) => s.data.length), 1)
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
    const step = Math.ceil(n / Math.max(Math.floor(plotW / 52), 1))
    labels.slice(0, n).forEach((label, i) => {
      if (i % step === 0) ctx.fillText(label, x0 + ((i + 0.5) / n) * plotW, h - 6)
    })
    const stackBase = new Array<number>(n).fill(0)
    const whisker = (v: number, i: number, s: ChartSeries, cx: number): void => {
      const range = this.errorRange(v, s.errors?.[i])
      if (!range || this.progress < 1) return
      const [lo, hi] = range
      const yLo = 6 + plotH - (lo / max) * plotH
      const yHi = 6 + plotH - (hi / max) * plotH
      const cap = Math.min(plotW / n / 4, 9)
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(cx, yLo)
      ctx.lineTo(cx, yHi)
      ctx.moveTo(cx - cap, yLo)
      ctx.lineTo(cx + cap, yLo)
      ctx.moveTo(cx - cap, yHi)
      ctx.lineTo(cx + cap, yHi)
      ctx.stroke()
      ctx.restore()
    }
    series.forEach((s, si) => {
      ctx.fillStyle = this.color(si)
      ctx.strokeStyle = this.color(si)
      if (type === 'bar' && stacked) {
        const group = plotW / n
        const bw = group * 0.55
        s.data.forEach((v, i) => {
          const bh = (v / max) * plotH * this.progress
          const y = 6 + plotH - ((stackBase[i] ?? 0) / max) * plotH * this.progress - bh
          ctx.fillRect(x0 + i * group + group * 0.225, y, bw, bh)
          stackBase[i] = (stackBase[i] ?? 0) + v
        })
      } else if (type === 'bar') {
        const group = plotW / n
        const bw = (group * 0.7) / this.#series.length
        s.data.forEach((v, i) => {
          const bh = (v / max) * plotH * this.progress
          const bx = x0 + i * group + group * 0.15 + si * bw
          ctx.fillRect(bx, 6 + plotH - bh, bw - 2, bh)
          whisker(v, i, s, bx + (bw - 2) / 2)
        })
      } else if (type === 'scatter') {
        s.data.forEach((v, i) => {
          const x = x0 + ((i + 0.5) / n) * plotW
          const y = 6 + plotH - (v / max) * plotH
          ctx.beginPath()
          ctx.arc(x, y, 4.5 * this.progress, 0, Math.PI * 2)
          ctx.globalAlpha = 0.85
          ctx.fill()
          ctx.globalAlpha = 1
          whisker(v, i, s, x)
        })
      } else {
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        const upto = Math.max(Math.floor((s.data.length - 1) * this.progress), 1)
        const pts = s.data.slice(0, upto + 1).map((v, i) => ({
          x: x0 + ((i + 0.5) / n) * plotW,
          y: 6 + plotH - (v / max) * plotH,
        }))
        ctx.beginPath()
        pts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
        if (type === 'line')
          s.data.slice(0, upto + 1).forEach((v, i) => {
            whisker(v, i, s, x0 + ((i + 0.5) / n) * plotW)
          })
        if (type === 'area' && pts.length > 1) {
          const first = pts[0]
          const last = pts[pts.length - 1]
          if (first && last) {
            ctx.lineTo(last.x, 6 + plotH)
            ctx.lineTo(first.x, 6 + plotH)
            ctx.closePath()
            ctx.globalAlpha = 0.16
            ctx.fill()
            ctx.globalAlpha = 1
          }
        }
      }
    })
  }

  private drawDonut(ctx: CanvasRenderingContext2D, w: number, h: number, inner: number): void {
    const data = this.#series[0]?.data ?? []
    const total = data.reduce((a, b) => a + b, 0) || 1
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 2 - 12
    let angle = -Math.PI / 2
    data.forEach((v, i) => {
      const slice = (v / total) * Math.PI * 2 * this.progress
      ctx.beginPath()
      if (inner > 0) {
        ctx.arc(cx, cy, r, angle, angle + slice)
        ctx.arc(cx, cy, r * inner, angle + slice, angle, true)
      } else {
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, angle, angle + slice)
      }
      ctx.closePath()
      ctx.fillStyle = PALETTE[i % PALETTE.length] ?? '#6d5cff'
      ctx.fill()
      angle += slice
    })
  }

  private drawFunnel(ctx: CanvasRenderingContext2D, w: number, h: number, pyramid: boolean): void {
    const data = this.#series[0]?.data ?? []
    if (!data.length) return
    const max = Math.max(...data, 1)
    const gap = 3
    const bandH = (h - 12 - gap * (data.length - 1)) / data.length
    const cx = w / 2
    const usable = w * 0.86
    const widthAt = (i: number): number => {
      if (pyramid) return usable * ((i + 1) / data.length)
      return usable * ((data[i] ?? 0) / max)
    }
    data.forEach((v, i) => {
      const y = 6 + i * (bandH + gap)
      const topW = widthAt(i) * this.progress
      const botW = (i + 1 < data.length ? widthAt(i + 1) : widthAt(i) * 0.72) * this.progress
      ctx.beginPath()
      ctx.moveTo(cx - topW / 2, y)
      ctx.lineTo(cx + topW / 2, y)
      ctx.lineTo(cx + botW / 2, y + bandH)
      ctx.lineTo(cx - botW / 2, y + bandH)
      ctx.closePath()
      ctx.fillStyle = PALETTE[i % PALETTE.length] ?? '#6d5cff'
      ctx.globalAlpha = 0.88
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'center'
      if (bandH > 16) ctx.fillText(`${this.#labels[i] ?? ''} — ${v}`, cx, y + bandH / 2 + 4)
    })
  }

  private hover(e: PointerEvent): void {
    const canvas = this.root.querySelector('canvas')
    if (!canvas || this.#series.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const type = this.getAttribute('type') ?? 'bar'
    if (type === 'funnel' || type === 'pyramid') {
      const data = this.#series[0]?.data ?? []
      const gap = 3
      const bandH = (rect.height - 12 - gap * (data.length - 1)) / data.length
      const i = Math.floor((e.clientY - rect.top - 6) / (bandH + gap))
      if (i >= 0 && i < data.length) {
        const total = data.reduce((a, b) => a + b, 0) || 1
        const pct = Math.round(((data[i] ?? 0) / total) * 100)
        this.tip(
          `<strong>${escapeHtml(this.#labels[i] ?? String(i))}</strong>: ${data[i]} (${pct}%)`,
          e.clientX - rect.left,
          e.clientY - rect.top,
        )
      } else this.tip(null, 0, 0)
      return
    }
    if (type === 'donut' || type === 'pie') {
      const cx = rect.width / 2
      const cy = rect.height / 2
      const dx = e.clientX - rect.left - cx
      const dy = e.clientY - rect.top - cy
      const r = Math.min(rect.width, rect.height) / 2 - 12
      const dist = Math.hypot(dx, dy)
      const innerR = type === 'donut' ? r * 0.62 : 0
      if (dist > r || dist < innerR) {
        this.tip(null, 0, 0)
        return
      }
      const data = this.#series[0]?.data ?? []
      const total = data.reduce((a, b) => a + b, 0) || 1
      let theta = Math.atan2(dy, dx) + Math.PI / 2
      if (theta < 0) theta += Math.PI * 2
      let acc = 0
      for (let i = 0; i < data.length; i++) {
        acc += ((data[i] ?? 0) / total) * Math.PI * 2
        if (theta <= acc) {
          const pct = Math.round(((data[i] ?? 0) / total) * 100)
          this.tip(
            `<strong>${escapeHtml(this.#labels[i] ?? String(i))}</strong>: ${data[i]} (${pct}%)`,
            e.clientX - rect.left,
            e.clientY - rect.top,
          )
          return
        }
      }
      this.tip(null, 0, 0)
      return
    }
    const x0 = 42
    const plotW = rect.width - x0 - 8
    const { labels, series } = this.view()
    const nv = Math.max(...series.map((s) => s.data.length), 1)
    const i = Math.min(Math.max(Math.floor(((e.clientX - rect.left - x0) / plotW) * nv), 0), nv - 1)
    const fmt = (v: number | undefined): string =>
      v === undefined ? '–' : String(Math.round(v * 100) / 100)
    const lines = series.map(
      (s, si) =>
        `<span style="color:${this.color(si)}">●</span> ${escapeHtml(s.label)}: ${fmt(s.data[i])}`,
    )
    this.tip(
      `<strong>${escapeHtml(labels[i] ?? String(i))}</strong><br>${lines.join('<br>')}`,
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
