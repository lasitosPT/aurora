import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; }
  .track {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    width: var(--aurora-switch-width, 2.75rem);
    height: var(--aurora-switch-height, 1.5rem);
    padding: 2px;
    border-radius: 999px;
    background: var(--aurora-switch-off, rgba(128, 128, 128, 0.4));
    transition: background 0.25s ease;
  }
  :host([checked]) .track { background: var(--aurora-accent, #6d5cff); }
  .track:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .thumb {
    width: calc(var(--aurora-switch-height, 1.5rem) - 8px);
    height: calc(var(--aurora-switch-height, 1.5rem) - 8px);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    will-change: transform;
  }
  :host([disabled]) { opacity: 0.5; pointer-events: none; }
`

/**
 * `<aurora-switch checked name="...">` — an animated toggle. Form-associated:
 * submits its `value` (default `on`) when checked. Emits `change`.
 */
export class AuroraSwitch extends AuroraElement {
  static readonly formAssociated = true
  static readonly observedAttributes = ['checked']
  private track: HTMLElement | null = null
  private thumb: HTMLElement | null = null
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
    this.root.innerHTML = `<style>${STYLE}</style><button class="track" part="track" role="switch"><span class="thumb" part="thumb"></span></button>`
    this.track = this.root.querySelector('.track')
    this.thumb = this.root.querySelector('.thumb')
    if (this.hasAttribute('disabled')) this.track?.setAttribute('disabled', '')
    this.track?.addEventListener('click', this.toggle)
    this.reflect(false)
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'checked' && oldValue !== newValue && this.track) this.reflect(true)
  }

  get checked(): boolean {
    return this.hasAttribute('checked')
  }

  set checked(value: boolean) {
    if (value) this.setAttribute('checked', '')
    else this.removeAttribute('checked')
  }

  private readonly toggle = (): void => {
    if (this.hasAttribute('disabled')) return
    this.checked = !this.checked
  }

  private reflect(animate: boolean): void {
    const checked = this.checked
    this.track?.setAttribute('aria-checked', String(checked))
    const value = this.getAttribute('value') ?? 'on'
    this.internals?.setFormValue(checked ? value : null)

    if (this.thumb) {
      const distance = this.trackTravel()
      if (animate && !prefersReducedMotion()) {
        gsap.to(this.thumb, { x: checked ? distance : 0, duration: 0.25, ease: 'power2.out' })
      } else {
        gsap.set(this.thumb, { x: checked ? distance : 0 })
      }
    }
    if (animate) this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  }

  private trackTravel(): number {
    if (!this.track || !this.thumb) return 0
    return this.track.clientWidth - this.thumb.offsetWidth - 4
  }
}

register('aurora-switch', AuroraSwitch)
