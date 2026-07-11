import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; min-width: 180px; }
  .trigger {
    all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center;
    justify-content: space-between; gap: 10px; width: 100%; padding: 0.6rem 0.9rem;
    font: inherit; color: var(--aurora-fg, inherit);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease;
  }
  .trigger:hover, .trigger:focus-visible { border-color: var(--aurora-accent, #6d5cff); outline: none; }
  .trigger .placeholder { color: var(--aurora-muted, #9a98b3); }
  .chev { transition: transform 0.25s ease; flex: none; }
  :host([open]) .chev { transform: rotate(180deg); }
  .listbox {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; max-height: 240px;
    overflow: auto; display: none; padding: 5px; z-index: var(--aurora-menu-z, 60);
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 11px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
    will-change: transform, opacity;
  }
  .opt {
    padding: 0.5rem 0.75rem; border-radius: 7px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center; gap: 8px;
  }
  .opt.is-active { background: rgba(109, 92, 255, 0.16); }
  .opt[aria-selected='true']::after { content: '✓'; color: var(--aurora-accent, #6d5cff); }
`

/**
 * `<aurora-select name="...">` — an animated dropdown list (Kendo
 * DropDownList). Options come from child `<option value label>` elements or the
 * `options` property (`{ value, label }[]`). Form-associated via
 * ElementInternals; full keyboard flow (arrows, Home/End, Enter, Escape,
 * type-ahead on first letter); `value` property; `placeholder` attribute.
 * Emits `aurora-change` with `{ value }`.
 */
export class AuroraSelect extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private trigger: HTMLElement | null = null
  private listbox: HTMLElement | null = null
  private opts: { value: string; label: string }[] = []
  private current = ''
  private activeIdx = -1
  private isOpen = false
  private onDocDown: ((e: Event) => void) | null = null

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get options(): { value: string; label: string }[] {
    return this.opts
  }

  set options(value: { value: string; label: string }[]) {
    this.opts = value ?? []
    this.renderList()
  }

  get value(): string {
    return this.current
  }

  set value(next: string) {
    this.current = next
    this.internals?.setFormValue(next)
    this.renderList()
  }

  connectedCallback(): void {
    this.opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
    }))
    const ph = escapeHtml(this.getAttribute('placeholder') ?? 'Select…')
    this.root.innerHTML = `<style>${STYLE}</style><button class="trigger" part="trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false"><span class="label placeholder">${ph}</span><svg class="chev" width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden="true"><path d="M1 1.5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button><div class="listbox" part="listbox" role="listbox"></div>`
    this.trigger = this.root.querySelector('.trigger')
    this.listbox = this.root.querySelector('.listbox')
    this.current = this.getAttribute('value') ?? ''
    if (this.current) this.internals?.setFormValue(this.current)
    this.renderList()

    this.trigger?.addEventListener('click', () => this.toggle())
    this.trigger?.addEventListener('keydown', this.onKey)
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.contains(e.target as Node) && e.target !== this) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  private renderList(): void {
    if (!this.listbox || !this.trigger) return
    this.listbox.innerHTML = this.opts
      .map(
        (o, i) =>
          `<div class="opt${i === this.activeIdx ? ' is-active' : ''}" role="option" data-i="${i}" aria-selected="${o.value === this.current}">${escapeHtml(o.label)}</div>`,
      )
      .join('')
    this.listbox.querySelectorAll<HTMLElement>('.opt').forEach((el) => {
      el.addEventListener('click', () => this.choose(Number(el.dataset.i)))
      el.addEventListener('pointerover', () => {
        this.activeIdx = Number(el.dataset.i)
        this.renderList()
      })
    })
    const label = this.trigger.querySelector('.label')
    const found = this.opts.find((o) => o.value === this.current)
    if (label) {
      label.textContent = found?.label ?? this.getAttribute('placeholder') ?? 'Select…'
      label.classList.toggle('placeholder', !found)
    }
  }

  private choose(i: number): void {
    const opt = this.opts[i]
    if (!opt) return
    this.value = opt.value
    this.close()
    this.trigger?.focus()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: opt.value } }))
  }

  open(): void {
    if (this.isOpen || !this.listbox) return
    this.isOpen = true
    this.setAttribute('open', '')
    this.trigger?.setAttribute('aria-expanded', 'true')
    this.activeIdx = Math.max(
      this.opts.findIndex((o) => o.value === this.current),
      0,
    )
    this.renderList()
    this.listbox.style.display = 'block'
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        this.listbox,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' },
      )
    }
  }

  close(): void {
    if (!this.isOpen || !this.listbox) return
    this.isOpen = false
    this.removeAttribute('open')
    this.trigger?.setAttribute('aria-expanded', 'false')
    const done = (): void => {
      if (this.listbox) this.listbox.style.display = 'none'
    }
    if (prefersReducedMotion()) done()
    else
      gsap.to(this.listbox, {
        opacity: 0,
        y: -6,
        duration: 0.16,
        ease: 'power2.in',
        onComplete: done,
      })
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    const n = this.opts.length
    if (n === 0) return
    if (!this.isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      this.open()
      return
    }
    if (!this.isOpen) return
    if (event.key === 'ArrowDown') this.activeIdx = (this.activeIdx + 1) % n
    else if (event.key === 'ArrowUp') this.activeIdx = (this.activeIdx - 1 + n) % n
    else if (event.key === 'Home') this.activeIdx = 0
    else if (event.key === 'End') this.activeIdx = n - 1
    else if (event.key === 'Enter') {
      event.preventDefault()
      this.choose(this.activeIdx)
      return
    } else if (event.key === 'Escape') {
      event.preventDefault()
      this.close()
      return
    } else if (/^[a-z0-9]$/i.test(event.key)) {
      const idx = this.opts.findIndex((o) =>
        o.label.toLowerCase().startsWith(event.key.toLowerCase()),
      )
      if (idx >= 0) this.activeIdx = idx
    } else return
    event.preventDefault()
    this.renderList()
    this.listbox?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' })
  }
}

register('aurora-select', AuroraSelect)
