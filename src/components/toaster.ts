import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    position: fixed;
    z-index: var(--aurora-toast-z, 1100);
    display: flex;
    flex-direction: column;
    gap: 10px;
    right: 20px;
    bottom: 20px;
    align-items: flex-end;
    pointer-events: none;
  }
  :host([position='top-right']) { top: 20px; bottom: auto; }
  :host([position='bottom-left']) { left: 20px; right: auto; align-items: flex-start; }
  :host([position='top-left']) { left: 20px; right: auto; top: 20px; bottom: auto; align-items: flex-start; }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 240px;
    max-width: min(90vw, 380px);
    padding: 12px 14px 12px 16px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-left: 3px solid var(--aurora-accent, #6d5cff);
    border-radius: 12px;
    background: var(--aurora-surface, #16161f);
    color: var(--aurora-fg, #ececf2);
    font-size: 0.92rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
    will-change: transform, opacity;
  }
  .toast.success { border-left-color: var(--aurora-success, #34d399); }
  .toast.error { border-left-color: var(--aurora-error, #f87171); }
  .msg { flex: 1; }
  .close {
    all: unset;
    cursor: pointer;
    padding: 2px 7px;
    border-radius: 6px;
    color: var(--aurora-muted, #9a98b3);
  }
  .close:hover { color: inherit; }
  .close:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
`

export interface ToastOptions {
  variant?: 'default' | 'success' | 'error'
  duration?: number
}

/**
 * `<aurora-toaster>` — an animated toast stack. Place one anywhere (or let the
 * static helper create it) and call `show(message, { variant, duration })`.
 * Toasts spring in, pause their timer while hovered, and can be dismissed.
 * Position with the `position` attribute (`bottom-right` default, `top-right`,
 * `bottom-left`, `top-left`). Emits `aurora-dismiss`.
 */
export class AuroraToaster extends AuroraElement {
  private static singleton: AuroraToaster | null = null

  /** Show a toast on a shared toaster, creating it on first use. */
  static show(message: string, options: ToastOptions = {}): HTMLElement {
    let toaster = AuroraToaster.singleton
    if (!toaster || !toaster.isConnected) {
      toaster = document.createElement('aurora-toaster') as AuroraToaster
      document.body.append(toaster)
      AuroraToaster.singleton = toaster
    }
    return toaster.show(message, options)
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style>`
    this.setAttribute('role', 'region')
    this.setAttribute('aria-live', 'polite')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Notifications')
  }

  /** Add a toast; returns its element. */
  show(message: string, options: ToastOptions = {}): HTMLElement {
    const toast = document.createElement('div')
    toast.className = `toast${options.variant && options.variant !== 'default' ? ` ${options.variant}` : ''}`
    toast.setAttribute('role', 'status')

    const msg = document.createElement('span')
    msg.className = 'msg'
    msg.textContent = message
    const close = document.createElement('button')
    close.className = 'close'
    close.setAttribute('aria-label', 'Dismiss notification')
    close.textContent = '✕'
    close.addEventListener('click', () => this.dismiss(toast))
    toast.append(msg, close)
    this.root.append(toast)

    if (!prefersReducedMotion()) {
      gsap.fromTo(
        toast,
        { x: 46, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' },
      )
    }

    const duration = options.duration ?? this.numberAttr('duration', 4200)
    if (duration > 0) {
      let remaining = duration
      let startedAt = performance.now()
      let timer = window.setTimeout(() => this.dismiss(toast), remaining)
      toast.addEventListener('pointerenter', () => {
        window.clearTimeout(timer)
        remaining -= performance.now() - startedAt
      })
      toast.addEventListener('pointerleave', () => {
        startedAt = performance.now()
        timer = window.setTimeout(() => this.dismiss(toast), Math.max(remaining, 400))
      })
    }
    return toast
  }

  /** Animate a toast out and remove it. */
  dismiss(toast: HTMLElement): void {
    if (!toast.isConnected) return
    const done = (): void => {
      toast.remove()
      this.dispatchEvent(new CustomEvent('aurora-dismiss'))
    }
    if (prefersReducedMotion()) {
      done()
      return
    }
    gsap.to(toast, { x: 46, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done })
  }
}

register('aurora-toaster', AuroraToaster)
