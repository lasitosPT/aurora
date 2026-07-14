import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { t } from '../core/i18n'

const STYLE = `
  :host {
    display: block; font-size: 0.85rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .bar { display: flex; align-items: center; gap: 10px; padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.08)); }
  .bar strong { font-size: 0.95rem; flex: 1; text-align: center; }
  .bar button { all: unset; cursor: pointer; padding: 3px 11px; border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255,255,255,0.12)); }
  .bar button:hover { border-color: var(--aurora-accent, #6d5cff); }
  .bar button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .switch { display: flex; gap: 4px; }
  .switch button { font-size: 0.76rem; padding: 3px 9px; color: var(--aurora-muted, #9a98b3); }
  .switch button[aria-pressed='true'] {
    color: #fff; background: var(--aurora-accent, #6d5cff); border-color: var(--aurora-accent, #6d5cff);
  }
  .heads { display: grid; grid-template-columns: 46px repeat(var(--cols, 7), 1fr); border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.08)); }
  .heads div { padding: 0.45rem 4px; text-align: center; color: var(--aurora-muted, #9a98b3); }
  .heads .today { color: var(--aurora-accent, #6d5cff); font-weight: 600; }
  .body { display: grid; grid-template-columns: 46px repeat(var(--cols, 7), 1fr); position: relative; }
  .hours { display: flex; flex-direction: column; }
  .hours span { height: var(--slot, 44px); font-size: 0.7rem; color: var(--aurora-muted, #9a98b3);
    text-align: end; padding-inline-end: 6px; transform: translateY(-0.55em); }
  .day { position: relative; border-inline-start: 1px solid var(--aurora-border, rgba(255,255,255,0.06));
    background-image: repeating-linear-gradient(to bottom, transparent 0 calc(var(--slot, 44px) - 1px), rgba(255,255,255,0.05) calc(var(--slot, 44px) - 1px) var(--slot, 44px)); }
  .day.today { background-color: rgba(109, 92, 255, 0.045); }
  .ev {
    position: absolute; left: 3px; right: 3px; padding: 4px 7px; border-radius: 7px; overflow: hidden;
    font-size: 0.74rem; line-height: 1.3; cursor: pointer; border-inline-start: 3px solid var(--c, #6d5cff);
    background: color-mix(in srgb, var(--c, #6d5cff) 22%, transparent); will-change: transform, opacity;
  }
  .ev:hover { background: color-mix(in srgb, var(--c, #6d5cff) 34%, transparent); }
  .ev time { display: block; opacity: 0.75; font-size: 0.68rem; }
  .ev .rep { position: absolute; right: 5px; top: 3px; font-size: 0.66rem; opacity: 0.7; }
  .ev.dragging { opacity: 0.85; z-index: 4; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); cursor: grabbing; }
  .ev .rsz { position: absolute; left: 0; right: 0; bottom: 0; height: 7px; cursor: ns-resize; }
  .resources { display: flex; gap: 12px; padding: 6px 14px; font-size: 0.74rem; color: var(--aurora-muted, #9a98b3);
    border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.06)); flex-wrap: wrap; }
  .resources i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-inline-end: 5px; vertical-align: -1px; }
  .mgrid { display: grid; grid-template-columns: repeat(7, 1fr); }
  .mcell {
    min-height: 76px; padding: 5px 6px; border-inline-start: 1px solid var(--aurora-border, rgba(255,255,255,0.05));
    border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.05));
    display: flex; flex-direction: column; gap: 3px;
  }
  .mcell .num { font-size: 0.72rem; color: var(--aurora-muted, #9a98b3); }
  .mcell.off .num { opacity: 0.35; }
  .mcell.today { background: rgba(109, 92, 255, 0.06); }
  .mcell.today .num { color: var(--aurora-accent, #6d5cff); font-weight: 700; }
  .chip {
    all: unset; cursor: pointer; font-size: 0.68rem; padding: 1px 6px; border-radius: 5px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    border-inline-start: 2.5px solid var(--c, #6d5cff);
    background: color-mix(in srgb, var(--c, #6d5cff) 22%, transparent);
  }
  .chip:hover { background: color-mix(in srgb, var(--c, #6d5cff) 34%, transparent); }
  .more { font-size: 0.66rem; color: var(--aurora-muted, #9a98b3); }
  .agenda { display: flex; flex-direction: column; }
  .aday {
    padding: 0.5rem 0.9rem 0.2rem; font-size: 0.76rem; letter-spacing: 0.05em;
    text-transform: uppercase; color: var(--aurora-muted, #9a98b3);
  }
  .aday.today { color: var(--aurora-accent, #6d5cff); }
  .arow {
    all: unset; cursor: pointer; display: flex; gap: 14px; align-items: baseline;
    padding: 0.45rem 0.9rem; border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.05));
  }
  .arow:hover { background: rgba(255, 255, 255, 0.03); }
  .arow time { font-variant-numeric: tabular-nums; color: var(--aurora-muted, #9a98b3); font-size: 0.78rem; flex: none; width: 92px; }
  .arow .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c, #6d5cff); flex: none; align-self: center; }
  .empty { padding: 26px; text-align: center; color: var(--aurora-muted, #9a98b3); }
`

export interface SchedulerEvent {
  title: string
  start: string
  end: string
  color?: string
  /** Recurrence: repeats at the same time until `until` (inclusive). */
  repeat?: 'daily' | 'weekly' | 'monthly'
  until?: string
  /** Resource id — inherits the resource color unless `color` is set. */
  resource?: string
}

export interface SchedulerResource {
  id: string
  title: string
  color: string
}

type View = 'day' | 'week' | 'month' | 'agenda'
const VIEWS: View[] = ['day', 'week', 'month', 'agenda']

const day0 = (d: Date): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  x.setHours(0, 0, 0, 0)
  return x
}
const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const hm = (x: Date): string =>
  `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`

/**
 * `<aurora-scheduler view="week">` — a scheduler with four views: `day` and
 * `week` (time columns over hour rows, `start-hour`/`end-hour`), `month`
 * (calendar cells with event chips and a "+N more" tail), and `agenda`
 * (a grouped list of the coming two weeks). The toolbar pages by the view's
 * unit and switches views inline. Assign `events`
 * (`{ title, start, end, color?, repeat?, until?, resource? }[]`, ISO
 * datetimes — `repeat` expands daily/weekly/monthly occurrences until
 * `until`). Assign `resources` for color-coded categories with a legend;
 * drag base events in day/week views to move them in half-hour snaps
 * (`readonly` opts out, occurrences don't drag). Emits `aurora-select`,
 * `aurora-update` after drags,
 * with the clicked event and `aurora-range` on paging or view change.
 */
export class AuroraScheduler extends AuroraElement {
  #events: SchedulerEvent[] = []
  #resources: SchedulerResource[] = []
  private cursor = new Date()

  get resources(): SchedulerResource[] {
    return this.#resources
  }

  set resources(v: SchedulerResource[]) {
    this.#resources = v ?? []
    this.render()
  }

  private colorOf(e: SchedulerEvent): string | undefined {
    return e.color ?? this.#resources.find((r) => r.id === e.resource)?.color
  }

  get events(): SchedulerEvent[] {
    return this.#events
  }

  set events(v: SchedulerEvent[]) {
    this.#events = v ?? []
    this.render()
  }

  get view(): View {
    const v = this.getAttribute('view')
    return v === 'day' || v === 'month' || v === 'agenda' ? v : 'week'
  }

  set view(v: View) {
    this.setAttribute('view', v)
    this.render()
    this.emitRange()
  }

  connectedCallback(): void {
    const initial = this.getAttribute('date')
    if (initial) this.cursor = new Date(`${initial}T00:00`)
    this.cursor.setHours(0, 0, 0, 0)
    this.render()
  }

  private occursOn(e: SchedulerEvent, key: string): boolean {
    const base = e.start.slice(0, 10)
    if (base === key) return true
    if (!e.repeat) return false
    if (key < base) return false
    if (e.until && key > e.until) return false
    const from = new Date(`${base}T00:00`)
    const day = new Date(`${key}T00:00`)
    if (e.repeat === 'daily') return true
    if (e.repeat === 'weekly') return from.getDay() === day.getDay()
    return from.getDate() === day.getDate()
  }

  private eventsOn(key: string): { e: SchedulerEvent; idx: number; occurrence: boolean }[] {
    return this.#events
      .map((e, idx) => ({ e, idx, occurrence: e.start.slice(0, 10) !== key }))
      .filter(({ e }) => this.occursOn(e, key))
      .sort((a, b) => a.e.start.slice(11).localeCompare(b.e.start.slice(11)))
  }

  private heading(): string {
    const c = this.cursor
    if (this.view === 'day')
      return c.toLocaleDateString('en', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    if (this.view === 'month') return c.toLocaleDateString('en', { month: 'long', year: 'numeric' })
    if (this.view === 'agenda') {
      const end = new Date(c)
      end.setDate(end.getDate() + 13)
      return `${c.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
    }
    const first = day0(c)
    const last = new Date(first)
    last.setDate(last.getDate() + 6)
    return `${first.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  private render(): void {
    const bar =
      `<div class="bar" part="bar"><button data-w="-1" aria-label="Previous">‹</button>` +
      `<strong aria-live="polite">${this.heading()}</strong>` +
      `<div class="switch" part="switch" role="group" aria-label="View">${VIEWS.map(
        (v) =>
          `<button data-view="${v}" aria-pressed="${v === this.view}">${t(`scheduler.${v}`)}</button>`,
      ).join('')}</div>` +
      `<button data-w="1" aria-label="Next">›</button></div>`
    const body =
      this.view === 'month'
        ? this.renderMonth()
        : this.view === 'agenda'
          ? this.renderAgenda()
          : this.renderTimeGrid(this.view === 'day' ? 1 : 7)
    const legend = this.#resources.length
      ? `<div class="resources" part="resources">${this.#resources
          .map(
            (r) =>
              `<span><i style="background:${escapeHtml(r.color)}"></i>${escapeHtml(r.title)}</span>`,
          )
          .join('')}</div>`
      : ''
    this.root.innerHTML = `<style>${STYLE}</style>${bar}${legend}${body}`
    this.wire()
  }

  private renderTimeGrid(cols: 1 | 7): string {
    const h0 = this.numberAttr('start-hour', 8)
    const h1 = this.numberAttr('end-hour', 19)
    const slots = h1 - h0
    const base = cols === 7 ? day0(this.cursor) : this.cursor
    const days = Array.from({ length: cols }, (_, i) => {
      const d = new Date(base)
      d.setDate(d.getDate() + i)
      return d
    })
    const today = iso(new Date())
    return (
      `<div class="heads" style="--cols:${cols}">${[
        '',
        ...days.map(
          (d) =>
            `<div class="${iso(d) === today ? 'today' : ''}">${d.toLocaleDateString('en', { weekday: 'short' })} ${d.getDate()}</div>`,
        ),
      ].join('')}</div>` +
      `<div class="body" style="--cols:${cols};--slot: ${Math.max(this.numberAttr('slot-height', 44), 20)}px">` +
      `<div class="hours">${Array.from({ length: slots }, (_, i) => `<span>${String(h0 + i).padStart(2, '0')}:00</span>`).join('')}</div>` +
      days
        .map((d) => {
          const key = iso(d)
          const evs = this.eventsOn(key)
            .map(({ e, idx, occurrence }) => {
              const s = new Date(e.start)
              const en = new Date(e.end)
              const top = ((s.getHours() + s.getMinutes() / 60 - h0) / slots) * 100
              const height = Math.max(((en.getTime() - s.getTime()) / 3600000 / slots) * 100, 3)
              const color = this.colorOf(e)
              return `<div class="ev${occurrence ? ' occ' : ''}" data-i="${idx}" data-occ="${occurrence}" role="button" tabindex="0" style="top:${top}%;height:${height}%;${color ? `--c:${color}` : ''}">${escapeHtml(e.title)}${e.repeat ? '<span class="rep" aria-label="Repeats">↻</span>' : ''}<time>${hm(s)}–${hm(en)}</time>${occurrence ? '' : '<span class="rsz" aria-hidden="true"></span>'}</div>`
            })
            .join('')
          return `<div class="day${key === today ? ' today' : ''}" data-key="${key}" style="height: calc(var(--slot) * ${slots})">${evs}</div>`
        })
        .join('') +
      `</div>`
    )
  }

  private renderMonth(): string {
    const first = new Date(this.cursor.getFullYear(), this.cursor.getMonth(), 1)
    const start = day0(first)
    const today = iso(new Date())
    const weeks = Math.ceil(
      (new Date(this.cursor.getFullYear(), this.cursor.getMonth() + 1, 0).getDate() +
        ((first.getDay() + 6) % 7)) /
        7,
    )
    const heads = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      .map((d) => `<div>${d}</div>`)
      .join('')
    let cells = ''
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = iso(d)
      const off = d.getMonth() !== this.cursor.getMonth()
      const evs = this.eventsOn(key)
      const shown = evs.slice(0, 3)
      const extra = evs.length - shown.length
      cells += `<div class="mcell${off ? ' off' : ''}${key === today ? ' today' : ''}"><span class="num">${d.getDate()}</span>${shown
        .map(
          ({ e, idx }) =>
            `<button class="chip" data-i="${idx}" ${this.colorOf(e) ? `style="--c:${this.colorOf(e)}"` : ''}>${escapeHtml(e.title)}</button>`,
        )
        .join('')}${extra > 0 ? `<span class="more">+${extra} more</span>` : ''}</div>`
    }
    return `<div class="heads" style="grid-template-columns: repeat(7, 1fr)">${heads}</div><div class="mgrid">${cells}</div>`
  }

  private renderAgenda(): string {
    const today = iso(new Date())
    let out = ''
    let any = false
    for (let i = 0; i < 14; i++) {
      const d = new Date(this.cursor)
      d.setDate(d.getDate() + i)
      const key = iso(d)
      const evs = this.eventsOn(key)
      if (!evs.length) continue
      any = true
      out += `<div class="aday${key === today ? ' today' : ''}">${d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</div>`
      out += evs
        .map(({ e, idx }) => {
          const s = new Date(e.start)
          const en = new Date(e.end)
          return `<button class="arow" data-i="${idx}"><span class="dot" ${this.colorOf(e) ? `style="--c:${this.colorOf(e)}"` : ''}></span><time>${hm(s)}–${hm(en)}</time><span>${escapeHtml(e.title)}</span></button>`
        })
        .join('')
    }
    return `<div class="agenda">${any ? out : `<div class="empty">${t('scheduler.empty')}</div>`}</div>`
  }

  private page(dir: number): void {
    if (this.view === 'day') this.cursor.setDate(this.cursor.getDate() + dir)
    else if (this.view === 'week') this.cursor.setDate(this.cursor.getDate() + dir * 7)
    else if (this.view === 'month') this.cursor.setMonth(this.cursor.getMonth() + dir)
    else this.cursor.setDate(this.cursor.getDate() + dir * 14)
    this.render()
    this.emitRange()
  }

  private emitRange(): void {
    this.dispatchEvent(
      new CustomEvent('aurora-range', { detail: { start: iso(this.cursor), view: this.view } }),
    )
  }

  private wire(): void {
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-w]')
      .forEach((b) => b.addEventListener('click', () => this.page(Number(b.dataset['w']))))
    this.root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) =>
      b.addEventListener('click', () => {
        const v = b.dataset['view'] as View
        if (v !== this.view) this.view = v
      }),
    )
    let draggedRecently = false
    this.root.querySelectorAll<HTMLElement>('.ev, .chip, .arow').forEach((el) => {
      const pick = (): void => {
        if (draggedRecently) return
        const event = this.#events[Number(el.dataset['i'])]
        if (event) this.dispatchEvent(new CustomEvent('aurora-select', { detail: { event } }))
      }
      el.addEventListener('click', pick)
      el.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') pick()
      })
    })
    if ((this.view === 'week' || this.view === 'day') && !this.hasAttribute('readonly')) {
      this.root.querySelectorAll<HTMLElement>('.ev').forEach((el) => {
        if (el.dataset['occ'] === 'true') return
        el.addEventListener('pointerdown', (e) => {
          const event = this.#events[Number(el.dataset['i'])]
          if (!event) return
          e.preventDefault()
          const resizing = (e.target as HTMLElement).classList?.contains('rsz')
          const sx = e.clientX
          const sy = e.clientY
          let moved = false
          el.setPointerCapture?.(e.pointerId)
          const onMove = (m: PointerEvent): void => {
            if (Math.abs(m.clientX - sx) + Math.abs(m.clientY - sy) > 4) moved = true
            el.classList.add('dragging')
            if (resizing) {
              const grow = m.clientY - sy
              el.style.height = `calc(${el.style.height.split('calc').pop() ?? el.style.height} + 0px)`
              el.style.transform = ''
              el.style.marginBottom = `${-grow}px`
              el.style.zIndex = '4'
              el.style.minHeight = `${el.offsetHeight + grow > 14 ? el.offsetHeight + grow : 14}px`
            } else {
              el.style.transform = `translate(${m.clientX - sx}px, ${m.clientY - sy}px)`
            }
          }
          const onUp = (u: PointerEvent): void => {
            el.removeEventListener('pointermove', onMove)
            el.removeEventListener('pointerup', onUp)
            el.removeEventListener('pointercancel', onUp)
            el.classList.remove('dragging')
            el.style.transform = ''
            el.style.minHeight = ''
            el.style.marginBottom = ''
            if (!moved) return
            draggedRecently = true
            window.setTimeout(() => {
              draggedRecently = false
            }, 0)
            if (resizing) {
              const col = el.closest('.day') as HTMLElement | null
              const rect = col?.getBoundingClientRect()
              if (!col || !rect || !rect.height) {
                this.render()
                return
              }
              const h0 = this.numberAttr('start-hour', 8)
              const h1 = this.numberAttr('end-hour', 19)
              const frac = Math.min(Math.max((u.clientY - rect.top) / rect.height, 0.02), 1)
              const minutes = Math.round((frac * (h1 - h0) * 60) / 30) * 30
              const endH = h0 + Math.floor(minutes / 60)
              const endM = minutes % 60
              const key = col.dataset['key'] ?? event.start.slice(0, 10)
              const newEnd = `${key}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
              if (newEnd > event.start) event.end = newEnd
              this.render()
              this.dispatchEvent(
                new CustomEvent('aurora-update', {
                  detail: { event, start: event.start, end: event.end },
                }),
              )
              return
            }
            const target = Array.from(this.root.querySelectorAll<HTMLElement>('.day')).find((d) => {
              const r = d.getBoundingClientRect()
              return r.width > 0 && u.clientX >= r.left && u.clientX <= r.right
            })
            const key = target?.dataset['key']
            if (!target || !key) {
              this.render()
              return
            }
            const rect = target.getBoundingClientRect()
            const h0 = this.numberAttr('start-hour', 8)
            const h1 = this.numberAttr('end-hour', 19)
            const frac = Math.min(Math.max((u.clientY - rect.top) / rect.height, 0), 0.98)
            const minutes = Math.round((frac * (h1 - h0) * 60) / 30) * 30
            const startH = h0 + Math.floor(minutes / 60)
            const startM = minutes % 60
            const durMs = new Date(event.end).getTime() - new Date(event.start).getTime()
            const newStart = `${key}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
            const endDate = new Date(new Date(`${newStart}:00`).getTime() + durMs)
            event.start = newStart
            event.end = `${iso(endDate)}T${hm(endDate)}`
            this.render()
            this.dispatchEvent(
              new CustomEvent('aurora-update', {
                detail: { event, start: event.start, end: event.end },
              }),
            )
          }
          el.addEventListener('pointermove', onMove)
          el.addEventListener('pointerup', onUp)
          el.addEventListener('pointercancel', onUp)
        })
      })
    }
    if (!prefersReducedMotion()) {
      const evs = this.root.querySelectorAll('.ev, .chip, .arow')
      if (evs.length > 0)
        gsap.fromTo(
          evs,
          { opacity: 0, y: 5 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.03,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          },
        )
    }
  }
}

register('aurora-scheduler', AuroraScheduler)
