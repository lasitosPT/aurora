import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const STYLE = `
  :host { display: inline-block; color: var(--aurora-fg, #ececf2); }
  .row { display: flex; gap: 10px; align-items: center; }
  canvas {
    border-radius: 10px; background: var(--aurora-field, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
  }
  .refresh {
    all: unset; cursor: pointer; width: 30px; height: 30px; display: grid; place-items: center;
    border-radius: 8px; color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .refresh:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  .refresh:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  input {
    all: unset; box-sizing: border-box; margin-top: 10px; width: 100%; padding: 0.55rem 0.8rem;
    font: inherit; letter-spacing: 0.25em; text-transform: uppercase;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 10px;
  }
  input:focus { border-color: var(--aurora-accent, #6d5cff); }
  :host([verified]) input { border-color: #34d399; }
  .state { margin-top: 6px; font-size: 0.76rem; color: var(--aurora-muted, #9a98b3); min-height: 1em; }
  :host([verified]) .state { color: #34d399; }
`

/**
 * `<aurora-captcha length="5">` — a client-side challenge: distorted glyphs
 * on canvas with noise, a refresh button, and an input that verifies as you
 * type. Reflects `verified`; form-associated (submits only once verified);
 * emits `aurora-verify` with `{ valid }`. Client-side only — pair with a
 * server check for anything that matters; this deters casual automation.
 */
export class AuroraCaptcha extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private code = ''

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

  get verified(): boolean {
    return this.hasAttribute('verified')
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="row"><canvas width="170" height="52" aria-hidden="true"></canvas><button class="refresh" aria-label="New challenge">↻</button></div>
      <input aria-label="${escapeHtml(this.getAttribute('label') ?? 'Type the characters shown')}" autocomplete="off" spellcheck="false" placeholder="Type it…" />
      <div class="state" aria-live="polite"></div>`
    this.root.querySelector('.refresh')?.addEventListener('click', () => this.regenerate())
    this.root.querySelector('input')?.addEventListener('input', () => this.check())
    this.regenerate()
  }

  /** Draw a fresh challenge (also clears verification). */
  regenerate(): void {
    const length = Math.max(this.numberAttr('length', 5), 3)
    this.code = Array.from(
      { length },
      () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? 'A',
    ).join('')
    this.removeAttribute('verified')
    this.internals?.setFormValue(null)
    const input = this.root.querySelector<HTMLInputElement>('input')
    if (input) input.value = ''
    const state = this.root.querySelector('.state')
    if (state) state.textContent = ''
    this.draw()
  }

  private draw(): void {
    const canvas = this.root.querySelector('canvas')
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = 'rgba(154, 152, 179, 0.35)'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.bezierCurveTo(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
      )
      ctx.stroke()
    }
    const step = (canvas.width - 30) / this.code.length
    this.code.split('').forEach((ch, i) => {
      ctx.save()
      ctx.translate(20 + i * step + step / 2, canvas.height / 2)
      ctx.rotate((Math.random() - 0.5) * 0.55)
      ctx.font = `${20 + Math.random() * 8}px Georgia, serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = `hsl(${250 + Math.random() * 60} 70% ${62 + Math.random() * 18}%)`
      ctx.fillText(ch, 0, (Math.random() - 0.5) * 8)
      ctx.restore()
    })
  }

  private check(): void {
    const input = this.root.querySelector<HTMLInputElement>('input')
    const typed = (input?.value ?? '').trim().toUpperCase()
    const valid = typed === this.code
    this.toggleAttribute('verified', valid)
    this.internals?.setFormValue(valid ? 'verified' : null)
    const state = this.root.querySelector('.state')
    if (state) state.textContent = valid ? '✓ Verified' : ''
    if (valid || typed.length >= this.code.length)
      this.dispatchEvent(new CustomEvent('aurora-verify', { detail: { valid } }))
  }
}

register('aurora-captcha', AuroraCaptcha)
