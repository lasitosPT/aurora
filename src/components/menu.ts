import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import './submenu'
import type { AuroraSubmenu } from './submenu'

const STYLE = `
  :host { display: inline-block; position: relative; }
  .trigger {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 0.6rem 1.1rem;
    font: inherit;
    color: var(--aurora-fg, inherit);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem);
    transition: border-color 0.2s ease;
  }
  .trigger:hover { border-color: var(--aurora-accent, #6d5cff); }
  .trigger:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .chev { transition: transform 0.25s ease; }
  :host([open]) .chev { transform: rotate(180deg); }
  .panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    min-width: max(100%, 190px);
    display: none;
    flex-direction: column;
    padding: 6px;
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
    z-index: var(--aurora-menu-z, 60);
    transform-origin: top left;
    will-change: transform, opacity;
  }
  :host([align='end']) .panel { left: auto; right: 0; transform-origin: top right; }
  ::slotted(button) {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: block;
    width: 100%;
    padding: 0.55rem 0.8rem;
    border-radius: 8px;
    font: inherit;
    color: var(--aurora-fg, inherit);
  }
  ::slotted(button:hover),
  ::slotted(button:focus-visible) {
    background: rgba(255, 255, 255, 0.06);
    outline: none;
  }
  ::slotted(hr) {
    border: none;
    border-top: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    margin: 6px 4px;
  }
`

/**
 * `<aurora-menu label="Options">` — an animated, accessible dropdown. Items are
 * child `<button>`s (use `data-value`; `<hr>` for separators) and
 * `<aurora-submenu>` flyouts. Arrow keys rove,
 * Home/End jump, Escape closes and restores focus, outside clicks close.
 * Emits `aurora-select` with `{ value }`. `align="end"` right-aligns the panel.
 */
export class AuroraMenu extends AuroraElement {
  private trigger: HTMLButtonElement | null = null
  private panel: HTMLElement | null = null
  private isOpen = false
  private onDocDown: ((event: Event) => void) | null = null

  connectedCallback(): void {
    const label = escapeHtml(this.getAttribute('label') ?? 'Menu')
    this.root.innerHTML = `<style>${STYLE}</style><button class="trigger" part="trigger" aria-haspopup="menu" aria-expanded="false">${label}<svg class="chev" width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden="true"><path d="M1 1.5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button><div class="panel" part="panel" role="menu"><slot></slot></div>`
    this.trigger = this.root.querySelector('.trigger')
    this.panel = this.root.querySelector('.panel')

    this.trigger?.addEventListener('click', () => this.toggle())
    this.trigger?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.open()
        this.items()[0]?.focus()
      }
    })
    this.addEventListener('keydown', this.onKey)
    this.addEventListener('click', this.onItemClick)

    this.onDocDown = (event: Event): void => {
      if (this.isOpen && !this.contains(event.target as Node) && event.target !== this) {
        this.close()
      }
    }
    document.addEventListener('pointerdown', this.onDocDown)
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  private items(): HTMLElement[] {
    return Array.from(
      this.querySelectorAll<HTMLElement>(':scope > button, :scope > aurora-submenu'),
    )
  }

  open(): void {
    if (this.isOpen || !this.panel) return
    this.isOpen = true
    this.setAttribute('open', '')
    this.trigger?.setAttribute('aria-expanded', 'true')
    this.items().forEach((item) => {
      item.setAttribute('role', 'menuitem')
      item.tabIndex = -1
    })
    this.panel.style.display = 'flex'
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        this.panel,
        { opacity: 0, y: -8, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power3.out' },
      )
    }
    this.dispatchEvent(new CustomEvent('aurora-open'))
  }

  close(restoreFocus = false): void {
    if (!this.isOpen || !this.panel) return
    this.isOpen = false
    this.removeAttribute('open')
    this.trigger?.setAttribute('aria-expanded', 'false')
    const done = (): void => {
      if (this.panel) this.panel.style.display = 'none'
    }
    if (prefersReducedMotion()) done()
    else
      gsap.to(this.panel, {
        opacity: 0,
        y: -6,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: done,
      })
    if (restoreFocus) this.trigger?.focus()
    this.dispatchEvent(new CustomEvent('aurora-close'))
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }

  private readonly onItemClick = (event: Event): void => {
    const item = (event.target as Element | null)?.closest?.('button')
    if (!item || item.closest('aurora-menu') !== this) return
    const value = item.getAttribute('data-value') ?? item.textContent?.trim() ?? ''
    this.dispatchEvent(new CustomEvent('aurora-select', { detail: { value } }))
    this.querySelectorAll<AuroraSubmenu>(':scope > aurora-submenu').forEach((sub) => sub.close())
    this.close(true)
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!this.isOpen) return
    if ((event.target as Element | null)?.closest?.('aurora-submenu') && event.key !== 'Escape')
      return
    const items = this.items()
    if (items.length === 0) return
    const current = items.findIndex((item) => item === document.activeElement)
    let next: number | null = null
    if (event.key === 'ArrowDown') next = (current + 1) % items.length
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else if (event.key === 'Escape') {
      event.preventDefault()
      this.close(true)
      return
    } else if (event.key === 'Tab') {
      this.close()
      return
    }
    if (next === null) return
    event.preventDefault()
    items[next]?.focus()
  }
}

register('aurora-menu', AuroraMenu)
