import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; }
  .toggle {
    all: unset; cursor: pointer; width: 40px; height: 40px; display: none;
    place-items: center; border-radius: 10px; font-size: 1.1rem;
    color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
  }
  .toggle:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .backdrop { display: none; position: fixed; inset: 0; background: rgba(6, 6, 12, 0.55); z-index: var(--aurora-modal-z, 80); }
  :host([narrow]) .toggle { display: grid; }
  :host([narrow]) .panel {
    position: fixed; top: 0; bottom: 0; left: 0; width: min(300px, 84vw);
    transform: translateX(-102%); z-index: calc(var(--aurora-modal-z, 80) + 1);
    background: var(--aurora-surface, #14141f); padding: 20px; overflow-y: auto;
    border-right: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    transition: transform 0.3s ease;
  }
  :host([narrow][open]) .panel { transform: translateX(0); }
  :host([narrow][open]) .backdrop { display: block; }
`

/**
 * `<aurora-responsivepanel breakpoint="768">` — content that lives inline on
 * wide screens and collapses into an off-canvas panel behind a ☰ button
 * below the breakpoint. Emits `aurora-open`/`aurora-close`.
 */
export class AuroraResponsivepanel extends AuroraElement {
  private mq: MediaQueryList | null = null
  private onMq: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style>
      <button class="toggle" part="toggle" aria-label="${escapeHtml(this.getAttribute('label') ?? 'Open panel')}" aria-expanded="false">☰</button>
      <div class="backdrop" part="backdrop"></div>
      <div class="panel" part="panel"><slot></slot></div>`
    const bp = this.numberAttr('breakpoint', 768)
    this.mq = window.matchMedia(`(max-width: ${bp}px)`)
    this.onMq = (): void => {
      this.toggleAttribute('narrow', this.mq?.matches ?? false)
      if (!this.mq?.matches) this.hide()
    }
    this.mq.addEventListener?.('change', this.onMq)
    this.onMq()
    this.root.querySelector('.toggle')?.addEventListener('click', () => {
      if (this.hasAttribute('open')) this.hide()
      else this.show()
    })
    this.root.querySelector('.backdrop')?.addEventListener('click', () => this.hide())
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) this.hide()
    })
  }

  disconnectedCallback(): void {
    if (this.onMq) this.mq?.removeEventListener?.('change', this.onMq)
  }

  show(): void {
    this.setAttribute('open', '')
    this.root.querySelector('.toggle')?.setAttribute('aria-expanded', 'true')
    const panel = this.root.querySelector('.panel')
    if (panel && !prefersReducedMotion())
      gsap.fromTo(panel, { opacity: 0.6 }, { opacity: 1, duration: 0.25 })
    this.dispatchEvent(new CustomEvent('aurora-open'))
  }

  hide(): void {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.root.querySelector('.toggle')?.setAttribute('aria-expanded', 'false')
    this.dispatchEvent(new CustomEvent('aurora-close'))
  }
}

register('aurora-responsivepanel', AuroraResponsivepanel)
