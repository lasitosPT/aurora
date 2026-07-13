import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: block; font-size: 0.85rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .bar { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.08)); }
  .bar strong { font-size: 0.95rem; }
  .bar button { all: unset; cursor: pointer; padding: 3px 11px; border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255,255,255,0.12)); }
  .bar button:hover { border-color: var(--aurora-accent, #6d5cff); }
  .heads { display: grid; grid-template-columns: 46px repeat(7, 1fr); border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.08)); }
  .heads div { padding: 0.45rem 4px; text-align: center; color: var(--aurora-muted, #9a98b3); }
  .heads .today { color: var(--aurora-accent, #6d5cff); font-weight: 600; }
  .body { display: grid; grid-template-columns: 46px repeat(7, 1fr); position: relative; }
  .hours { display: flex; flex-direction: column; }
  .hours span { height: var(--slot, 44px); font-size: 0.7rem; color: var(--aurora-muted, #9a98b3);
    text-align: right; padding-right: 6px; transform: translateY(-0.55em); }
  .day { position: relative; border-left: 1px solid var(--aurora-border, rgba(255,255,255,0.06));
    background-image: repeating-linear-gradient(to bottom, transparent 0 calc(var(--slot, 44px) - 1px), rgba(255,255,255,0.05) calc(var(--slot, 44px) - 1px) var(--slot, 44px)); }
  .day.today { background-color: rgba(109, 92, 255, 0.045); }
  .ev {
    position: absolute; left: 3px; right: 3px; padding: 4px 7px; border-radius: 7px; overflow: hidden;
    font-size: 0.74rem; line-height: 1.3; cursor: pointer; border-left: 3px solid var(--c, #6d5cff);
    background: color-mix(in srgb, var(--c, #6d5cff) 22%, transparent); will-change: transform, opacity;
  }
  .ev:hover { background: color-mix(in srgb, var(--c, #6d5cff) 34%, transparent); }
  .ev time { display: block; opacity: 0.75; font-size: 0.68rem; }
`

export interface SchedulerEvent {
  title: string
  start: string
  end: string
  color?: string
}

const day0 = (d: Date): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  x.setHours(0, 0, 0, 0)
  return x
}
const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * `<aurora-scheduler date="2026-07-13">` — a week-view scheduler: Monday-first
 * day columns over hour rows (`start-hour`/`end-hour`, default 8–19), events
 * positioned by time with per-event accent colors, a today highlight, and
 * week paging. Assign `events` (`{ title, start, end, color? }[]` with ISO
 * datetimes). Emits `aurora-select` with the clicked event and `aurora-range`
 * on week change.
 */
export class AuroraScheduler extends AuroraElement {
  #events: SchedulerEvent[] = []
  private week = day0(new Date())

  get events(): SchedulerEvent[] {
    return this.#events
  }

  set events(v: SchedulerEvent[]) {
    this.#events = v ?? []
    this.render()
  }

  connectedCallback(): void {
    const initial = this.getAttribute('date')
    if (initial) this.week = day0(new Date(`${initial}T00:00`))
    this.render()
  }

  private render(): void {
    const h0 = this.numberAttr('start-hour', 8)
    const h1 = this.numberAttr('end-hour', 19)
    const slots = h1 - h0
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.week)
      d.setDate(d.getDate() + i)
      return d
    })
    const today = iso(new Date())
    const first = days[0] as Date
    const last = days[6] as Date
    const title = `${first.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`

    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      `<div class="bar" part="bar"><button data-w="-1" aria-label="Previous week">‹</button><strong aria-live="polite">${title}</strong><button data-w="1" aria-label="Next week">›</button></div>` +
      `<div class="heads">${['', ...days.map((d) => `<div class="${iso(d) === today ? 'today' : ''}">${d.toLocaleDateString('en', { weekday: 'short' })} ${d.getDate()}</div>`)].join('')}</div>` +
      `<div class="body" style="--slot: ${Math.max(this.numberAttr('slot-height', 44), 20)}px">` +
      `<div class="hours">${Array.from({ length: slots }, (_, i) => `<span>${String(h0 + i).padStart(2, '0')}:00</span>`).join('')}</div>` +
      days
        .map((d) => {
          const key = iso(d)
          const evs = this.#events
            .map((e, idx) => ({ e, idx }))
            .filter(({ e }) => e.start.slice(0, 10) === key)
            .map(({ e, idx }) => {
              const s = new Date(e.start)
              const en = new Date(e.end)
              const top = ((s.getHours() + s.getMinutes() / 60 - h0) / slots) * 100
              const height = Math.max(((en.getTime() - s.getTime()) / 3600000 / slots) * 100, 3)
              const hm = (x: Date): string =>
                `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
              return `<div class="ev" data-i="${idx}" role="button" tabindex="0" style="top:${top}%;height:${height}%;${e.color ? `--c:${e.color}` : ''}">${escapeHtml(e.title)}<time>${hm(s)}–${hm(en)}</time></div>`
            })
            .join('')
          return `<div class="day${key === today ? ' today' : ''}" style="height: calc(var(--slot) * ${slots})">${evs}</div>`
        })
        .join('') +
      `</div>`

    this.root.querySelectorAll<HTMLButtonElement>('[data-w]').forEach((b) =>
      b.addEventListener('click', () => {
        this.week.setDate(this.week.getDate() + Number(b.dataset.w) * 7)
        this.render()
        this.dispatchEvent(new CustomEvent('aurora-range', { detail: { start: iso(this.week) } }))
      }),
    )
    this.root.querySelectorAll<HTMLElement>('.ev').forEach((ev) => {
      const pick = (): void => {
        const event = this.#events[Number(ev.dataset.i)]
        if (event) this.dispatchEvent(new CustomEvent('aurora-select', { detail: { event } }))
      }
      ev.addEventListener('click', pick)
      ev.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') pick()
      })
    })
    if (!prefersReducedMotion()) {
      const evs = this.root.querySelectorAll('.ev')
      if (evs.length > 0)
        gsap.fromTo(
          evs,
          { opacity: 0, y: 5 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.04,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          },
        )
    }
  }
}

register('aurora-scheduler', AuroraScheduler)
