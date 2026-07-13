import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; width: 240px; position: relative; color: var(--aurora-fg, #ececf2); }
  .label {
    display: block; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); margin-bottom: 7px;
  }
  .field { position: relative; display: flex; align-items: center; }
  input {
    all: unset; box-sizing: border-box; width: 100%; padding: 0.6rem 2.2rem 0.6rem 0.9rem;
    font: inherit; background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 11px;
    transition: border-color 0.15s ease;
  }
  input:focus { border-color: var(--aurora-accent, #6d5cff); }
  .arrow {
    all: unset; position: absolute; right: 8px; cursor: pointer; padding: 4px;
    color: var(--aurora-muted, #9a98b3); font-size: 0.75em;
    transition: transform 0.18s ease, color 0.15s ease;
  }
  .arrow:hover { color: var(--aurora-fg, #ececf2); }
  :host([open]) .arrow { transform: rotate(180deg); }
  .panel {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; max-height: 240px;
    overflow: auto; display: none; flex-direction: column; padding: 5px;
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 11px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
    z-index: var(--aurora-menu-z, 60);
  }
  :host([open]) .panel { display: flex; }
  .panel button {
    all: unset; cursor: pointer; padding: 0.5rem 0.8rem; border-radius: 8px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .panel button:hover, .panel button.active { background: rgba(109, 92, 255, 0.14); }
  .panel mark { background: none; color: var(--aurora-accent2, #22d3ee); }
  .custom { color: var(--aurora-muted, #9a98b3); font-style: italic; }
`

/**
 * `<aurora-combobox allow-custom>` — a text input married to a dropdown:
 * type to filter the options (matches highlighted), pick with
 * arrows/Enter/click, or — with `allow-custom` — commit any free text as the
 * value. Options come from `<option>` children or the `options` property.
 * Form-associated; emits `aurora-change` with `{ value, custom }`.
 */
export class AuroraCombobox extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  #options: string[] = []
  private input: HTMLInputElement | null = null
  private activeIdx = -1

  constructor() {
    super()
    if ('attachInternals' in this) {
      try {
        this.internals = this.attachInternals()
      } catch {
        this.internals = null
      }
    }
  }

  get options(): string[] {
    return this.#options
  }

  set options(list: string[]) {
    this.#options = list
    this.renderList()
  }

  get value(): string {
    return this.input?.value ?? ''
  }

  set value(v: string) {
    if (this.input) this.input.value = v
    this.internals?.setFormValue(v)
  }

  connectedCallback(): void {
    this.#options = Array.from(this.querySelectorAll('option')).map(
      (o) => o.getAttribute('value') ?? o.textContent?.trim() ?? '',
    )
    const label = this.getAttribute('label') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label" part="label">${escapeHtml(label)}</label>` : ''
    }<div class="field"><input part="input" role="combobox" aria-expanded="false" aria-autocomplete="list" placeholder="${escapeHtml(
      this.getAttribute('placeholder') ?? '',
    )}"${label ? ` aria-label="${escapeHtml(label)}"` : ''}/><button class="arrow" part="arrow" aria-label="Toggle options" tabindex="-1">▾</button></div><div class="panel" part="panel" role="listbox"></div>`
    this.input = this.root.querySelector('input')
    if (this.getAttribute('value')) this.value = this.getAttribute('value') ?? ''
    this.wire()
    this.renderList()
  }

  open(): void {
    this.setAttribute('open', '')
    this.input?.setAttribute('aria-expanded', 'true')
    this.renderList()
  }

  close(): void {
    this.removeAttribute('open')
    this.input?.setAttribute('aria-expanded', 'false')
    this.activeIdx = -1
  }

  private hits(): string[] {
    const q = this.value.trim().toLowerCase()
    if (!q) return this.#options
    return this.#options.filter((o) => o.toLowerCase().includes(q))
  }

  private renderList(): void {
    const panel = this.root.querySelector('.panel')
    if (!panel) return
    const q = this.value.trim()
    const hits = this.hits()
    const rx = q ? new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig') : null
    let html = hits
      .map((o, i) => {
        const marked = rx ? escapeHtml(o).replace(rx, '<mark>$1</mark>') : escapeHtml(o)
        return `<button role="option" data-v="${escapeHtml(o)}" class="${i === this.activeIdx ? 'active' : ''}">${marked}</button>`
      })
      .join('')
    if (!hits.length && q && this.hasAttribute('allow-custom'))
      html = `<button role="option" data-v="${escapeHtml(q)}" class="custom${this.activeIdx === 0 ? ' active' : ''}">Use “${escapeHtml(q)}”</button>`
    panel.innerHTML = html || '<button disabled class="custom">No matches</button>'
    panel
      .querySelectorAll<HTMLButtonElement>('button[data-v]')
      .forEach((btn) => btn.addEventListener('click', () => this.commit(btn.dataset['v'] ?? '')))
  }

  private commit(v: string): void {
    const custom = !this.#options.includes(v)
    if (custom && !this.hasAttribute('allow-custom')) return
    this.value = v
    this.close()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: v, custom } }))
  }

  private wire(): void {
    this.root.querySelector('.arrow')?.addEventListener('click', () => {
      if (this.hasAttribute('open')) this.close()
      else {
        this.open()
        this.input?.focus()
      }
    })
    this.input?.addEventListener('input', () => {
      this.activeIdx = -1
      this.open()
      this.internals?.setFormValue(this.value)
    })
    this.input?.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (!this.root.activeElement) {
          if (this.hasAttribute('allow-custom') && this.value.trim()) {
            this.internals?.setFormValue(this.value)
          }
          this.close()
        }
      }, 120)
    })
    this.input?.addEventListener('keydown', (e) => {
      const visible = this.hits()
      const count =
        visible.length || (this.value.trim() && this.hasAttribute('allow-custom') ? 1 : 0)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!this.hasAttribute('open')) this.open()
        if (!count) return
        this.activeIdx =
          e.key === 'ArrowDown'
            ? (this.activeIdx + 1) % count
            : (this.activeIdx + count - 1 + count) % count
        this.renderList()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (this.activeIdx >= 0 && visible.length) this.commit(visible[this.activeIdx] ?? '')
        else if (this.activeIdx === 0 || !visible.length || this.hasAttribute('allow-custom'))
          this.commit(this.value.trim())
        else if (visible.length === 1) this.commit(visible[0] ?? '')
      } else if (e.key === 'Escape') {
        this.close()
      }
    })
  }
}

register('aurora-combobox', AuroraCombobox)
