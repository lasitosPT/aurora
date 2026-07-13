import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; cursor: pointer; color: var(--aurora-fg, #ececf2); }
  :host([disabled]) { opacity: 0.45; cursor: default; pointer-events: none; }
  .row { display: inline-flex; align-items: center; gap: 10px; }
  .box {
    all: unset; width: 20px; height: 20px; border-radius: 6px; box-sizing: border-box;
    border: 1.5px solid var(--aurora-border, rgba(128, 128, 128, 0.55));
    display: inline-grid; place-items: center; cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    background: var(--aurora-field, rgba(255, 255, 255, 0.04));
  }
  .box:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  :host([checked]) .box, :host([indeterminate]) .box {
    background: var(--aurora-accent, #6d5cff);
    border-color: var(--aurora-accent, #6d5cff);
  }
  svg { width: 13px; height: 13px; display: block; }
  path {
    fill: none; stroke: #fff; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round;
    stroke-dasharray: 24; stroke-dashoffset: 24;
  }
  :host([checked]) path.check { stroke-dashoffset: 0; }
  :host([indeterminate]) path.dash { stroke-dashoffset: 0; }
  .label { font-size: 0.95rem; user-select: none; }
`

/**
 * `<aurora-checkbox checked label="…">` — a form-associated checkbox with a
 * drawn-on check, an `indeterminate` state, Space toggling, and
 * `aurora-change`. The `checked` attribute is the source of truth.
 */
export class AuroraCheckbox extends AuroraElement {
  static readonly formAssociated = true
  static readonly observedAttributes = ['checked']
  private internals: ElementInternals | null = null
  private ready = false

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

  get checked(): boolean {
    return this.hasAttribute('checked')
  }

  set checked(v: boolean) {
    if (v) this.setAttribute('checked', '')
    else this.removeAttribute('checked')
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style><span class="row"><button class="box" part="box" role="checkbox" aria-checked="${
      this.hasAttribute('indeterminate') ? 'mixed' : String(this.checked)
    }"${label ? ` aria-label="${escapeHtml(label)}"` : ''}><svg viewBox="0 0 16 16" aria-hidden="true"><path class="check" d="M3 8.5 6.5 12 13 4.5"/><path class="dash" d="M4 8h8"/></svg></button>${
      label ? `<span class="label" part="label">${escapeHtml(label)}</span>` : '<slot></slot>'
    }</span>`
    this.addEventListener('click', () => this.toggle())
    this.root.querySelector('.box')?.addEventListener('click', (e) => e.stopPropagation())
    this.root.querySelector('.box')?.addEventListener('click', () => this.toggle())
    this.sync()
    this.ready = true
  }

  attributeChangedCallback(): void {
    if (this.ready) this.sync()
  }

  toggle(): void {
    if (this.hasAttribute('disabled')) return
    this.removeAttribute('indeterminate')
    this.checked = !this.checked
    if (!prefersReducedMotion()) {
      const box = this.root.querySelector('.box')
      if (box) gsap.fromTo(box, { scale: 0.85 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' })
    }
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { checked: this.checked } }))
  }

  private sync(): void {
    const box = this.root.querySelector('.box')
    box?.setAttribute(
      'aria-checked',
      this.hasAttribute('indeterminate') ? 'mixed' : String(this.checked),
    )
    this.internals?.setFormValue(this.checked ? (this.getAttribute('value') ?? 'on') : null)
  }
}

register('aurora-checkbox', AuroraCheckbox)
