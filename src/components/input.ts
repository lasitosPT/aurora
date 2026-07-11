import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; }
  .label { display: block; font-size: 0.8rem; margin-bottom: 0.35rem; color: var(--aurora-muted, #888); }
  .field { position: relative; }
  .control {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
    color: var(--aurora-fg, inherit);
    background: var(--aurora-input-bg, transparent);
    border: none;
    border-bottom: 2px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    padding: 0.5rem 0.25rem;
    outline: none;
  }
  .control::placeholder { color: var(--aurora-muted, #999); }
  .underline {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2px;
    width: 100%;
    background: var(--aurora-accent, #6d5cff);
    transform: scaleX(0);
    transform-origin: left;
    will-change: transform;
  }
  :host([disabled]) { opacity: 0.6; }
`

/**
 * `<aurora-input label="..." name="...">` — a text field with an animated focus
 * underline. Form-associated: its value submits with the surrounding `<form>`.
 * Re-emits `input` and `change` across the shadow boundary.
 */
export class AuroraInput extends AuroraElement {
  static readonly formAssociated = true
  private input: HTMLInputElement | null = null
  private underline: HTMLElement | null = null
  private internals: ElementInternals | null = null

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

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    const value = this.getAttribute('value') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label" part="label">${escapeHtml(label)}</label>` : ''
    }<div class="field"><input class="control" part="input" /><span class="underline" part="underline"></span></div>`

    this.input = this.root.querySelector('input')
    this.underline = this.root.querySelector('.underline')
    if (this.input) {
      this.input.type = this.getAttribute('type') ?? 'text'
      this.input.placeholder = this.getAttribute('placeholder') ?? ''
      this.input.value = value
      this.input.disabled = this.hasAttribute('disabled')
      this.input.addEventListener('input', this.onInput)
      this.input.addEventListener('change', this.onChange)
      this.input.addEventListener('focus', this.onFocus)
      this.input.addEventListener('blur', this.onBlur)
    }
    this.internals?.setFormValue(value)
  }

  get value(): string {
    return this.input?.value ?? this.getAttribute('value') ?? ''
  }

  set value(next: string) {
    if (this.input) this.input.value = next
    this.internals?.setFormValue(next)
  }

  override focus(): void {
    this.input?.focus()
  }

  private readonly onInput = (): void => {
    const value = this.input?.value ?? ''
    this.internals?.setFormValue(value)
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  }

  private readonly onChange = (): void => {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  }

  private readonly onFocus = (): void => {
    if (!this.underline || prefersReducedMotion()) return
    gsap.fromTo(this.underline, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power3.out' })
  }

  private readonly onBlur = (): void => {
    if (!this.underline || prefersReducedMotion()) return
    gsap.to(this.underline, { scaleX: 0, duration: 0.25, ease: 'power2.in' })
  }
}

register('aurora-input', AuroraInput)
