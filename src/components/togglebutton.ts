import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; }
  button {
    all: unset; box-sizing: border-box; cursor: pointer; padding: 0.55rem 1.05rem; font: inherit;
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem);
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }
  button:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  :host([pressed]) button {
    color: #fff; background: var(--aurora-accent, #6d5cff); border-color: var(--aurora-accent, #6d5cff);
  }
`

/**
 * `<aurora-togglebutton pressed>Bold</aurora-togglebutton>` — a two-state
 * button: the `pressed` attribute is the source of truth, clicks and Space
 * flip it with a pop, `aria-pressed` tracks. Form-associated (submits
 * `value` while pressed); emits `aurora-change` with `{ pressed }`.
 */
export class AuroraTogglebutton extends AuroraElement {
  static readonly formAssociated = true
  static readonly observedAttributes = ['pressed']
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

  get pressed(): boolean {
    return this.hasAttribute('pressed')
  }

  set pressed(v: boolean) {
    if (v) this.setAttribute('pressed', '')
    else this.removeAttribute('pressed')
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><button part="button" aria-pressed="${this.pressed}"><slot></slot></button>`
    this.root.querySelector('button')?.addEventListener('click', () => this.toggle())
    this.sync()
    this.ready = true
  }

  attributeChangedCallback(): void {
    if (this.ready) this.sync()
  }

  toggle(): void {
    if (this.hasAttribute('disabled')) return
    this.pressed = !this.pressed
    const btn = this.root.querySelector('button')
    if (btn && !prefersReducedMotion())
      gsap.fromTo(btn, { scale: 0.93 }, { scale: 1, duration: 0.22, ease: 'back.out(2.5)' })
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { pressed: this.pressed } }))
  }

  private sync(): void {
    this.root.querySelector('button')?.setAttribute('aria-pressed', String(this.pressed))
    this.internals?.setFormValue(this.pressed ? (this.getAttribute('value') ?? 'on') : null)
  }
}

register('aurora-togglebutton', AuroraTogglebutton)
