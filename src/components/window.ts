import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { FOCUSABLE, trapTab } from '../core/focus'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: contents; }
  .win {
    position: fixed; display: none; flex-direction: column; min-width: 260px;
    width: var(--aurora-window-width, 400px); max-width: 92vw; max-height: 80vh;
    background: var(--aurora-surface, #16161f); color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 14px; box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55);
    z-index: var(--aurora-window-z, 900); will-change: transform, opacity;
  }
  .bar {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 0.65rem 0.9rem 0.65rem 1.1rem; cursor: grab; user-select: none;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
    font-weight: 600; touch-action: none;
  }
  .bar.is-drag { cursor: grabbing; }
  .x { all: unset; cursor: pointer; padding: 2px 8px; border-radius: 7px; color: var(--aurora-muted, #9a98b3); }
  .x:hover { color: inherit; background: rgba(255, 255, 255, 0.07); }
  .x:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .body { padding: 1.1rem; overflow: auto; }
`

let topZ = 0

/**
 * `<aurora-window title="Inspector">` — a floating, draggable window: grab the
 * title bar to move (clamped to the viewport), click anywhere to bring to
 * front, Escape or ✕ closes, Tab is trapped and focus returns to the opener.
 * `open` attribute or `show()`/`hide()`. Emits `aurora-open`/`aurora-close`.
 */
export class AuroraWindow extends AuroraElement {
  static readonly observedAttributes = ['open']
  private win: HTMLElement | null = null
  private visible = false
  private previouslyFocused: Element | null = null

  connectedCallback(): void {
    const title = escapeHtml(this.getAttribute('title') ?? 'Window')
    this.root.innerHTML = `<style>${STYLE}</style><div class="win" part="window" role="dialog" aria-label="${title}" tabindex="-1"><div class="bar" part="bar"><span>${title}</span><button class="x" aria-label="Close window">✕</button></div><div class="body" part="body"><slot></slot></div></div>`
    this.win = this.root.querySelector('.win')
    this.root.querySelector('.x')?.addEventListener('click', () => this.hide())
    this.win?.addEventListener('pointerdown', () => {
      if (this.win) this.win.style.zIndex = String(++topZ + 900)
    })
    document.addEventListener('keydown', this.onKey)

    const bar = this.root.querySelector<HTMLElement>('.bar')
    bar?.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.x') || !this.win) return
      bar.classList.add('is-drag')
      bar.setPointerCapture(e.pointerId)
      const rect = this.win.getBoundingClientRect()
      const ox = e.clientX - rect.left
      const oy = e.clientY - rect.top
      const onMove = (move: PointerEvent): void => {
        if (!this.win) return
        this.win.style.left = `${clamp(move.clientX - ox, 8, window.innerWidth - rect.width - 8)}px`
        this.win.style.top = `${clamp(move.clientY - oy, 8, window.innerHeight - 60)}px`
      }
      const onUp = (): void => {
        bar.classList.remove('is-drag')
        bar.removeEventListener('pointermove', onMove)
        bar.removeEventListener('pointerup', onUp)
      }
      bar.addEventListener('pointermove', onMove)
      bar.addEventListener('pointerup', onUp)
    })
    if (this.hasAttribute('open')) this.open()
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.onKey)
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name !== 'open' || oldValue === newValue || !this.win) return
    if (newValue !== null) this.open()
    else this.close()
  }

  show(): void {
    this.setAttribute('open', '')
  }

  hide(): void {
    this.removeAttribute('open')
  }

  private open(): void {
    if (this.visible || !this.win) return
    this.visible = true
    this.previouslyFocused = document.activeElement
    this.win.style.display = 'flex'
    if (!this.win.style.left) {
      this.win.style.left = `${Math.max((window.innerWidth - 400) / 2, 8)}px`
      this.win.style.top = '90px'
    }
    this.win.style.zIndex = String(++topZ + 900)
    const first = this.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? this.win).focus()
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        this.win,
        { opacity: 0, y: 18, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' },
      )
    }
    this.dispatchEvent(new CustomEvent('aurora-open'))
  }

  private close(): void {
    if (!this.visible || !this.win) return
    this.visible = false
    const previous = this.previouslyFocused
    this.previouslyFocused = null
    if (previous instanceof HTMLElement) previous.focus()
    const done = (): void => {
      if (this.win) this.win.style.display = 'none'
      this.dispatchEvent(new CustomEvent('aurora-close'))
    }
    if (prefersReducedMotion()) done()
    else
      gsap.to(this.win, {
        opacity: 0,
        y: 12,
        scale: 0.98,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: done,
      })
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!this.hasAttribute('open')) return
    if (event.key === 'Escape') {
      this.hide()
      return
    }
    if (event.key !== 'Tab') return
    trapTab(this, event, this.win)
  }
}

register('aurora-window', AuroraWindow)
