import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

/* One drag at a time — module-level context shared by the pair. */
let activeDrag: { el: AuroraDraggable; data: string } | null = null

const zones = new Set<AuroraDropzone>()

const DRAG_STYLE = `
  :host { display: inline-block; cursor: grab; touch-action: none; user-select: none; }
  :host(.aurora-dragging) { cursor: grabbing; position: relative; z-index: 9; }
`

/**
 * `<aurora-draggable data="payload">` — makes its content pointer-draggable.
 * While dragging, `<aurora-dropzone>`s hit-test and highlight; releasing over
 * one delivers the payload. Emits `aurora-dragstart` and `aurora-dragend`
 * (with `{ dropped }`).
 */
export class AuroraDraggable extends AuroraElement {
  private startX = 0
  private startY = 0

  connectedCallback(): void {
    this.root.innerHTML = `<style>${DRAG_STYLE}</style><slot></slot>`
    this.addEventListener('pointerdown', (e) => {
      if (this.hasAttribute('disabled')) return
      e.preventDefault()
      this.startX = e.clientX
      this.startY = e.clientY
      activeDrag = { el: this, data: this.getAttribute('data') ?? '' }
      this.setPointerCapture?.(e.pointerId)
      this.classList.add('aurora-dragging')
      if (!prefersReducedMotion()) gsap.to(this, { scale: 1.04, duration: 0.12 })
      this.dispatchEvent(new CustomEvent('aurora-dragstart', { detail: { data: activeDrag.data } }))
    })
    this.addEventListener('pointermove', (e) => {
      if (activeDrag?.el !== this) return
      gsap.set(this, { x: e.clientX - this.startX, y: e.clientY - this.startY })
      for (const zone of zones) zone.hover(zone.hits(e.clientX, e.clientY))
    })
    const finish = (e: PointerEvent): void => {
      if (activeDrag?.el !== this) return
      const drag = activeDrag
      activeDrag = null
      this.classList.remove('aurora-dragging')
      let dropped = false
      for (const zone of zones) {
        if (zone.hits(e.clientX, e.clientY)) {
          dropped = zone.receive(drag.data, this)
          break
        }
      }
      for (const zone of zones) zone.hover(false)
      if (prefersReducedMotion()) gsap.set(this, { x: 0, y: 0, scale: 1 })
      else gsap.to(this, { x: 0, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' })
      this.dispatchEvent(new CustomEvent('aurora-dragend', { detail: { dropped } }))
    }
    this.addEventListener('pointerup', finish)
    this.addEventListener('pointercancel', finish)
  }
}

register('aurora-draggable', AuroraDraggable)

const ZONE_STYLE = `
  :host {
    display: block; border-radius: 14px; transition: border-color 0.15s ease, background 0.15s ease;
    border: 1.5px dashed var(--aurora-border, rgba(255, 255, 255, 0.18));
    padding: var(--aurora-dropzone-pad, 18px);
  }
  :host([hovering]) {
    border-color: var(--aurora-accent, #6d5cff);
    background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 8%, transparent);
  }
`

/**
 * `<aurora-dropzone accept="cards">` — a drop target for
 * `<aurora-draggable>`s. Highlights while a compatible drag hovers and emits
 * `aurora-drop` with `{ data, draggable }`. `accept` matches against the
 * draggable's `type` attribute (omit to accept everything).
 */
export class AuroraDropzone extends AuroraElement {
  connectedCallback(): void {
    this.root.innerHTML = `<style>${ZONE_STYLE}</style><slot></slot>`
    zones.add(this)
  }

  disconnectedCallback(): void {
    zones.delete(this)
  }

  /** Is the point inside this zone (and the active drag acceptable)? */
  hits(x: number, y: number): boolean {
    if (!activeDrag) return false
    const accept = this.getAttribute('accept')
    if (accept && activeDrag.el.getAttribute('type') !== accept) return false
    const r = this.getBoundingClientRect()
    return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }

  hover(on: boolean): void {
    this.toggleAttribute('hovering', on)
  }

  /** Deliver a payload (returns whether the drop event was not prevented). */
  receive(data: string, draggable: AuroraDraggable): boolean {
    this.hover(false)
    return this.dispatchEvent(
      new CustomEvent('aurora-drop', { detail: { data, draggable }, cancelable: true }),
    )
  }
}

register('aurora-dropzone', AuroraDropzone)
