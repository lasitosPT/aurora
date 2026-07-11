import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; min-width: 240px; }
  .trigger {
    box-sizing: border-box; cursor: pointer; display: flex; flex-wrap: wrap; align-items: center;
    gap: 6px; width: 100%; min-height: 2.6rem; padding: 0.35rem 0.6rem;
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease;
  }
  .trigger:hover, :host([open]) .trigger { border-color: var(--aurora-accent, #6d5cff); }
  .ph { color: var(--aurora-muted, #9a98b3); padding: 0 0.3rem; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px; font-size: 0.85em;
    padding: 3px 8px 3px 10px; border-radius: 999px;
    background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--aurora-accent, #6d5cff) 40%, transparent);
  }
  .chip button { all: unset; cursor: pointer; opacity: 0.7; padding: 0 2px; }
  .chip button:hover { opacity: 1; }
  .listbox {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; max-height: 240px;
    overflow: auto; display: none; padding: 5px; z-index: var(--aurora-menu-z, 60);
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 11px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  }
  .opt { display: flex; gap: 9px; align-items: center; padding: 0.5rem 0.7rem; border-radius: 7px; cursor: pointer; }
  .opt:hover { background: rgba(109, 92, 255, 0.12); }
  .opt input { accent-color: var(--aurora-accent, #6d5cff); pointer-events: none; }
`

/**
 * `<aurora-multiselect name="...">` — pick many: selections render as removable
 * chips, the popup is a checkbox list. Options from child `<option>`s or the
 * `options` property; `values` getter/setter (string[]); form-associated (one
 * FormData entry per value). Emits `aurora-change` with `{ values }`.
 */
export class AuroraMultiselect extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private opts: { value: string; label: string }[] = []
  private picked = new Set<string>()
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

  set options(v: { value: string; label: string }[]) {
    this.opts = v ?? []
    this.renderAll()
  }

  get values(): string[] {
    return [...this.picked]
  }

  set values(v: string[]) {
    this.picked = new Set(v)
    this.sync()
    this.renderAll()
  }

  connectedCallback(): void {
    this.opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
    }))
    this.root.innerHTML = `<style>${STYLE}</style><div class="trigger" part="trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" tabindex="0"></div><div class="listbox" part="listbox" role="listbox" aria-multiselectable="true"></div>`
    this.renderAll()
    const trigger = this.root.querySelector('.trigger')
    trigger?.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.chip')) this.toggle()
    })
    trigger?.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key
      if (k === 'Enter' || k === ' ' || k === 'ArrowDown') {
        e.preventDefault()
        this.open()
      } else if (k === 'Escape') this.close()
    })
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.contains(e.target as Node) && e.target !== this) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  private sync(): void {
    const name = this.getAttribute('name')
    if (this.internals && name) {
      const fd = new FormData()
      for (const v of this.picked) fd.append(name, v)
      this.internals.setFormValue(fd)
    }
  }

  private renderAll(): void {
    const trigger = this.root.querySelector('.trigger')
    const listbox = this.root.querySelector('.listbox')
    if (!trigger || !listbox) return
    const chips = this.opts.filter((o) => this.picked.has(o.value))
    trigger.innerHTML = chips.length
      ? chips
          .map(
            (o) =>
              `<span class="chip">${escapeHtml(o.label)}<button data-x="${escapeHtml(o.value)}" aria-label="Remove ${escapeHtml(o.label)}">✕</button></span>`,
          )
          .join('')
      : `<span class="ph">${escapeHtml(this.getAttribute('placeholder') ?? 'Select…')}</span>`
    trigger
      .querySelectorAll<HTMLElement>('[data-x]')
      .forEach((b) => b.addEventListener('click', () => this.toggleValue(b.dataset.x ?? '')))
    listbox.innerHTML = this.opts
      .map(
        (o) =>
          `<div class="opt" role="option" data-v="${escapeHtml(o.value)}" aria-selected="${this.picked.has(o.value)}"><input type="checkbox" tabindex="-1" ${this.picked.has(o.value) ? 'checked' : ''}/>${escapeHtml(o.label)}</div>`,
      )
      .join('')
    listbox
      .querySelectorAll<HTMLElement>('.opt')
      .forEach((el) => el.addEventListener('click', () => this.toggleValue(el.dataset.v ?? '')))
  }

  toggleValue(value: string): void {
    if (this.picked.has(value)) this.picked.delete(value)
    else this.picked.add(value)
    this.sync()
    this.renderAll()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { values: this.values } }))
  }

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.setAttribute('open', '')
    const lb = this.root.querySelector<HTMLElement>('.listbox')
    this.root.querySelector('.trigger')?.setAttribute('aria-expanded', 'true')
    if (lb) {
      lb.style.display = 'block'
      if (!prefersReducedMotion())
        gsap.fromTo(
          lb,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' },
        )
    }
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.removeAttribute('open')
    this.root.querySelector('.trigger')?.setAttribute('aria-expanded', 'false')
    const lb = this.root.querySelector<HTMLElement>('.listbox')
    if (lb) lb.style.display = 'none'
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }
}

register('aurora-multiselect', AuroraMultiselect)
