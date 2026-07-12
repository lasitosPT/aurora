import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: inline-block; width: 160px; height: 44px; }
  canvas { display: block; width: 100%; height: 100%; }
`

function cssColor(el: HTMLElement, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

/**
 * `<aurora-sparkline type="area">` — a tiny inline chart. Assign `data`
 * (number[]); the line draws itself when scrolled into view. `type`
 * (`line` default, `area`, `bars`), colors via `--aurora-spark-color` /
 * `--aurora-spark-fill`. Size the host with CSS.
 */
export class AuroraSparkline extends AuroraElement {
  #data: number[] = []
  private cleanup: (() => void) | null = null

  get data(): number[] {
    return this.#data
  }

  set data(v: number[]) {
    this.#data = v ?? []
    this.start()
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><canvas aria-hidden="true"></canvas>`
    this.setAttribute('role', 'img')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Sparkline chart')
    this.start()
  }

  disconnectedCallback(): void {
    this.cleanup?.()
  }

  private start(): void {
    this.cleanup?.()
    if (this.#data.length < 2) return
    this.cleanup = whenVisible(this, () => {
      if (prefersReducedMotion()) this.draw(1)
      else {
        const state = { p: 0 }
        gsap.to(state, {
          p: 1,
          duration: 1.1,
          ease: 'power2.out',
          onUpdate: () => this.draw(state.p),
        })
      }
    })
  }

  private draw(progress: number): void {
    const canvas = this.root.querySelector('canvas')
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth || 160
    const h = canvas.clientHeight || 44
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const data = this.#data
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const pad = 3
    const x = (i: number): number => pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = (v: number): number => h - pad - ((v - min) / span) * (h - pad * 2)
    const color = cssColor(this, '--aurora-spark-color', '#6d5cff')
    const type = this.getAttribute('type') ?? 'line'
    const upto = Math.max(Math.floor((data.length - 1) * progress), 1)

    if (type === 'bars') {
      const bw = ((w - pad * 2) / data.length) * 0.65
      ctx.fillStyle = color
      data.slice(0, Math.max(Math.ceil(data.length * progress), 1)).forEach((v, i) => {
        const bx = pad + (i / data.length) * (w - pad * 2)
        ctx.fillRect(bx, y(v), bw, h - pad - y(v))
      })
      return
    }
    ctx.beginPath()
    ctx.moveTo(x(0), y(data[0] as number))
    for (let i = 1; i <= upto; i++) ctx.lineTo(x(i), y(data[i] as number))
    if (type === 'area') {
      ctx.save()
      ctx.lineTo(x(upto), h - pad)
      ctx.lineTo(x(0), h - pad)
      ctx.closePath()
      ctx.fillStyle = cssColor(this, '--aurora-spark-fill', 'rgba(109, 92, 255, 0.18)')
      ctx.fill()
      ctx.restore()
      ctx.beginPath()
      ctx.moveTo(x(0), y(data[0] as number))
      for (let i = 1; i <= upto; i++) ctx.lineTo(x(i), y(data[i] as number))
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x(upto), y(data[upto] as number), 2.6, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
}

register('aurora-sparkline', AuroraSparkline)
