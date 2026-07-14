import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

export interface GanttTask {
  id: string
  title: string
  start: string
  end: string
  progress?: number
  dependsOn?: string[]
  color?: string
  /** Baseline dates — rendered as a thin planned bar under the actual one. */
  plannedStart?: string
  plannedEnd?: string
}

const DAY = 86400000

const STYLE = `
  :host {
    display: block; font-size: 0.84rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .wrap { display: grid; grid-template-columns: var(--aurora-gantt-label, 168px) 1fr; }
  .names { border-right: 1px solid var(--aurora-border, rgba(255,255,255,0.08)); }
  .names .cell {
    height: var(--row, 40px); display: flex; align-items: center; padding: 0 14px;
    border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.05));
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .names .head { color: var(--aurora-muted, #9a98b3); font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .chart { position: relative; overflow-x: auto; }
  .scale { display: flex; height: var(--row, 40px); border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.05)); }
  .scale div {
    flex: none; display: flex; align-items: center; justify-content: center;
    color: var(--aurora-muted, #9a98b3); font-size: 0.72rem;
    border-left: 1px solid var(--aurora-border, rgba(255,255,255,0.04));
  }
  .rows { position: relative; }
  .rowline { height: var(--row, 40px); border-bottom: 1px solid var(--aurora-border, rgba(255,255,255,0.05)); }
  .grid-bg { position: absolute; inset: 0; pointer-events: none;
    background-image: repeating-linear-gradient(to right, rgba(255,255,255,0.03) 0 1px, transparent 1px var(--dayw, 34px)); }
  .today { position: absolute; top: 0; bottom: 0; width: 1.5px; background: var(--aurora-accent2, #22d3ee); opacity: 0.7; }
  .bar {
    position: absolute; height: 22px; border-radius: 7px; cursor: pointer;
    background: color-mix(in srgb, var(--c, #6d5cff) 30%, transparent);
    border: 1px solid color-mix(in srgb, var(--c, #6d5cff) 60%, transparent);
    overflow: hidden; will-change: transform;
  }
  .bar:hover { background: color-mix(in srgb, var(--c, #6d5cff) 42%, transparent); }
  .bar:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .bar i { position: absolute; inset: 0; width: var(--p, 0%); background: color-mix(in srgb, var(--c, #6d5cff) 55%, transparent); }
  .bar span {
    position: absolute; inset: 0; display: flex; align-items: center; padding: 0 8px;
    font-size: 0.7rem; white-space: nowrap; pointer-events: none;
  }
  .bar .grip {
    position: absolute; right: 0; top: 0; bottom: 0; width: 9px; cursor: ew-resize;
    border-radius: 0 7px 7px 0;
  }
  .bar .grip:hover { background: color-mix(in srgb, var(--c, #6d5cff) 70%, transparent); }
  :host(:not([readonly])) .bar { cursor: grab; }
  .bar.dragging { opacity: 0.85; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); z-index: 2; }
  .baseline {
    position: absolute; height: 5px; border-radius: 3px; opacity: 0.55;
    background: var(--aurora-muted, #9a98b3); pointer-events: none;
  }
  .scalebar { display: flex; gap: 4px; padding: 8px 12px 0; justify-content: flex-end; }
  .scalebar button {
    all: unset; cursor: pointer; font-size: 0.72rem; padding: 2px 10px; border-radius: 7px;
    color: var(--aurora-muted, #9a98b3); border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .scalebar button[aria-pressed='true'] { color: #fff; background: var(--aurora-accent, #6d5cff); border-color: var(--aurora-accent, #6d5cff); }
  .scalebar button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  svg.deps { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
  svg.deps path { fill: none; stroke: var(--aurora-muted, #9a98b3); stroke-width: 1.3; opacity: 0.55; }
  svg.deps polygon { fill: var(--aurora-muted, #9a98b3); opacity: 0.55; }
`

/**
 * `<aurora-gantt>` — a project timeline. Assign `tasks`
 * (`{ id, title, start, end, progress?, dependsOn?, color? }[]`); the chart
 * lays out the timeline at `scale` day, week, or month (switchable from the
 * built-in toolbar), draws bars with progress fills
 * that sweep in, grey planned-vs-actual baselines under tasks that carry
 * `plannedStart`/`plannedEnd`, dependency arrows between bars, and a today
 * line. Emits
 * `aurora-select` with the clicked task. Unless `readonly`, drag a bar to
 * move it in day steps or drag its right edge to resize; commits update the
 * task and emit `aurora-update` with `{ task, start, end }`.
 */
export class AuroraGantt extends AuroraElement {
  #tasks: GanttTask[] = []
  private cleanup: (() => void) | null = null

  get scale(): 'day' | 'week' | 'month' {
    const s = this.getAttribute('scale')
    return s === 'week' || s === 'month' ? s : 'day'
  }

  set scale(v: 'day' | 'week' | 'month') {
    this.setAttribute('scale', v)
    this.render()
  }

  private pxPerDay(): number {
    const dayW = this.numberAttr('day-width', 34)
    return this.scale === 'day' ? dayW : this.scale === 'week' ? dayW / 4 : dayW / 12
  }

  get tasks(): GanttTask[] {
    return this.#tasks
  }

  set tasks(v: GanttTask[]) {
    this.#tasks = v ?? []
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  disconnectedCallback(): void {
    this.cleanup?.()
  }

  private render(): void {
    this.cleanup?.()
    if (!this.#tasks.length) {
      this.root.innerHTML = `<style>${STYLE}</style>`
      return
    }
    const dayW = this.pxPerDay()
    const rowH = 40
    const starts = this.#tasks.map((t) => new Date(`${t.start}T00:00`).getTime())
    const ends = this.#tasks.map((t) => new Date(`${t.end}T00:00`).getTime())
    const min = Math.min(...starts) - DAY
    const max = Math.max(...ends) + 2 * DAY
    const days = Math.round((max - min) / DAY)
    const x = (isoDate: string): number =>
      ((new Date(`${isoDate}T00:00`).getTime() - min) / DAY) * dayW

    const scale: string[] = []
    if (this.scale === 'day') {
      for (let i = 0; i < days; i++) {
        const d = new Date(min + i * DAY)
        scale.push(
          `<div style="width:${dayW}px">${d.getDate() === 1 || i === 0 ? d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) : d.getDate()}</div>`,
        )
      }
    } else if (this.scale === 'week') {
      for (let i = 0; i < days; i += 7) {
        const d = new Date(min + i * DAY)
        const w = Math.min(7, days - i)
        scale.push(
          `<div style="width:${dayW * w}px">${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>`,
        )
      }
    } else {
      let i = 0
      while (i < days) {
        const d = new Date(min + i * DAY)
        const inMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1
        const w = Math.min(inMonth, days - i)
        scale.push(
          `<div style="width:${dayW * w}px">${d.toLocaleDateString('en', { month: 'short', year: '2-digit' })}</div>`,
        )
        i += w
      }
    }
    const names = this.#tasks.map((t) => `<div class="cell">${escapeHtml(t.title)}</div>`).join('')
    const bars = this.#tasks
      .map((t, i) => {
        const left = x(t.start)
        const width = Math.max(x(t.end) - left + dayW, dayW * 0.5)
        const progress = Math.min(Math.max(t.progress ?? 0, 0), 100)
        let baseline = ''
        if (t.plannedStart && t.plannedEnd) {
          const bLeft = x(t.plannedStart)
          const bWidth = Math.max(x(t.plannedEnd) - bLeft + dayW, dayW * 0.5)
          baseline = `<div class="baseline" data-for="${escapeHtml(t.id)}" style="left:${bLeft}px;top:${i * rowH + 33}px;width:${bWidth}px" title="Planned"></div>`
        }
        return `${baseline}<div class="bar" data-id="${escapeHtml(t.id)}" role="button" tabindex="0" style="left:${left}px;top:${i * rowH + 9}px;width:${width}px;${t.color ? `--c:${t.color};` : ''}--p:${progress}%" aria-label="${escapeHtml(t.title)}, ${progress}% done"><i></i><span>${escapeHtml(t.title)}</span>${this.hasAttribute('readonly') ? '' : '<b class="grip" aria-hidden="true"></b>'}</div>`
      })
      .join('')
    const byId = new Map(this.#tasks.map((t, i) => [t.id, i]))
    let arrows = ''
    this.#tasks.forEach((t, i) => {
      for (const dep of t.dependsOn ?? []) {
        const from = byId.get(dep)
        if (from === undefined) continue
        const fromTask = this.#tasks[from]
        if (!fromTask) continue
        const x1 = x(fromTask.end) + dayW
        const y1 = from * rowH + 20
        const x2 = x(t.start)
        const y2 = i * rowH + 20
        const midX = Math.max(x1 + 8, x2 - 8)
        arrows += `<path d="M${x1} ${y1} L${x1 + 8} ${y1} L${midX} ${y1} L${midX} ${y2} L${x2 - 3} ${y2}"/><polygon points="${x2},${y2} ${x2 - 6},${y2 - 3.5} ${x2 - 6},${y2 + 3.5}"/>`
      }
    })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayX = ((today.getTime() - min) / DAY) * dayW
    const todayLine =
      today.getTime() >= min && today.getTime() <= max
        ? `<div class="today" style="left:${todayX}px"></div>`
        : ''
    const chartW = days * dayW

    this.root.innerHTML = `<style>${STYLE}</style><div class="scalebar" part="scalebar" role="group" aria-label="Time scale">${(
      ['day', 'week', 'month'] as const
    )
      .map(
        (sc) =>
          `<button data-sc="${sc}" aria-pressed="${sc === this.scale}">${sc[0]?.toUpperCase()}${sc.slice(1)}</button>`,
      )
      .join('')}</div><div class="wrap">
      <div class="names"><div class="cell head" style="height:${rowH}px">Task</div>${names}</div>
      <div class="chart"><div style="width:${chartW}px">
        <div class="scale">${scale.join('')}</div>
        <div class="rows" style="height:${this.#tasks.length * rowH}px;--dayw:${dayW}px">
          <div class="grid-bg"></div>
          ${this.#tasks.map(() => '<div class="rowline"></div>').join('')}
          <svg class="deps" width="${chartW}" height="${this.#tasks.length * rowH}">${arrows}</svg>
          ${bars}
          ${todayLine}
        </div>
      </div></div>
    </div>`
    this.root.querySelectorAll<HTMLButtonElement>('[data-sc]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.scale = btn.dataset['sc'] as 'day' | 'week' | 'month'
      }),
    )
    this.root.querySelectorAll<HTMLElement>('.bar').forEach((bar) => {
      let dragged = false
      const pick = (): void => {
        if (dragged) return
        const task = this.#tasks.find((t) => t.id === bar.dataset['id'])
        if (task) this.dispatchEvent(new CustomEvent('aurora-select', { detail: { task } }))
      }
      bar.addEventListener('click', pick)
      bar.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') pick()
      })
      if (this.hasAttribute('readonly')) return
      bar.addEventListener('pointerdown', (e) => {
        const task = this.#tasks.find((t) => t.id === bar.dataset['id'])
        if (!task) return
        e.preventDefault()
        const resize = (e.target as HTMLElement).classList?.contains('grip')
        const startClientX = e.clientX
        const origStart = task.start
        const origEnd = task.end
        const startLeft = parseFloat(bar.style.left)
        const startWidth = parseFloat(bar.style.width)
        dragged = false
        bar.setPointerCapture?.(e.pointerId)
        bar.classList.add('dragging')
        const dw = this.pxPerDay()
        const onMove = (move: PointerEvent): void => {
          const days = Math.round((move.clientX - startClientX) / dw)
          if (days !== 0) dragged = true
          if (resize) {
            bar.style.width = `${Math.max(startWidth + days * dw, dw * 0.5)}px`
          } else {
            bar.style.left = `${startLeft + days * dw}px`
          }
        }
        const onUp = (up: PointerEvent): void => {
          bar.removeEventListener('pointermove', onMove)
          bar.removeEventListener('pointerup', onUp)
          bar.removeEventListener('pointercancel', onUp)
          bar.classList.remove('dragging')
          const days = Math.round((up.clientX - startClientX) / dw)
          if (!days) {
            this.render()
            return
          }
          const shift = (iso: string, n: number): string => {
            const d = new Date(`${iso}T00:00`)
            d.setDate(d.getDate() + n)
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          }
          if (resize) {
            const next = shift(origEnd, days)
            task.end = next >= task.start ? next : task.start
          } else {
            task.start = shift(origStart, days)
            task.end = shift(origEnd, days)
          }
          this.render()
          this.dispatchEvent(
            new CustomEvent('aurora-update', {
              detail: { task, start: task.start, end: task.end },
            }),
          )
          window.setTimeout(() => {
            dragged = false
          }, 0)
        }
        bar.addEventListener('pointermove', onMove)
        bar.addEventListener('pointerup', onUp)
        bar.addEventListener('pointercancel', onUp)
      })
    })
    this.cleanup = whenVisible(this, () => {
      if (prefersReducedMotion()) return
      const fills = this.root.querySelectorAll('.bar i')
      const barEls = this.root.querySelectorAll('.bar')
      gsap.fromTo(
        barEls,
        { opacity: 0, scaleX: 0.6, transformOrigin: 'left center' },
        { opacity: 1, scaleX: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' },
      )
      gsap.from(fills, { width: 0, duration: 0.9, stagger: 0.06, ease: 'power2.out', delay: 0.2 })
    })
  }
}

register('aurora-gantt', AuroraGantt)
