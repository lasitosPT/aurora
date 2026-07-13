import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: none; }
  .panel {
    position: fixed; z-index: var(--aurora-menu-z, 70); min-width: 170px;
    display: none; flex-direction: column; padding: 5px;
    background: var(--aurora-surface, #16161f); color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 12px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
    font-size: 0.92rem;
  }
  button {
    all: unset; cursor: pointer; display: flex; align-items: center; gap: 9px;
    padding: 0.5rem 0.8rem; border-radius: 8px; white-space: nowrap;
  }
  button:hover, button:focus-visible { background: rgba(109, 92, 255, 0.14); }
  button[disabled] { opacity: 0.4; cursor: default; }
  button[disabled]:hover { background: none; }
  .sep { height: 1px; margin: 5px 8px; background: var(--aurora-border, rgba(255, 255, 255, 0.1)); }
  .icon { width: 1.1em; text-align: center; }
`

/**
 * `<aurora-contextmenu for="targetId">` — a right-click menu. Items come from
 * child `<option value icon>` elements (`<hr>` for separators); the menu
 * opens at the cursor (clamped to the viewport), navigates with arrows, and
 * closes on Escape, outside click, or selection. Emits `aurora-select` with
 * `{ value, context }` where context is the right-clicked element.
 */
export class AuroraContextmenu extends AuroraElement {
  private isOpen = false
  private context: EventTarget | null = null
  private onDocDown: ((e: Event) => void) | null = null
  private onCtx: ((e: MouseEvent) => void) | null = null

  connectedCallback(): void {
    const items = Array.from(this.children).map((child) => {
      if (child.tagName === 'HR') return '<div class="sep" role="separator"></div>'
      const value = child.getAttribute('value') ?? child.textContent?.trim() ?? ''
      const icon = child.getAttribute('icon')
      const disabled = child.hasAttribute('disabled') ? ' disabled' : ''
      return `<button role="menuitem" data-v="${escapeHtml(value)}"${disabled}>${
        icon ? `<span class="icon">${escapeHtml(icon)}</span>` : ''
      }${escapeHtml(child.textContent?.trim() ?? '')}</button>`
    })
    this.root.innerHTML = `<style>${STYLE}</style><div class="panel" part="panel" role="menu">${items.join('')}</div>`
    const targetId = this.getAttribute('for')
    const target = targetId ? document.getElementById(targetId) : this.parentElement
    this.onCtx = (e: MouseEvent): void => {
      e.preventDefault()
      this.openAt(e.clientX, e.clientY, e.target)
    }
    target?.addEventListener('contextmenu', this.onCtx as EventListener)
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.root.contains(e.target as Node)) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach((btn) =>
      btn.addEventListener('click', () => {
        if (btn.disabled) return
        const value = btn.dataset['v']
        const context = this.context
        this.close()
        this.dispatchEvent(new CustomEvent('aurora-select', { detail: { value, context } }))
      }),
    )
    this.root.querySelector('.panel')?.addEventListener('keydown', (e) => {
      const key = (e as KeyboardEvent).key
      if (key === 'Escape') {
        this.close()
        return
      }
      if (key !== 'ArrowDown' && key !== 'ArrowUp') return
      e.preventDefault()
      const buttons = Array.from(
        this.root.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
      )
      const idx = buttons.indexOf(this.root.activeElement as HTMLButtonElement)
      const next = buttons[(idx + (key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]
      next?.focus()
    })
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  openAt(x: number, y: number, context: EventTarget | null = null): void {
    const panel = this.root.querySelector<HTMLElement>('.panel')
    if (!panel) return
    this.context = context
    this.isOpen = true
    panel.style.display = 'flex'
    const w = panel.offsetWidth
    const h = panel.offsetHeight
    const vw = window.innerWidth || 1200
    const vh = window.innerHeight || 800
    panel.style.left = `${Math.min(x, vw - w - 8)}px`
    panel.style.top = `${Math.min(y, vh - h - 8)}px`
    if (!prefersReducedMotion())
      gsap.fromTo(
        panel,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.18, ease: 'power3.out' },
      )
    panel.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    const panel = this.root.querySelector<HTMLElement>('.panel')
    if (panel) panel.style.display = 'none'
  }
}

register('aurora-contextmenu', AuroraContextmenu)
