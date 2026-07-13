import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import './stepper'
import './button'
import type { AuroraStepper } from './stepper'

const STEP_STYLE = `
  :host { display: block; }
  :host(:not([active])) { display: none; }
`

/** `<aurora-wizard-step label="…">` — one wizard page; content is slotted. */
export class AuroraWizardStep extends AuroraElement {
  connectedCallback(): void {
    this.root.innerHTML = `<style>${STEP_STYLE}</style><div class="wrap"><slot></slot></div>`
  }
}

register('aurora-wizard-step', AuroraWizardStep)

const STYLE = `
  :host { display: block; }
  .panels { padding: 22px 4px; min-height: var(--aurora-wizard-height, auto); }
  .footer { display: flex; justify-content: space-between; gap: 12px; }
  .spacer { flex: 1; }
`

/**
 * `<aurora-wizard>` — a multi-step flow around `<aurora-wizard-step>`
 * children, composing `aurora-stepper` for progress. Direction-aware animated
 * transitions, Back/Next/Finish buttons, and a cancelable `aurora-next` event
 * for validation gates — call `event.preventDefault()` to hold the step.
 * Emits `aurora-change` per step and cancelable `aurora-finish` at the end.
 */
export class AuroraWizard extends AuroraElement {
  private current = 0
  private steps: HTMLElement[] = []
  private stepper: AuroraStepper | null = null

  get index(): number {
    return this.current
  }

  set index(v: number) {
    this.goTo(v)
  }

  connectedCallback(): void {
    this.steps = Array.from(this.querySelectorAll<HTMLElement>(':scope > aurora-wizard-step'))
    const labels = this.steps.map((s, i) => s.getAttribute('label') ?? `Step ${i + 1}`)
    const linear = this.getAttribute('linear') ?? 'true'
    this.root.innerHTML = `<style>${STYLE}</style>
      <aurora-stepper part="stepper" linear="${linear}"></aurora-stepper>
      <div class="panels" part="panels"><slot></slot></div>
      <div class="footer" part="footer">
        <aurora-button variant="ghost" class="back">${this.getAttribute('back-label') ?? 'Back'}</aurora-button>
        <span class="spacer"></span>
        <aurora-button class="next">${this.getAttribute('next-label') ?? 'Next'}</aurora-button>
      </div>`
    this.stepper = this.root.querySelector('aurora-stepper')
    if (this.stepper) {
      this.stepper.steps = labels
      this.stepper.addEventListener('aurora-change', (e) => {
        const { value } = (e as CustomEvent<{ value: number }>).detail
        if (value !== this.current) this.goTo(value, false)
      })
    }
    this.root.querySelector('.back')?.addEventListener('click', () => this.prev())
    this.root.querySelector('.next')?.addEventListener('click', () => this.next())
    this.current = this.numberAttr('index', 0)
    this.apply(this.current, 0)
  }

  next(): void {
    if (this.current >= this.steps.length - 1) {
      const finish = new CustomEvent('aurora-finish', { cancelable: true })
      if (this.dispatchEvent(finish)) this.setAttribute('done', '')
      return
    }
    const gate = new CustomEvent('aurora-next', {
      cancelable: true,
      detail: { from: this.current, to: this.current + 1 },
    })
    if (!this.dispatchEvent(gate)) return
    this.goTo(this.current + 1)
  }

  prev(): void {
    this.goTo(this.current - 1)
  }

  goTo(v: number, syncStepper = true): void {
    const target = Math.max(0, Math.min(v, this.steps.length - 1))
    if (target === this.current) return
    const dir = target > this.current ? 1 : -1
    this.current = target
    if (syncStepper && this.stepper) this.stepper.value = target
    this.apply(target, dir)
    this.dispatchEvent(
      new CustomEvent('aurora-change', {
        detail: { index: target, label: this.steps[target]?.getAttribute('label') ?? '' },
      }),
    )
  }

  private apply(active: number, dir: number): void {
    this.steps.forEach((s, i) => {
      if (i === active) s.setAttribute('active', '')
      else s.removeAttribute('active')
    })
    const back = this.root.querySelector<HTMLElement>('.back')
    if (back) back.style.visibility = active === 0 ? 'hidden' : 'visible'
    const next = this.root.querySelector('.next')
    if (next)
      next.textContent =
        active === this.steps.length - 1
          ? (this.getAttribute('finish-label') ?? 'Finish')
          : (this.getAttribute('next-label') ?? 'Next')
    const wrap = this.steps[active]?.shadowRoot?.querySelector('.wrap')
    if (wrap && dir !== 0 && !prefersReducedMotion())
      gsap.fromTo(
        wrap,
        { opacity: 0, x: 26 * dir },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' },
      )
  }
}

register('aurora-wizard', AuroraWizard)
