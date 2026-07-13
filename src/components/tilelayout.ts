import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const TILE_STYLE = `
  :host {
    display: flex; flex-direction: column; overflow: hidden; position: relative;
    background: var(--aurora-surface, #14141f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; min-height: 90px;
  }
  .head {
    display: flex; align-items: center; padding: 10px 14px 0; gap: 8px;
    font-weight: 600; font-size: 0.9rem; color: var(--aurora-fg, #ececf2);
    cursor: grab; user-select: none;
  }
  .head:active { cursor: grabbing; }
  .body { flex: 1; padding: 10px 14px 14px; color: var(--aurora-muted, #9a98b3); font-size: 0.88rem; }
  :host(.aurora-dragging) { z-index: 3; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5); }
`

/** `<aurora-tile heading="…" colspan="2">` — one dashboard tile; drag it by its header. */
export class AuroraTile extends AuroraElement {
  connectedCallback(): void {
    const heading = this.getAttribute('heading') ?? ''
    this.root.innerHTML = `<style>${TILE_STYLE}</style>${
      heading ? `<div class="head" part="head">${escapeHtml(heading)}</div>` : ''
    }<div class="body" part="body"><slot></slot></div>`
    this.root.querySelector('.head')?.addEventListener('pointerdown', (e) => {
      const ev = e as PointerEvent
      this.dispatchEvent(
        new CustomEvent('aurora-tile-grab', {
          bubbles: true,
          detail: { x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId },
        }),
      )
    })
    this.applySpan()
  }

  applySpan(): void {
    const c = this.numberAttr('colspan', 1)
    const r = this.numberAttr('rowspan', 1)
    this.style.gridColumn = `span ${Math.max(1, c)}`
    this.style.gridRow = `span ${Math.max(1, r)}`
  }
}

register('aurora-tile', AuroraTile)

const STYLE = `
  :host {
    display: grid; gap: var(--aurora-tile-gap, 14px);
    grid-template-columns: repeat(var(--aurora-tile-cols, 3), 1fr);
    grid-auto-rows: minmax(90px, auto);
  }
`

/**
 * `<aurora-tilelayout columns="3">` — a dashboard grid of `<aurora-tile>`
 * children. Drag a tile by its header to reorder — siblings FLIP out of the
 * way; tiles span cells via `colspan`/`rowspan`. Emits `aurora-reorder` with
 * the new order.
 */
export class AuroraTilelayout extends AuroraElement {
  private dragEl: HTMLElement | null = null
  private startX = 0
  private startY = 0

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot>`
    this.style.setProperty('--aurora-tile-cols', String(this.numberAttr('columns', 3)))
    this.addEventListener('aurora-tile-grab', (e) => {
      this.onGrab(e as CustomEvent<{ x: number; y: number; pointerId: number }>)
    })
    this.addEventListener('pointermove', (e) => this.onMove(e))
    this.addEventListener('pointerup', () => this.onUp())
    this.addEventListener('pointercancel', () => this.onUp())
  }

  tiles(): HTMLElement[] {
    return Array.from(this.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
  }

  private flip(mutate: () => void, skip: HTMLElement | null): void {
    const before = new Map<HTMLElement, { x: number; y: number }>()
    for (const el of this.tiles()) before.set(el, { x: el.offsetLeft, y: el.offsetTop })
    mutate()
    if (prefersReducedMotion()) return
    for (const el of this.tiles()) {
      if (el === skip) continue
      const prev = before.get(el)
      if (!prev) continue
      const dx = prev.x - el.offsetLeft
      const dy = prev.y - el.offsetTop
      if (dx || dy)
        gsap.fromTo(el, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.32, ease: 'power2.out' })
    }
  }

  private onGrab(e: CustomEvent<{ x: number; y: number; pointerId: number }>): void {
    const node = e.target as HTMLElement | null
    if (!node || !this.tiles().includes(node)) return
    this.dragEl = node
    this.startX = e.detail.x
    this.startY = e.detail.y
    this.setPointerCapture?.(e.detail.pointerId)
    node.classList.add('aurora-dragging')
    if (!prefersReducedMotion()) gsap.to(node, { scale: 1.02, duration: 0.15 })
  }

  private onMove(e: PointerEvent): void {
    const el = this.dragEl
    if (!el) return
    gsap.set(el, { x: e.clientX - this.startX, y: e.clientY - this.startY })
    for (const sib of this.tiles()) {
      if (sib === el) continue
      const r = sib.getBoundingClientRect()
      if (!r.width) continue
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        continue
      const elIdx = this.tiles().indexOf(el)
      const sibIdx = this.tiles().indexOf(sib)
      const baseX = el.getBoundingClientRect().left - Number(gsap.getProperty(el, 'x'))
      const baseY = el.getBoundingClientRect().top - Number(gsap.getProperty(el, 'y'))
      this.flip(() => {
        if (sibIdx > elIdx) sib.after(el)
        else sib.before(el)
      }, el)
      this.startX += el.getBoundingClientRect().left - Number(gsap.getProperty(el, 'x')) - baseX
      this.startY += el.getBoundingClientRect().top - Number(gsap.getProperty(el, 'y')) - baseY
      gsap.set(el, { x: e.clientX - this.startX, y: e.clientY - this.startY })
      break
    }
  }

  private onUp(): void {
    const el = this.dragEl
    if (!el) return
    this.dragEl = null
    el.classList.remove('aurora-dragging')
    if (prefersReducedMotion()) gsap.set(el, { x: 0, y: 0, scale: 1 })
    else gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' })
    this.dispatchEvent(
      new CustomEvent('aurora-reorder', {
        detail: { order: this.tiles().map((t) => t.getAttribute('heading') ?? '') },
      }),
    )
  }
}

register('aurora-tilelayout', AuroraTilelayout)
