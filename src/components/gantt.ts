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
    font-size: 0.7rem; white-space: nowrap;
  }
  svg.deps { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
  svg.deps path { fill: none; stroke: var(--aurora-muted, #9a98b3); stroke-width: 1.3; opacity: 0.55; }
  svg.deps polygon { fill: var(--aurora-muted, #9a98b3); opacity: 0.55; }
`

/**
 * `<aurora-gantt>` — a project timeline. Assign `tasks`
 * (`{ id, title, start, end, progress?, dependsOn?, color? }[]`); the chart
 * lays out day columns across the full span, draws bars with progress fills
 * that sweep in, dependency arrows between bars, and a today line. Emits
 * `aurora-select` with the clicked task.
 */
export class AuroraGantt extends AuroraElement {
  #tasks: GanttTask[] = []
  private cleanup: (() => void) | null = null

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
    const dayW = this.numberAttr('day-width', 34)
    const rowH = 40
    const starts = this.#tasks.map((t) => new Date(`${t.start}T00:00`).getTime())
    const ends = this.#tasks.map((t) => new Date(`${t.end}T00:00`).getTime())
    const min = Math.min(...starts) - DAY
    const max = Math.max(...ends) + 2 * DAY
    const days = Math.round((max - min) / DAY)
    const x = (isoDate: string): number =>
      ((new Date(`${isoDate}T00:00`).getTime() - min) / DAY) * dayW

    const scale: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(min + i * DAY)
      scale.push(
        `<div style="width:${dayW}px">${d.getDate() === 1 || i === 0 ? d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) : d.getDate()}</div>`,
      )
    }
    const names = this.#tasks.map((t) => `<div class="cell">${escapeHtml(t.title)}</div>`).join('')
    const bars = this.#tasks
      .map((t, i) => {
        const left = x(t.start)
        const width = Math.max(x(t.end) - left + dayW, dayW * 0.5)
        const progress = Math.min(Math.max(t.progress ?? 0, 0), 100)
        return `<div class="bar" data-id="${escapeHtml(t.id)}" role="button" tabindex="0" style="left:${left}px;top:${i * rowH + 9}px;width:${width}px;${t.color ? `--c:${t.color};` : ''}--p:${progress}%" aria-label="${escapeHtml(t.title)}, ${progress}% done"><i></i><span>${escapeHtml(t.title)}</span></div>`
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

    this.root.innerHTML = `<style>${STYLE}</style><div class="wrap">
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
    this.root.querySelectorAll<HTMLElement>('.bar').forEach((bar) => {
      const pick = (): void => {
        const task = this.#tasks.find((t) => t.id === bar.dataset['id'])
        if (task) this.dispatchEvent(new CustomEvent('aurora-select', { detail: { task } }))
      }
      bar.addEventListener('click', pick)
      bar.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') pick()
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
