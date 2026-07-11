import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: contents; }
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--aurora-command-z, 1250);
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding: 12vh 16px 16px;
    background: rgba(4, 4, 9, 0.55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .panel {
    width: min(92vw, 560px);
    border-radius: 16px;
    overflow: hidden;
    background: var(--aurora-surface, #14141f);
    color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55);
    will-change: transform, opacity;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 15px 17px;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
  }
  .search svg {
    width: 15px;
    height: 15px;
    flex: none;
    fill: none;
    stroke: var(--aurora-muted, #9a98b3);
    stroke-width: 1.6;
    stroke-linecap: round;
  }
  input {
    all: unset;
    flex: 1;
    font: inherit;
    color: inherit;
  }
  input::placeholder { color: var(--aurora-muted, #9a98b3); }
  .list {
    max-height: 320px;
    overflow: auto;
    padding: 7px;
  }
  ::slotted(button) {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 0.62rem 0.8rem;
    border-radius: 9px;
    font: inherit;
    color: var(--aurora-fg, #ececf2);
    cursor: pointer;
  }
  ::slotted(button.aurora-active) { background: rgba(109, 92, 255, 0.16); }
  ::slotted(button[hidden]) { display: none; }
  .empty {
    display: none;
    padding: 20px 17px;
    color: var(--aurora-muted, #9a98b3);
    font-size: 0.9rem;
  }
  .hints {
    display: flex;
    gap: 16px;
    padding: 10px 17px;
    border-top: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
    color: var(--aurora-muted, #9a98b3);
    font-size: 0.72rem;
  }
  .hints kbd {
    font-family: inherit;
    padding: 1px 6px;
    margin-right: 5px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.04);
  }
`

/**
 * `<aurora-command>` — a ⌘K command palette. Items are child `<button>`s
 * (`data-value` for the emitted value, `data-keywords` for extra search terms).
 * Opens on Cmd/Ctrl+K (`hotkey` attribute; `hotkey="none"` to disable) or via
 * `show()`. Type to filter, arrows to move, Enter to run, Escape to close;
 * focus returns to where it was. Emits `aurora-select` with `{ value }`.
 */
export class AuroraCommand extends AuroraElement {
  private overlay: HTMLElement | null = null
  private panel: HTMLElement | null = null
  private input: HTMLInputElement | null = null
  private empty: HTMLElement | null = null
  private active: HTMLButtonElement | null = null
  private isOpen = false
  private previouslyFocused: Element | null = null
  private onGlobalKey: ((event: KeyboardEvent) => void) | null = null

  connectedCallback(): void {
    const placeholder = this.getAttribute('placeholder') ?? 'Type a command…'
    this.root.innerHTML = `<style>${STYLE}</style><div class="overlay" part="overlay"><div class="panel" part="panel" role="dialog" aria-modal="true" aria-label="Command palette"><div class="search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.4"/><path d="M10.4 10.4L14 14"/></svg><input type="text" aria-label="Search commands" placeholder="${placeholder}" /></div><div class="list" role="listbox"><slot></slot><div class="empty">No matching commands.</div></div><div class="hints" aria-hidden="true"><span><kbd>↑↓</kbd>navigate</span><span><kbd>↵</kbd>run</span><span><kbd>esc</kbd>close</span></div></div></div>`
    this.overlay = this.root.querySelector('.overlay')
    this.panel = this.root.querySelector('.panel')
    this.input = this.root.querySelector('input')
    this.empty = this.root.querySelector('.empty')

    this.input?.addEventListener('input', () => this.filter())
    this.input?.addEventListener('keydown', this.onInputKey)
    this.overlay?.addEventListener('pointerdown', (event) => {
      if (event.target === this.overlay) this.hide()
    })
    this.addEventListener('click', (event) => {
      const item = (event.target as Element | null)?.closest?.('button')
      if (item && this.items().includes(item as HTMLButtonElement)) {
        this.select(item as HTMLButtonElement)
      }
    })
    this.addEventListener('pointerover', (event) => {
      const item = (event.target as Element | null)?.closest?.('button')
      if (item && this.items().includes(item as HTMLButtonElement)) {
        this.setActive(item as HTMLButtonElement)
      }
    })

    const hotkey = (this.getAttribute('hotkey') ?? 'k').toLowerCase()
    if (hotkey !== 'none') {
      this.onGlobalKey = (event: KeyboardEvent): void => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === hotkey) {
          event.preventDefault()
          this.toggle()
        } else if (event.key === 'Escape' && this.isOpen) {
          this.hide()
        }
      }
      window.addEventListener('keydown', this.onGlobalKey)
    }
  }

  disconnectedCallback(): void {
    if (this.onGlobalKey) window.removeEventListener('keydown', this.onGlobalKey)
  }

  private items(): HTMLButtonElement[] {
    return Array.from(this.querySelectorAll<HTMLButtonElement>(':scope > button'))
  }

  private visible(): HTMLButtonElement[] {
    return this.items().filter((item) => !item.hidden)
  }

  show(): void {
    if (this.isOpen || !this.overlay || !this.panel) return
    this.isOpen = true
    this.previouslyFocused = document.activeElement
    this.items().forEach((item) => item.setAttribute('role', 'option'))
    if (this.input) this.input.value = ''
    this.filter()
    this.overlay.style.display = 'flex'
    this.input?.focus()
    if (!prefersReducedMotion()) {
      gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' })
      gsap.fromTo(
        this.panel,
        { opacity: 0, y: 14, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' },
      )
    }
    this.dispatchEvent(new CustomEvent('aurora-open'))
  }

  hide(): void {
    if (!this.isOpen || !this.overlay) return
    this.isOpen = false
    const done = (): void => {
      if (this.overlay) this.overlay.style.display = 'none'
    }
    if (prefersReducedMotion()) done()
    else gsap.to(this.overlay, { opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: done })
    const previous = this.previouslyFocused
    this.previouslyFocused = null
    if (previous instanceof HTMLElement) previous.focus()
    this.dispatchEvent(new CustomEvent('aurora-close'))
  }

  toggle(): void {
    if (this.isOpen) this.hide()
    else this.show()
  }

  private filter(): void {
    const query = (this.input?.value ?? '').trim().toLowerCase()
    for (const item of this.items()) {
      const haystack =
        `${item.textContent ?? ''} ${item.getAttribute('data-keywords') ?? ''}`.toLowerCase()
      item.hidden = query.length > 0 && !haystack.includes(query)
    }
    const first = this.visible()[0] ?? null
    this.setActive(first)
    if (this.empty) this.empty.style.display = first ? 'none' : 'block'
  }

  private setActive(item: HTMLButtonElement | null): void {
    this.active = item
    for (const candidate of this.items()) {
      const on = candidate === item
      candidate.classList.toggle('aurora-active', on)
      candidate.setAttribute('aria-selected', String(on))
    }
    item?.scrollIntoView({ block: 'nearest' })
  }

  private select(item: HTMLButtonElement): void {
    const value = item.getAttribute('data-value') ?? item.textContent?.trim() ?? ''
    this.hide()
    this.dispatchEvent(new CustomEvent('aurora-select', { detail: { value } }))
  }

  private readonly onInputKey = (event: KeyboardEvent): void => {
    const visible = this.visible()
    if (visible.length === 0) return
    const current = this.active ? visible.indexOf(this.active) : -1
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.setActive(visible[(current + 1) % visible.length] ?? null)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.setActive(visible[(current - 1 + visible.length) % visible.length] ?? null)
    } else if (event.key === 'Enter' && this.active) {
      event.preventDefault()
      this.select(this.active)
    }
  }
}

register('aurora-command', AuroraCommand)
