import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'
import './treeview'
import type { AuroraTreeview, TreeNode } from './treeview'

const STYLE = `
  :host { display: inline-block; position: relative; color: var(--aurora-fg, #ececf2); }
  .label {
    display: block; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); margin-bottom: 7px;
  }
  .field {
    all: unset; box-sizing: border-box; cursor: pointer; min-width: 230px;
    padding: 0.6rem 0.9rem; font: inherit;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 11px;
    transition: border-color 0.15s ease;
  }
  .field:focus-visible, :host([open]) .field { border-color: var(--aurora-accent, #6d5cff); outline: none; }
  .field .ph { color: var(--aurora-muted, #9a98b3); }
  .arrow { font-size: 0.72em; opacity: 0.6; transition: transform 0.18s ease; }
  :host([open]) .arrow { transform: rotate(180deg); }
  .panel {
    position: absolute; top: calc(100% + 7px); left: 0; min-width: 100%; max-height: 300px;
    overflow: auto; display: none; padding: 8px; z-index: var(--aurora-menu-z, 60);
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 12px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  }
  :host([open]) .panel { display: block; }
`

/**
 * `<aurora-dropdowntree>` — a select whose popup is a full
 * `<aurora-treeview>`: assign nested `items`, pick any node (branch or
 * leaf), Escape/outside close. Form-associated; emits `aurora-change` with
 * `{ value }`.
 */
export class AuroraDropdowntree extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private tree: AuroraTreeview | null = null
  private current = ''

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

  get items(): TreeNode[] {
    return this.tree?.items ?? []
  }

  set items(v: TreeNode[]) {
    if (this.tree) this.tree.items = v
  }

  get value(): string {
    return this.current
  }

  set value(v: string) {
    this.current = v
    this.sync()
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label">${escapeHtml(label)}</label>` : ''
    }<button class="field" part="field" aria-haspopup="tree" aria-expanded="false"><span class="text ph">${escapeHtml(
      this.getAttribute('placeholder') ?? 'Select…',
    )}</span><span class="arrow" aria-hidden="true">▾</span></button><div class="panel" part="panel"></div>`
    this.tree = document.createElement('aurora-treeview') as AuroraTreeview
    this.root.querySelector('.panel')?.appendChild(this.tree)
    this.tree.addEventListener('aurora-select', (e) => {
      const { value } = (e as CustomEvent<{ value: string }>).detail
      this.current = value
      this.sync()
      this.close()
      this.internals?.setFormValue(value)
      this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value } }))
    })
    const field = this.root.querySelector<HTMLButtonElement>('.field')
    field?.addEventListener('click', () => {
      if (this.hasAttribute('open')) this.close()
      else this.open()
    })
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        this.close()
        field?.focus()
      }
    })
    const initial = this.getAttribute('value')
    if (initial) this.current = initial
    this.sync()
  }

  open(): void {
    this.setAttribute('open', '')
    this.root.querySelector('.field')?.setAttribute('aria-expanded', 'true')
  }

  close(): void {
    this.removeAttribute('open')
    this.root.querySelector('.field')?.setAttribute('aria-expanded', 'false')
  }

  private sync(): void {
    const text = this.root.querySelector('.text')
    if (!text) return
    if (this.current) {
      text.textContent = this.current
      text.classList.remove('ph')
    } else {
      text.textContent = this.getAttribute('placeholder') ?? 'Select…'
      text.classList.add('ph')
    }
  }
}

register('aurora-dropdowntree', AuroraDropdowntree)
