import { AuroraElement } from '../core/base'
import { clamp } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: block;
    position: relative;
    overflow: hidden;
    touch-action: pan-y;
  }
  ::slotted(*) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    -webkit-user-drag: none;
  }
  .after {
    position: absolute;
    inset: 0;
    clip-path: inset(0 calc(100% - var(--pos, 50%)) 0 0);
  }
  .divider {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--pos, 50%);
    width: 2px;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 14px rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }
  .handle {
    all: unset;
    position: absolute;
    top: 50%;
    left: var(--pos, 50%);
    transform: translate(-50%, -50%);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    cursor: ew-resize;
    color: #fff;
    background: var(--aurora-surface, #16161f);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  }
  .handle:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .handle svg { width: 15px; height: 15px; }
`

/**
 * `<aurora-compare value="50">` — a before/after comparison slider. Put the
 * base content in `slot="before"` and the overlay in `slot="after"`; drag the
 * divider (or focus the handle and use arrow keys) to sweep between them.
 * Emits `aurora-change` with `{ value }`.
 */
export class AuroraCompare extends AuroraElement {
  private handle: HTMLElement | null = null
  private pos = 50

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot name="before"></slot><div class="after" part="after"><slot name="after"></slot></div><div class="divider" part="divider"></div><button class="handle" part="handle" role="slider" aria-label="Comparison position" aria-valuemin="0" aria-valuemax="100"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 4L2 8l3.5 4M10.5 4L14 8l-3.5 4"/></svg></button>`
    this.handle = this.root.querySelector('.handle')

    this.set(this.numberAttr('value', 50))
    this.addEventListener('pointerdown', this.onDown)
    this.handle?.addEventListener('keydown', this.onKey)
  }

  /** Current position, 0–100. */
  get value(): number {
    return this.pos
  }

  set value(next: number) {
    this.set(next)
  }

  private set(next: number): void {
    this.pos = clamp(next, 0, 100)
    this.style.setProperty('--pos', `${this.pos}%`)
    this.handle?.setAttribute('aria-valuenow', String(Math.round(this.pos)))
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.pos } }))
  }

  private readonly onDown = (event: PointerEvent): void => {
    this.setPointerCapture(event.pointerId)
    this.fromClientX(event.clientX)
    const onMove = (move: PointerEvent): void => this.fromClientX(move.clientX)
    const onUp = (up: PointerEvent): void => {
      this.removeEventListener('pointermove', onMove)
      this.removeEventListener('pointerup', onUp)
      this.removeEventListener('pointercancel', onUp)
      if (this.hasPointerCapture(up.pointerId)) this.releasePointerCapture(up.pointerId)
    }
    this.addEventListener('pointermove', onMove)
    this.addEventListener('pointerup', onUp)
    this.addEventListener('pointercancel', onUp)
  }

  private fromClientX(clientX: number): void {
    const rect = this.getBoundingClientRect()
    if (rect.width === 0) return
    this.set(((clientX - rect.left) / rect.width) * 100)
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    let next: number | null = null
    if (event.key === 'ArrowLeft') next = this.pos - 2
    else if (event.key === 'ArrowRight') next = this.pos + 2
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 100
    if (next === null) return
    event.preventDefault()
    this.set(next)
  }
}

register('aurora-compare', AuroraCompare)
