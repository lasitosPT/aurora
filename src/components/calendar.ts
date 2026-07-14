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
  .day:disabled { opacity: 0.25; cursor: default; }
  .day:disabled:hover { background: none; }
  .day.hidden-other { visibility: hidden; }
  .wk { font-size: 0.68em; color: var(--aurora-muted, #9a98b3); align-self: center; }
  .grid.with-weeks { grid-template-columns: auto repeat(7, 1fr); }
  .head .title { all: unset; cursor: pointer; font-weight: 600; padding: 2px 8px; border-radius: 7px; }
  .head .title:hover { background: rgba(109, 92, 255, 0.14); }
  .head .title:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .zoom { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .zoom button {
    all: unset; cursor: pointer; text-align: center; padding: 14px 0; border-radius: 9px; font-size: 0.9em;
  }
  .zoom button:hover { background: rgba(109, 92, 255, 0.14); }
  .zoom button:disabled { opacity: 0.25; cursor: default; }
  .zoom button.now { box-shadow: inset 0 0 0 1px var(--aurora-accent, #6d5cff); }
  .zoom button:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); }
`

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * `<aurora-calendar value="2026-07-11">` — a calendar with month, year, and
 * decade views (click the title to zoom out, a cell to zoom in). `min`/`max`
 * bound the pickable range, `disabled-dates` (comma ISO list) or a
 * `disabledDate` function veto days, `week-numbers` adds the ISO week
 * column, and `hide-other-months` blanks the spill-over days. Arrow /
 * PageUp / PageDown / Enter keyboard; form-associated. Emits `aurora-change`
 * with `{ value }`.
 */
export class AuroraCalendar extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private cursor = new Date()
  private view: 'month' | 'year' | 'decade' = 'month'

  /** Optional veto function for selectable days (return true to disable). */
  disabledDate: ((iso: string) => boolean) | null = null

  private isDisabled(iso: string): boolean {
    const min = this.getAttribute('min')
    const max = this.getAttribute('max')
    if (min && iso < min) return true
    if (max && iso > max) return true
    const list = this.getAttribute('disabled-dates')
    if (
      list &&
      list
        .split(',')
        .map((s) => s.trim())
        .includes(iso)
    )
      return true
    return this.disabledDate?.(iso) ?? false
  }

  private isoWeek(d: Date): number {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const day = t.getUTCDay() || 7
    t.setUTCDate(t.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
    return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

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
    const start = this.getAttribute('start-view')
    if (start === 'year' || start === 'decade') this.view = start
    const initial = this.getAttribute('value')
    if (initial) this.value = initial
    else this.render()
  }

  private render(): void {
    const y = this.cursor.getFullYear()
    const m = this.cursor.getMonth()
    if (this.view === 'year') {
      this.renderZoom(
        String(y),
        Array.from({ length: 12 }, (_, i) => ({
          label: new Date(y, i, 1).toLocaleDateString('en', { month: 'short' }),
          now: i === new Date().getMonth() && y === new Date().getFullYear(),
          go: () => {
            this.cursor = new Date(y, i, 1)
            this.view = 'month'
            this.render()
          },
        })),
        (dir) => {
          this.cursor = new Date(y + dir, m, 1)
          this.render()
        },
        () => {
          this.view = 'decade'
          this.render()
        },
      )
      return
    }
    if (this.view === 'decade') {
      const d0 = Math.floor(y / 10) * 10
      this.renderZoom(
        `${d0} – ${d0 + 9}`,
        Array.from({ length: 12 }, (_, i) => {
          const year = d0 - 1 + i
          return {
            label: String(year),
            faded: year < d0 || year > d0 + 9,
            now: year === new Date().getFullYear(),
            go: () => {
              this.cursor = new Date(year, 0, 1)
              this.view = 'year'
              this.render()
            },
          }
        }),
        (dir) => {
          this.cursor = new Date(y + dir * 10, 0, 1)
          this.render()
        },
        null,
      )
      return
    }
    const first = new Date(y, m, 1)
    const start = (first.getDay() + 6) % 7 // Monday first
    const today = fmt(new Date())
    const title = first.toLocaleDateString('en', { month: 'long', year: 'numeric' })
    const dows = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    const weeks = this.hasAttribute('week-numbers')
    const hideOther = this.hasAttribute('hide-other-months')
    let cells = ''
    for (let i = 0; i < 42; i++) {
      const d = new Date(y, m, 1 - start + i)
      const iso = fmt(d)
      const other = d.getMonth() !== m
      if (weeks && i % 7 === 0)
        cells += `<span class="wk" aria-hidden="true">${this.isoWeek(d)}</span>`
      const disabled = this.isDisabled(iso)
      cells += `<button class="day${other ? (hideOther ? ' hidden-other' : ' other') : ''}${iso === today ? ' today' : ''}" role="gridcell" data-iso="${iso}" ${disabled ? 'disabled' : ''} aria-selected="${iso === this.picked}" tabindex="${iso === (this.picked ?? today) ? 0 : -1}">${d.getDate()}</button>`
    }
    this.root.innerHTML = `<style>${STYLE}</style><div class="head"><button data-nav="-1" aria-label="Previous month">‹</button><button class="title" aria-live="polite" aria-label="Switch to year view">${title}</button><button data-nav="1" aria-label="Next month">›</button></div><div class="grid${weeks ? ' with-weeks' : ''}" role="grid">${weeks ? '<span class="wk"></span>' : ''}${dows.map((d) => `<span class="dow">${d}</span>`).join('')}${cells}</div>`

    this.root.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((b) =>
      b.addEventListener('click', () => {
        this.cursor = new Date(y, m + Number(b.dataset.nav), 1)
        this.render()
      }),
    )
    this.root.querySelector('.title')?.addEventListener('click', () => {
      this.view = 'year'
      this.render()
    })
    this.root.querySelectorAll<HTMLButtonElement>('.day').forEach((b) => {
      b.addEventListener('click', () => this.pick(b.dataset.iso ?? ''))
      b.addEventListener('keydown', (e) => this.onKey(e, b))
    })
  }

  private renderZoom(
    title: string,
    cells: { label: string; now?: boolean; faded?: boolean; go: () => void }[],
    nav: (dir: number) => void,
    zoomOut: (() => void) | null,
  ): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="head"><button data-nav="-1" aria-label="Previous">‹</button><button class="title" ${zoomOut ? 'aria-label="Zoom out"' : 'disabled'}>${title}</button><button data-nav="1" aria-label="Next">›</button></div><div class="zoom">${cells
      .map(
        (c, i) =>
          `<button data-z="${i}" class="${c.now ? 'now' : ''}" style="${c.faded ? 'opacity:0.4' : ''}">${c.label}</button>`,
      )
      .join('')}</div>`
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-nav]')
      .forEach((b) => b.addEventListener('click', () => nav(Number(b.dataset.nav))))
    if (zoomOut) this.root.querySelector('.title')?.addEventListener('click', zoomOut)
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-z]')
      .forEach((b) => b.addEventListener('click', () => cells[Number(b.dataset.z)]?.go()))
  }

  private pick(iso: string): void {
    if (this.isDisabled(iso)) return
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
