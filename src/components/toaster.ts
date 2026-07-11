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
    right: 20px;
    bottom: 20px;
    align-items: flex-end;
    pointer-events: none;
  }
  :host([position='top-right']) { top: 20px; bottom: auto; }
  :host([position='bottom-left']) { left: 20px; right: auto; align-items: flex-start; }
  :host([position='top-left']) { left: 20px; right: auto; top: 20px; bottom: auto; align-items: flex-start; }
  .toast {
    --tone: var(--aurora-accent, #6d5cff);
    --tone-soft: rgba(109, 92, 255, 0.22);
    pointer-events: auto;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    gap: 13px;
    min-width: 280px;
    max-width: min(90vw, 400px);
    margin-top: 10px;
    padding: 14px 14px 16px 15px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(34, 34, 52, 0.88), rgba(13, 13, 22, 0.92));
    backdrop-filter: blur(14px) saturate(1.4);
    -webkit-backdrop-filter: blur(14px) saturate(1.4);
    color: var(--aurora-fg, #ececf2);
    font-size: 0.92rem;
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 0 30px -6px var(--tone-soft);
    will-change: transform, opacity;
  }
  .toast.success {
    --tone: var(--aurora-success, #34d399);
    --tone-soft: rgba(52, 211, 153, 0.22);
  }
  .toast.error {
    --tone: var(--aurora-error, #f87171);
    --tone-soft: rgba(248, 113, 113, 0.22);
  }
  .badge {
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--tone) 16%, transparent);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--tone) 35%, transparent),
      0 0 16px -2px var(--tone-soft);
  }
  .badge svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: var(--tone);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .badge svg * {
    stroke-dasharray: 40;
  }
  .content { flex: 1; min-width: 0; padding-top: 3px; }
  .title {
    display: block;
    font-weight: 650;
    letter-spacing: -0.01em;
    margin-bottom: 2px;
  }
  .msg { color: var(--aurora-muted, #a7a5bd); }
  .msg.solo { color: inherit; padding-top: 0; }
  .close {
    all: unset;
    cursor: pointer;
    padding: 3px 8px;
    margin: -2px -4px 0 0;
    border-radius: 7px;
    color: var(--aurora-muted, #9a98b3);
    transition: color 0.15s ease, background 0.15s ease;
  }
  .close:hover { color: inherit; background: rgba(255, 255, 255, 0.07); }
  .close:focus-visible { outline: 2px solid var(--tone); }
  .bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    transform-origin: left;
    background: linear-gradient(90deg, var(--tone), transparent 140%);
    opacity: 0.9;
  }
`

const ICONS: Record<string, string> = {
  default:
    '<path pathLength="40" d="M8 2.4l1.5 4.1L13.6 8l-4.1 1.5L8 13.6 6.5 9.5 2.4 8l4.1-1.5z"/>',
  success: '<path pathLength="40" d="M3.4 8.6l3.2 3.2 6-7.4"/>',
  error: '<path pathLength="40" d="M8 3.4v5.4"/><path pathLength="40" d="M8 11.8v.8"/>',
}

export interface ToastOptions {
  variant?: 'default' | 'success' | 'error'
  duration?: number
  title?: string
}

/**
 * `<aurora-toaster>` — a glassmorphic toast stack. Toasts spring in with a
 * self-drawing variant icon, show their remaining time as an accent hairline
 * that pauses while hovered, and collapse smoothly out of the stack.
 * `show(message, { title, variant, duration })` on a placed element, or
 * `AuroraToaster.show(...)` for a shared auto-created one. Position with the
 * `position` attribute (four corners). Emits `aurora-dismiss`.
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
    const variant = options.variant ?? 'default'
    const toast = document.createElement('div')
    toast.className = `toast${variant !== 'default' ? ` ${variant}` : ''}`
    toast.setAttribute('role', 'status')

    const badge = document.createElement('span')
    badge.className = 'badge'
    badge.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true">${ICONS[variant] ?? ICONS['default']}</svg>`

    const content = document.createElement('span')
    content.className = 'content'
    if (options.title) {
      const title = document.createElement('span')
      title.className = 'title'
      title.textContent = options.title
      content.append(title)
    }
    const msg = document.createElement('span')
    msg.className = `msg${options.title ? '' : ' solo'}`
    msg.textContent = message
    content.append(msg)

    const close = document.createElement('button')
    close.className = 'close'
    close.setAttribute('aria-label', 'Dismiss notification')
    close.textContent = '✕'
    close.addEventListener('click', () => this.dismiss(toast))

    const bar = document.createElement('span')
    bar.className = 'bar'
    toast.append(badge, content, close, bar)
    this.root.append(toast)

    const reduce = prefersReducedMotion()
    if (!reduce) {
      gsap.fromTo(
        toast,
        { x: 70, opacity: 0, scale: 0.92 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
      )
      gsap.fromTo(
        badge.querySelectorAll('path'),
        { strokeDashoffset: 40 },
        { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out', delay: 0.2, stagger: 0.1 },
      )
    }

    const duration = options.duration ?? this.numberAttr('duration', 4600)
    if (duration > 0) {
      // The progress hairline IS the timer: pausing it pauses dismissal.
      const timer = gsap.fromTo(
        bar,
        { scaleX: 1 },
        {
          scaleX: 0,
          duration: duration / 1000,
          ease: 'none',
          onComplete: () => this.dismiss(toast),
        },
      )
      toast.addEventListener('pointerenter', () => timer.pause())
      toast.addEventListener('pointerleave', () => timer.play())
    } else {
      bar.style.display = 'none'
    }
    return toast
  }

  /** Animate a toast out and collapse it from the stack. */
  dismiss(toast: HTMLElement): void {
    if (!toast.isConnected || toast.dataset.leaving === '1') return
    toast.dataset.leaving = '1'
    gsap.killTweensOf(toast.querySelector('.bar'))
    const done = (): void => {
      toast.remove()
      this.dispatchEvent(new CustomEvent('aurora-dismiss'))
    }
    if (prefersReducedMotion()) {
      done()
      return
    }
    gsap
      .timeline()
      .to(toast, { x: 70, opacity: 0, scale: 0.95, duration: 0.28, ease: 'power2.in' })
      .to(toast, {
        height: 0,
        marginTop: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: done,
      })
  }
}

register('aurora-toaster', AuroraToaster)
