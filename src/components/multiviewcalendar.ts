import { AuroraElement } from '../core/base'
import { register } from '../core/register'
import './calendar'
import type { AuroraCalendar } from './calendar'

const STYLE = `
  :host { display: inline-block; color: var(--aurora-fg, #ececf2); }
  .bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .bar button {
    all: unset; cursor: pointer; padding: 3px 12px; border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .bar button:hover { border-color: var(--aurora-accent, #6d5cff); }
  .bar button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .views { display: flex; gap: 18px; flex-wrap: wrap; }
`

/**
 * `<aurora-multiviewcalendar views="2">` — consecutive months side by side
 * (composed `<aurora-calendar>`s) under one shared navigation; picking a day
 * in any month selects across all of them. ISO `value`; form-associated;
 * emits `aurora-change`.
 */
export class AuroraMultiviewcalendar extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private cursor = new Date()
  private current: string | null = null

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
    return this.current
  }

  set value(v: string | null) {
    this.current = v
    this.calendars().forEach((cal) => {
      cal.value = v
    })
    this.internals?.setFormValue(v)
  }

  connectedCallback(): void {
    const initial = this.getAttribute('value')
    if (initial) {
      this.current = initial
      this.cursor = new Date(`${initial}T00:00`)
    }
    this.cursor.setDate(1)
    const views = Math.max(this.numberAttr('views', 2), 1)
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="bar" part="bar"><button data-nav="-1" aria-label="Previous month">‹</button><button data-nav="1" aria-label="Next month">›</button></div>
      <div class="views" part="views">${Array.from({ length: views }, () => '<aurora-calendar hide-nav></aurora-calendar>').join('')}</div>`
    this.calendars().forEach((cal) => {
      if (this.current) cal.value = this.current
      cal.addEventListener('aurora-change', (e) => {
        e.stopPropagation()
        const { value } = (e as CustomEvent<{ value: string }>).detail
        this.value = value
        this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value } }))
      })
    })
    this.root.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.cursor.setMonth(this.cursor.getMonth() + Number(btn.dataset['nav']))
        this.sync()
      }),
    )
    this.sync()
  }

  private calendars(): AuroraCalendar[] {
    return Array.from(this.root.querySelectorAll<AuroraCalendar>('aurora-calendar'))
  }

  private sync(): void {
    this.calendars().forEach((cal, i) => {
      cal.showMonth(this.cursor.getFullYear(), this.cursor.getMonth() + i)
    })
  }
}

register('aurora-multiviewcalendar', AuroraMultiviewcalendar)
