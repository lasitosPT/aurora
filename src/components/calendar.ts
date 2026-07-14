import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const STYLE = `
  :host([hide-nav]) [data-nav] { visibility: hidden; }
  :host {
    display: inline-block; padding: 14px; min-width: 264px;
    color: var(--aurora-fg, #ececf2);
    background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 14px;
  }
  .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .head button {
    all: unset; cursor: pointer; padding: 3px 10px; border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .head button:hover { border-color: var(--aurora-accent, #6d5cff); }
  .head .title { font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
  .dow { font-size: 0.72em; color: var(--aurora-muted, #9a98b3); padding: 4px 0; }
  .day {
    all: unset; cursor: pointer; padding: 6px 0; border-radius: 8px; font-size: 0.9em;
    text-align: center;
  }
  .day:hover { background: rgba(109, 92, 255, 0.14); }
  .day.other { color: var(--aurora-muted, #9a98b3); opacity: 0.45; }
  .day.today { box-shadow: inset 0 0 0 1px var(--aurora-accent, #6d5cff); }
  .day[aria-selected='true'] { background: var(--aurora-accent, #6d5cff); color: #fff; }
  .day:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); }
`

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * `<aurora-calendar value="2026-07-11">` — a month-view calendar. Click or use
 * arrows/PageUp/PageDown/Enter to pick a date; form-associated; today is
 * outlined. `value` is ISO (yyyy-mm-dd). Emits `aurora-change` with `{ value }`.
 */
export class AuroraCalendar extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private cursor = new Date()

  /** Show a specific month (used by aurora-multiviewcalendar). */
  showMonth(year: number, month: number): void {
    this.cursor = new Date(year, month, 1)
    this.render()
  }
  private picked: string | null = null

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get value(): string | null {
    return this.picked
  }

  set value(v: string | null) {
    this.picked = v
    if (v) {
      const d = new Date(`${v}T00:00`)
      if (!Number.isNaN(d.getTime())) this.cursor = d
      this.internals?.setFormValue(v)
    }
    this.render()
  }

  connectedCallback(): void {
    const initial = this.getAttribute('value')
    if (initial) this.value = initial
    else this.render()
  }

  private render(): void {
    const y = this.cursor.getFullYear()
    const m = this.cursor.getMonth()
    const first = new Date(y, m, 1)
    const start = (first.getDay() + 6) % 7 // Monday first
    const today = fmt(new Date())
    const title = first.toLocaleDateString('en', { month: 'long', year: 'numeric' })
    const dows = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    let cells = ''
    for (let i = 0; i < 42; i++) {
      const d = new Date(y, m, 1 - start + i)
      const iso = fmt(d)
      const other = d.getMonth() !== m
      cells += `<button class="day${other ? ' other' : ''}${iso === today ? ' today' : ''}" role="gridcell" data-iso="${iso}" aria-selected="${iso === this.picked}" tabindex="${iso === (this.picked ?? today) ? 0 : -1}">${d.getDate()}</button>`
    }
    this.root.innerHTML = `<style>${STYLE}</style><div class="head"><button data-nav="-1" aria-label="Previous month">‹</button><span class="title" aria-live="polite">${title}</span><button data-nav="1" aria-label="Next month">›</button></div><div class="grid" role="grid">${dows.map((d) => `<span class="dow">${d}</span>`).join('')}${cells}</div>`

    this.root.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((b) =>
      b.addEventListener('click', () => {
        this.cursor = new Date(y, m + Number(b.dataset.nav), 1)
        this.render()
      }),
    )
    this.root.querySelectorAll<HTMLButtonElement>('.day').forEach((b) => {
      b.addEventListener('click', () => this.pick(b.dataset.iso ?? ''))
      b.addEventListener('keydown', (e) => this.onKey(e, b))
    })
  }

  private pick(iso: string): void {
    this.picked = iso
    const d = new Date(`${iso}T00:00`)
    if (!Number.isNaN(d.getTime())) this.cursor = d
    this.internals?.setFormValue(iso)
    this.render()
    this.root.querySelector<HTMLElement>(`[data-iso="${iso}"]`)?.focus()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: iso } }))
  }

  private onKey(e: KeyboardEvent, b: HTMLButtonElement): void {
    const iso = b.dataset.iso ?? ''
    const d = new Date(`${iso}T00:00`)
    const move = (days: number, months = 0): void => {
      e.preventDefault()
      d.setMonth(d.getMonth() + months)
      d.setDate(d.getDate() + days)
      this.cursor = d
      this.render()
      this.root.querySelector<HTMLElement>(`[data-iso="${fmt(d)}"]`)?.focus()
    }
    if (e.key === 'ArrowLeft') move(-1)
    else if (e.key === 'ArrowRight') move(1)
    else if (e.key === 'ArrowUp') move(-7)
    else if (e.key === 'ArrowDown') move(7)
    else if (e.key === 'PageUp') move(0, -1)
    else if (e.key === 'PageDown') move(0, 1)
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      this.pick(iso)
    }
  }
}

register('aurora-calendar', AuroraCalendar)
