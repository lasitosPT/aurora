import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; }
  .overlay {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }
  .dot {
    position: absolute;
    border-radius: 50%;
    background: var(--aurora-ripple-color, rgba(109, 92, 255, 0.3));
    transform: translate(-50%, -50%);
  }
`

/**
 * `<aurora-ripple>` — emits a soft ripple from the pointer on press. Wrap any
 * clickable content; the ripple clips to the host's border-radius. Theme with
 * `--aurora-ripple-color`.
 */
export class AuroraRipple extends AuroraElement {
  private overlay: HTMLElement | null = null
  private onDown: ((event: PointerEvent) => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="overlay" part="overlay"></div><slot></slot>`
    this.overlay = this.root.querySelector('.overlay')
    if (prefersReducedMotion()) return

    this.onDown = (event: PointerEvent): void => {
      if (!this.overlay) return
      const rect = this.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2.2 || 80
      const dot = document.createElement('span')
      dot.className = 'dot'
      dot.style.left = `${event.clientX - rect.left}px`
      dot.style.top = `${event.clientY - rect.top}px`
      dot.style.width = `${size}px`
      dot.style.height = `${size}px`
      this.overlay.append(dot)
      gsap.fromTo(
        dot,
        { scale: 0, opacity: 0.9 },
        { scale: 1, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => dot.remove() },
      )
    }
    this.addEventListener('pointerdown', this.onDown)
  }

  disconnectedCallback(): void {
    if (this.onDown) this.removeEventListener('pointerdown', this.onDown)
  }
}

register('aurora-ripple', AuroraRipple)
