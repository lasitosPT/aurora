import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'
import './calendar'
import type { AuroraCalendar } from './calendar'

const STYLE = `
  :host { display: inline-block; position: relative; color: var(--aurora-fg, #ececf2); }
  .label {
    display: block; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); margin-bottom: 7px;
  }
  .field {
    all: unset; box-sizing: border-box; cursor: pointer; min-width: 230px;
    padding: 0.6rem 0.9rem; font: inherit; font-variant-numeric: tabular-nums;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 11px;
    transition: border-color 0.15s ease;
  }
  .field:focus-visible, :host([open]) .field { border-color: var(--aurora-accent, #6d5cff); outline: none; }
  .field .ph { color: var(--aurora-muted, #9a98b3); }
  .field .ico { opacity: 0.6; font-size: 0.9em; }
  .panel {
    position: absolute; top: calc(100% + 8px); left: 0; z-index: var(--aurora-menu-z, 60);
    display: none; gap: 0; overflow: hidden;
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 14px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
  }
  :host([open]) .panel { display: flex; }
  .times {
    width: 96px; max-height: 292px; overflow-y: auto; padding: 8px;
    border-inline-start: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
    display: flex; flex-direction: column; gap: 2px;
  }
  .times button {
    all: unset; cursor: pointer; text-align: center; padding: 0.4rem 0; border-radius: 7px;
    font-size: 0.88rem; font-variant-numeric: tabular-nums;
  }
  .times button:hover { background: rgba(109, 92, 255, 0.14); }
  .times button[aria-selected='true'] { background: var(--aurora-accent, #6d5cff); color: #fff; }
  aurora-calendar { border: none; }
`

/**
 * `<aurora-datetimepicker>` — date and time in one field: the popup pairs a
 * composed `<aurora-calendar>` with a time column (`step` minutes, default
 * 30). `value` is `YYYY-MM-DDTHH:MM`; picking both commits, closes, and
 * emits `aurora-change`. Form-associated.
 */
export class AuroraDatetimepicker extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private cal: AuroraCalendar | null = null
  private date: string | null = null
  private time: string | null = null

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

  get value(): string | null {
    return this.date && this.time ? `${this.date}T${this.time}` : null
  }

  set value(v: string | null) {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(v ?? '')
    if (!m) return
    this.date = m[1] ?? null
    this.time = m[2] ?? null
    if (this.cal && this.date) this.cal.value = this.date
    this.sync()
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label" part="label">${escapeHtml(label)}</label>` : ''
    }<button class="field" part="field" aria-haspopup="dialog" aria-expanded="false"><span class="text ph">${escapeHtml(
      this.getAttribute('placeholder') ?? 'Pick date & time',
    )}</span><span class="ico" aria-hidden="true">📅</span></button>
    <div class="panel" part="panel" role="dialog" aria-label="Choose date and time"><div class="calwrap"></div><div class="times" part="times"></div></div>`
    this.cal = document.createElement('aurora-calendar') as AuroraCalendar
    this.root.querySelector('.calwrap')?.appendChild(this.cal)
    this.cal.addEventListener('aurora-change', (e) => {
      this.date = (e as CustomEvent<{ value: string }>).detail.value
      this.commitIfComplete()
    })
    this.renderTimes()
    const field = this.root.querySelector('.field')
    field?.addEventListener('click', () => {
      if (this.hasAttribute('open')) this.close()
      else this.open()
    })
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        this.close()
        ;(field as HTMLElement | null)?.focus()
      }
    })
    const initial = this.getAttribute('value')
    if (initial) this.value = initial
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

  private renderTimes(): void {
    const times = this.root.querySelector('.times')
    if (!times) return
    const step = this.numberAttr('step', 30)
    const slots: string[] = []
    for (let m = 0; m < 24 * 60; m += step) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0')
      const mm = String(m % 60).padStart(2, '0')
      slots.push(`${hh}:${mm}`)
    }
    times.innerHTML = slots
      .map((t) => `<button data-t="${t}" aria-selected="${t === this.time}">${t}</button>`)
      .join('')
    times.querySelectorAll<HTMLButtonElement>('button').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.time = btn.dataset['t'] ?? null
        times
          .querySelectorAll('button')
          .forEach((b) => b.setAttribute('aria-selected', String(b === btn)))
        this.commitIfComplete()
      }),
    )
  }

  private commitIfComplete(): void {
    this.sync()
    if (this.date && this.time) {
      this.close()
      this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.value } }))
    }
  }

  private sync(): void {
    const text = this.root.querySelector('.text')
    if (text) {
      if (this.date || this.time) {
        text.textContent = `${this.date ?? '····-··-··'} ${this.time ?? '··:··'}`
        text.classList.remove('ph')
      } else {
        text.textContent = this.getAttribute('placeholder') ?? 'Pick date & time'
        text.classList.add('ph')
      }
    }
    this.internals?.setFormValue(this.value)
  }
}

register('aurora-datetimepicker', AuroraDatetimepicker)
