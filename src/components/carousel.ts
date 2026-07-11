import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: block;
    overflow: hidden;
    cursor: grab;
    touch-action: pan-y;
    max-width: 100%;
    min-width: 0;
  }
  :host(:active) { cursor: grabbing; }
  :host(:focus-visible) { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 4px; }
  .track {
    display: flex;
    gap: var(--aurora-carousel-gap, 16px);
    will-change: transform;
  }
  ::slotted(*) {
    flex: 0 0 auto;
    user-select: none;
    -webkit-user-drag: none;
  }
`

/**
 * `<aurora-carousel>` — a drag-to-scroll carousel with GSAP inertia and snap.
 * Slides are its children (size them with CSS). Drag or swipe, use arrow keys,
 * or call `next()` / `prev()` / `goTo(i)`. Emits `aurora-slide-change`.
 */
export class AuroraCarousel extends AuroraElement {
  private track: HTMLElement | null = null
  private x = 0
  private index = 0
  private dragging = false
  private moved = false

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="track" part="track"><slot></slot></div>`
    this.track = this.root.querySelector('.track')
    this.setAttribute('role', 'region')
    this.setAttribute('aria-roledescription', 'carousel')
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0

    this.addEventListener('pointerdown', this.onDown)
    this.addEventListener('keydown', this.onKey)
    // swallow the click that follows a drag so links inside don't fire
    this.addEventListener(
      'click',
      (event) => {
        if (this.moved) {
          event.preventDefault()
          event.stopPropagation()
          this.moved = false
        }
      },
      true,
    )
  }

  private slides(): HTMLElement[] {
    return Array.from(this.children) as HTMLElement[]
  }

  private minX(): number {
    if (!this.track) return 0
    return Math.min(0, this.clientWidth - this.track.scrollWidth)
  }

  /** Snap to slide `i`. */
  goTo(i: number, animate = true): void {
    const slides = this.slides()
    const slide = slides[clamp(i, 0, slides.length - 1)]
    if (!slide || !this.track) return
    const next = clamp(i, 0, slides.length - 1)
    this.x = clamp(-slide.offsetLeft, this.minX(), 0)
    if (next !== this.index) {
      this.index = next
      this.dispatchEvent(new CustomEvent('aurora-slide-change', { detail: { index: next } }))
    }
    gsap.to(this.track, {
      x: this.x,
      duration: animate && !prefersReducedMotion() ? 0.6 : 0,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }

  next(): void {
    this.goTo(this.index + 1)
  }

  prev(): void {
    this.goTo(this.index - 1)
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      this.next()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      this.prev()
    }
  }

  private readonly onDown = (event: PointerEvent): void => {
    if (!this.track) return
    this.dragging = true
    this.moved = false
    this.setPointerCapture(event.pointerId)
    gsap.killTweensOf(this.track)

    const startPointer = event.clientX
    const startX = this.x
    let lastX = event.clientX
    let lastT = performance.now()
    let velocity = 0

    const onMove = (move: PointerEvent): void => {
      if (!this.dragging || !this.track) return
      const dx = move.clientX - startPointer
      if (Math.abs(dx) > 5) this.moved = true
      this.x = clamp(startX + dx, this.minX() - 70, 70)
      gsap.set(this.track, { x: this.x })
      const now = performance.now()
      if (now - lastT > 0) velocity = (move.clientX - lastX) / (now - lastT)
      lastX = move.clientX
      lastT = now
    }
    const onUp = (up: PointerEvent): void => {
      this.dragging = false
      this.removeEventListener('pointermove', onMove)
      this.removeEventListener('pointerup', onUp)
      this.removeEventListener('pointercancel', onUp)
      if (this.hasPointerCapture(up.pointerId)) this.releasePointerCapture(up.pointerId)

      // project momentum, then snap to the nearest slide start
      const projected = clamp(this.x + velocity * 140, this.minX(), 0)
      const slides = this.slides()
      let nearest = 0
      let best = Infinity
      slides.forEach((slide, i) => {
        const d = Math.abs(-slide.offsetLeft - projected)
        if (d < best) {
          best = d
          nearest = i
        }
      })
      this.goTo(nearest)
    }
    this.addEventListener('pointermove', onMove)
    this.addEventListener('pointerup', onUp)
    this.addEventListener('pointercancel', onUp)
  }
}

register('aurora-carousel', AuroraCarousel)
