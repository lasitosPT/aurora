import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; min-width: 200px; }
  .box {
    all: unset; box-sizing: border-box; width: 100%; padding: 0.6rem 0.9rem; font: inherit;
    color: var(--aurora-fg, inherit);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease;
  }
  .box:hover, .box:focus { border-color: var(--aurora-accent, #6d5cff); }
  .box::placeholder { color: var(--aurora-muted, #9a98b3); }
  .listbox {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; max-height: 240px;
    overflow: auto; display: none; padding: 5px; z-index: var(--aurora-menu-z, 60);
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 11px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  }
  .opt { padding: 0.5rem 0.75rem; border-radius: 7px; cursor: pointer; }
  .opt.is-active { background: rgba(109, 92, 255, 0.16); }
  .opt mark { background: none; color: var(--aurora-accent, #6d5cff); }
  .none { padding: 0.6rem 0.75rem; color: var(--aurora-muted, #9a98b3); font-size: 0.9em; }
`

/**
 * `<aurora-autocomplete>` — a type-to-filter suggestion input. Suggestions come
 * from the `options` property (string[]) or child `<option>`s; matches are
 * highlighted, arrows + Enter select, Escape closes. Form-associated. Attrs:
 * `placeholder`, `name`, `min-chars` (default 1). Emits `aurora-change`.
 */
export class AuroraAutocomplete extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private input: HTMLInputElement | null = null
  private listbox: HTMLElement | null = null
  private opts: string[] = []
  private hits: string[] = []
  private activeIdx = -1

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get options(): string[] {
    return this.opts
  }

  set options(value: string[]) {
    this.opts = value ?? []
  }

  get value(): string {
    return this.input?.value ?? ''
  }

  set value(next: string) {
    if (this.input) this.input.value = next
    this.internals?.setFormValue(next)
  }

  connectedCallback(): void {
    this.opts = Array.from(this.querySelectorAll('option')).map((o) => o.textContent?.trim() ?? '')
    const ph = this.getAttribute('placeholder') ?? 'Type to search…'
    this.root.innerHTML = `<style>${STYLE}</style><input class="box" role="combobox" aria-autocomplete="list" aria-expanded="false" placeholder="${escapeHtml(ph)}" /><div class="listbox" role="listbox"></div>`
    this.input = this.root.querySelector('input')
    this.listbox = this.root.querySelector('.listbox')
    this.input?.addEventListener('input', () => this.update())
    this.input?.addEventListener('keydown', this.onKey)
    this.input?.addEventListener('blur', () => window.setTimeout(() => this.close(), 120))
  }

  private update(): void {
    if (!this.input || !this.listbox) return
    const q = this.input.value.trim().toLowerCase()
    this.internals?.setFormValue(this.input.value)
    if (q.length < this.numberAttr('min-chars', 1)) {
      this.close()
      return
    }
    this.hits = this.opts.filter((o) => o.toLowerCase().includes(q)).slice(0, 8)
    this.activeIdx = this.hits.length > 0 ? 0 : -1
    this.listbox.innerHTML =
      this.hits.length === 0
        ? '<div class="none">No matches.</div>'
        : this.hits
            .map((m, i) => {
              const at = m.toLowerCase().indexOf(q)
              const hl =
                escapeHtml(m.slice(0, at)) +
                '<mark>' +
                escapeHtml(m.slice(at, at + q.length)) +
                '</mark>' +
                escapeHtml(m.slice(at + q.length))
              return `<div class="opt${i === this.activeIdx ? ' is-active' : ''}" role="option" data-i="${i}">${hl}</div>`
            })
            .join('')
    this.listbox.querySelectorAll<HTMLElement>('.opt').forEach((el) => {
      el.addEventListener('pointerdown', () => this.choose(Number(el.dataset.i)))
    })
    if (this.listbox.style.display !== 'block') {
      this.listbox.style.display = 'block'
      this.input.setAttribute('aria-expanded', 'true')
      if (!prefersReducedMotion()) {
        gsap.fromTo(
          this.listbox,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' },
        )
      }
    }
  }

  private choose(i: number): void {
    const pick = this.hits[i]
    if (pick === undefined) return
    this.value = pick
    this.close()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: pick } }))
  }

  close(): void {
    if (this.listbox) this.listbox.style.display = 'none'
    this.input?.setAttribute('aria-expanded', 'false')
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    const n = this.hits.length
    if (event.key === 'Escape') {
      this.close()
      return
    }
    if (n === 0 || this.listbox?.style.display !== 'block') return
    if (event.key === 'ArrowDown') this.activeIdx = (this.activeIdx + 1) % n
    else if (event.key === 'ArrowUp') this.activeIdx = (this.activeIdx - 1 + n) % n
    else if (event.key === 'Enter') {
      event.preventDefault()
      this.choose(this.activeIdx)
      return
    } else return
    event.preventDefault()
    this.listbox?.querySelectorAll('.opt').forEach((el, i) => {
      el.classList.toggle('is-active', i === this.activeIdx)
    })
  }
}

register('aurora-autocomplete', AuroraAutocomplete)
