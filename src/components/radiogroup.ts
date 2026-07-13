import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; flex-direction: column; gap: 11px; color: var(--aurora-fg, #ececf2); }
  :host([inline]) { flex-direction: row; gap: 20px; flex-wrap: wrap; }
  .opt { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; }
  .dot {
    all: unset; width: 20px; height: 20px; border-radius: 50%; box-sizing: border-box;
    border: 1.5px solid var(--aurora-border, rgba(128, 128, 128, 0.55));
    display: inline-grid; place-items: center; cursor: pointer;
    background: var(--aurora-field, rgba(255, 255, 255, 0.04));
    transition: border-color 0.15s ease;
  }
  .dot:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .dot i {
    width: 10px; height: 10px; border-radius: 50%; transform: scale(0);
    background: var(--aurora-accent, #6d5cff); transition: transform 0.18s ease;
  }
  .opt[aria-checked='true'] .dot { border-color: var(--aurora-accent, #6d5cff); }
  .opt[aria-checked='true'] .dot i { transform: scale(1); }
  .label { font-size: 0.95rem; user-select: none; }
`

/**
 * `<aurora-radiogroup value="b">` — a radio group from `<option>` children
 * following the WAI-ARIA pattern: roving tabindex, arrow keys move and
 * select, dots pop in. Form-associated; emits `aurora-change`.
 */
export class AuroraRadiogroup extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private opts: { value: string; label: string }[] = []
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

  get value(): string {
    return this.current
  }

  set value(v: string) {
    this.current = v
    this.sync()
  }

  connectedCallback(): void {
    this.opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
    }))
    this.current = this.getAttribute('value') ?? ''
    this.setAttribute('role', 'radiogroup')
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      this.opts
        .map(
          (o) =>
            `<span class="opt" data-v="${escapeHtml(o.value)}" aria-checked="false"><button class="dot" role="radio" aria-checked="false" aria-label="${escapeHtml(o.label)}" tabindex="-1"><i></i></button><span class="label">${escapeHtml(o.label)}</span></span>`,
        )
        .join('')
    this.root.querySelectorAll<HTMLElement>('.opt').forEach((opt) => {
      opt.addEventListener('click', () => this.pick(opt.dataset['v'] ?? ''))
      opt.querySelector('.dot')?.addEventListener('keydown', (e) => {
        const key = (e as KeyboardEvent).key
        const idx = this.opts.findIndex((o) => o.value === (this.current || this.opts[0]?.value))
        let next = -1
        if (key === 'ArrowDown' || key === 'ArrowRight') next = (idx + 1) % this.opts.length
        else if (key === 'ArrowUp' || key === 'ArrowLeft')
          next = (idx + this.opts.length - 1) % this.opts.length
        else if (key === ' ' || key === 'Enter') next = idx
        else return
        e.preventDefault()
        const target = this.opts[next]
        if (target) {
          this.pick(target.value)
          this.root
            .querySelector<HTMLButtonElement>(`.opt[data-v="${CSS.escape(target.value)}"] .dot`)
            ?.focus()
        }
      })
    })
    this.sync()
  }

  private pick(v: string): void {
    if (v === this.current) return
    this.current = v
    this.sync()
    const dot = this.root.querySelector(`.opt[data-v="${CSS.escape(v)}"] .dot i`)
    if (dot && !prefersReducedMotion())
      gsap.fromTo(dot, { scale: 0.4 }, { scale: 1, duration: 0.28, ease: 'back.out(3)' })
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: v } }))
  }

  private sync(): void {
    this.root.querySelectorAll<HTMLElement>('.opt').forEach((opt, i) => {
      const on = opt.dataset['v'] === this.current
      opt.setAttribute('aria-checked', String(on))
      const dot = opt.querySelector<HTMLButtonElement>('.dot')
      dot?.setAttribute('aria-checked', String(on))
      if (dot) dot.tabIndex = on || (!this.current && i === 0) ? 0 : -1
    })
    this.internals?.setFormValue(this.current || null)
  }
}

register('aurora-radiogroup', AuroraRadiogroup)
