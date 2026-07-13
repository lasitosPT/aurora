import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; }
  ::slotted(*) {
    cursor: grab;
    user-select: none;
    touch-action: none;
  }
  ::slotted(.aurora-dragging) {
    cursor: grabbing;
    position: relative;
    z-index: 3;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
  }
`

/**
 * `<aurora-sortable>` — drag-to-reorder for its light-DOM children. Pointer
 * drags lift the item and shuffle siblings out of the way with FLIP
 * animations; keyboard users move the focused item with Ctrl/⌘ + arrows.
 * `move(from, to)` reorders programmatically. Emits `aurora-reorder` with
 * `{ from, to, item }`.
 */
export class AuroraSortable extends AuroraElement {
  private dragEl: HTMLElement | null = null
  private startY = 0

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><slot></slot>`
    this.setAttribute('role', 'list')
    this.items().forEach((el) => this.prep(el))
    this.addEventListener('pointerdown', (e) => this.onDown(e))
    this.addEventListener('pointermove', (e) => this.onMove(e))
    this.addEventListener('pointerup', () => this.onUp())
    this.addEventListener('pointercancel', () => this.onUp())
  }

  items(): HTMLElement[] {
    return Array.from(this.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
  }

  move(from: number, to: number): void {
    const list = this.items()
    const item = list[from]
    const bound = Math.max(0, Math.min(to, list.length - 1))
    if (!item || bound === from) return
    const ref = list[bound]
    if (!ref) return
    this.flip(() => {
      if (bound > from) ref.after(item)
      else ref.before(item)
    }, item)
    item.focus?.()
    this.dispatchEvent(new CustomEvent('aurora-reorder', { detail: { from, to: bound, item } }))
  }

  private prep(el: HTMLElement): void {
    el.setAttribute('role', 'listitem')
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0
    el.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const idx = this.items().indexOf(el)
      this.move(idx, idx + (e.key === 'ArrowDown' ? 1 : -1))
    })
  }

  private flip(mutate: () => void, skip: HTMLElement | null = null): void {
    const before = new Map<HTMLElement, number>()
    for (const el of this.items()) before.set(el, el.offsetTop)
    mutate()
    if (prefersReducedMotion()) return
    for (const el of this.items()) {
      if (el === skip) continue
      const prev = before.get(el)
      if (prev === undefined) continue
      const delta = prev - el.offsetTop
      if (delta) gsap.fromTo(el, { y: delta }, { y: 0, duration: 0.28, ease: 'power2.out' })
    }
  }

  private onDown(e: PointerEvent): void {
    let node = e.target as HTMLElement | null
    while (node && node.parentElement !== this) node = node.parentElement
    const target = node && this.items().includes(node) ? node : null
    if (!target) return
    this.dragEl = target
    this.startY = e.clientY
    this.setPointerCapture?.(e.pointerId)
    target.classList.add('aurora-dragging')
    if (!prefersReducedMotion()) gsap.to(target, { scale: 1.03, duration: 0.15 })
  }

  private onMove(e: PointerEvent): void {
    const el = this.dragEl
    if (!el) return
    gsap.set(el, { y: e.clientY - this.startY })
    const siblings = this.items().filter((s) => s !== el)
    for (const sib of siblings) {
      const r = sib.getBoundingClientRect()
      if (!r.height) continue
      const mid = r.top + r.height / 2
      const elIdx = this.items().indexOf(el)
      const sibIdx = this.items().indexOf(sib)
      if (sibIdx > elIdx && e.clientY > mid) {
        this.shift(el, () => sib.after(el), e.clientY)
        break
      } else if (sibIdx < elIdx && e.clientY < mid) {
        this.shift(el, () => sib.before(el), e.clientY)
        break
      }
    }
  }

  private shift(el: HTMLElement, mutate: () => void, pointerY: number): void {
    const base = el.getBoundingClientRect().top - Number(gsap.getProperty(el, 'y'))
    this.flip(mutate, el)
    this.startY += el.getBoundingClientRect().top - Number(gsap.getProperty(el, 'y')) - base
    gsap.set(el, { y: pointerY - this.startY })
  }

  private onUp(): void {
    const el = this.dragEl
    if (!el) return
    this.dragEl = null
    el.classList.remove('aurora-dragging')
    const idx = this.items().indexOf(el)
    if (prefersReducedMotion()) gsap.set(el, { y: 0, scale: 1 })
    else gsap.to(el, { y: 0, scale: 1, duration: 0.3, ease: 'power3.out' })
    this.dispatchEvent(
      new CustomEvent('aurora-reorder', { detail: { from: -1, to: idx, item: el } }),
    )
  }
}

register('aurora-sortable', AuroraSortable)
