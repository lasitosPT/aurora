import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    position: fixed;
    inset: 0;
    z-index: var(--aurora-confetti-z, 1300);
    pointer-events: none;
  }
  canvas { display: block; width: 100%; height: 100%; }
`

const COLORS = ['#6d5cff', '#22d3ee', '#a99bff', '#f472b6', '#34d399']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  spin: number
  circle: boolean
  life: number
}

export interface ConfettiOptions {
  x?: number
  y?: number
  count?: number
  colors?: string[]
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * `<aurora-confetti>` — a celebration cannon. Place one (or let the static
 * helper create it) and call `burst({ x, y, count, colors })`. Particles are
 * drawn on a full-viewport 2D canvas with gravity, drag, and spin; the loop
 * stops itself when the last piece settles. No-op under
 * `prefers-reduced-motion`.
 */
export class AuroraConfetti extends AuroraElement {
  private static singleton: AuroraConfetti | null = null
  private canvas: HTMLCanvasElement | null = null
  private particles: Particle[] = []
  private frame = 0

  /** Fire a burst on a shared, auto-created cannon. */
  static burst(options: ConfettiOptions = {}): void {
    let cannon = AuroraConfetti.singleton
    if (!cannon || !cannon.isConnected) {
      cannon = document.createElement('aurora-confetti') as AuroraConfetti
      document.body.append(cannon)
      AuroraConfetti.singleton = cannon
    }
    cannon.burst(options)
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><canvas aria-hidden="true"></canvas>`
    this.canvas = this.root.querySelector('canvas')
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
    this.particles = []
  }

  /** Fire a burst from (x, y) — defaults to the upper middle of the viewport. */
  burst(options: ConfettiOptions = {}): void {
    if (prefersReducedMotion() || !this.canvas) return
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
      this.canvas.width = width * dpr
      this.canvas.height = height * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const x = options.x ?? width / 2
    const y = options.y ?? height * 0.35
    const colors = options.colors ?? COLORS
    const count = options.count ?? 90
    for (let i = 0; i < count; i++) {
      const angle = rand(-Math.PI, 0) // upward half
      const speed = rand(4, 13)
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * rand(0.4, 1),
        vy: Math.sin(angle) * speed,
        size: rand(4, 9),
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#6d5cff',
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.25, 0.25),
        circle: Math.random() < 0.3,
        life: 1,
      })
    }

    if (!this.frame) {
      const step = (): void => {
        ctx.clearRect(0, 0, width, height)
        this.particles = this.particles.filter((p) => p.life > 0 && p.y < height + 20)
        for (const p of this.particles) {
          p.vy += 0.32
          p.vx *= 0.99
          p.x += p.vx
          p.y += p.vy
          p.rotation += p.spin
          p.life -= 0.008
          ctx.save()
          ctx.globalAlpha = Math.max(p.life, 0)
          ctx.fillStyle = p.color
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          if (p.circle) {
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62)
          }
          ctx.restore()
        }
        if (this.particles.length > 0) {
          this.frame = requestAnimationFrame(step)
        } else {
          this.frame = 0
          ctx.clearRect(0, 0, width, height)
        }
      }
      this.frame = requestAnimationFrame(step)
    }
  }
}

register('aurora-confetti', AuroraConfetti)
