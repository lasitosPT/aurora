import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

export interface BoardCard {
  id: string
  title: string
  tag?: string
  color?: string
}

export interface BoardColumn {
  id: string
  title: string
  cards: BoardCard[]
}

const STYLE = `
  :host { display: flex; gap: 14px; align-items: flex-start; overflow-x: auto; padding: 4px 2px; color: var(--aurora-fg, #ececf2); }
  .col {
    flex: 1; min-width: 210px; display: flex; flex-direction: column; gap: 9px;
    background: var(--aurora-surface, #14141f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
    border-radius: 14px; padding: 12px;
  }
  .col.over { border-color: var(--aurora-accent, #6d5cff); }
  .colhead { display: flex; align-items: center; justify-content: space-between; padding: 0 2px 4px; }
  .colhead b { font-size: 0.88rem; }
  .count {
    font-size: 0.72rem; color: var(--aurora-muted, #9a98b3); min-width: 20px; height: 20px;
    display: inline-grid; place-items: center; border-radius: 10px;
    background: rgba(255, 255, 255, 0.06); padding: 0 6px;
  }
  .card {
    cursor: grab; user-select: none; touch-action: none; padding: 10px 13px; border-radius: 11px;
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
    border-left: 3px solid var(--c, var(--aurora-accent, #6d5cff));
    font-size: 0.88rem; position: relative;
  }
  .card:hover { background: rgba(255, 255, 255, 0.055); }
  .card:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .card.dragging { opacity: 0.9; z-index: 5; box-shadow: 0 16px 44px rgba(0, 0, 0, 0.5); cursor: grabbing; }
  .card .tag { display: block; margin-top: 5px; font-size: 0.68rem; color: var(--aurora-muted, #9a98b3); }
  .empty { font-size: 0.78rem; color: var(--aurora-muted, #9a98b3); text-align: center; padding: 12px 0; }
`

/**
 * `<aurora-taskboard>` — a kanban board. Assign `columns`
 * (`{ id, title, cards: { id, title, tag?, color? }[] }[]`); drag cards
 * within and across columns (targets highlight), or move the focused card
 * with Ctrl/⌘ + arrows. Emits `aurora-move` with
 * `{ card, from, to, index }`.
 */
export class AuroraTaskboard extends AuroraElement {
  #columns: BoardColumn[] = []
  private drag: { card: BoardCard; from: string; el: HTMLElement; x: number; y: number } | null =
    null

  get columns(): BoardColumn[] {
    return this.#columns
  }

  set columns(v: BoardColumn[]) {
    this.#columns = v ?? []
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  /** Move a card to a column (end, or at index) — the keyboard/API path. */
  move(cardId: string, toCol: string, index = -1): void {
    const from = this.#columns.find((c) => c.cards.some((k) => k.id === cardId))
    const to = this.#columns.find((c) => c.id === toCol)
    if (!from || !to) return
    const card = from.cards.find((k) => k.id === cardId)
    if (!card) return
    from.cards = from.cards.filter((k) => k.id !== cardId)
    if (index < 0 || index > to.cards.length) to.cards.push(card)
    else to.cards.splice(index, 0, card)
    this.render()
    this.dispatchEvent(
      new CustomEvent('aurora-move', {
        detail: { card, from: from.id, to: to.id, index: to.cards.indexOf(card) },
      }),
    )
  }

  private render(): void {
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      this.#columns
        .map(
          (col) =>
            `<div class="col" data-col="${escapeHtml(col.id)}"><div class="colhead"><b>${escapeHtml(col.title)}</b><span class="count">${col.cards.length}</span></div>${
              col.cards.length
                ? col.cards
                    .map(
                      (card) =>
                        `<div class="card" data-id="${escapeHtml(card.id)}" tabindex="0" ${card.color ? `style="--c:${card.color}"` : ''}>${escapeHtml(card.title)}${card.tag ? `<span class="tag">${escapeHtml(card.tag)}</span>` : ''}</div>`,
                    )
                    .join('')
                : '<div class="empty">Drop cards here</div>'
            }</div>`,
        )
        .join('')
    this.wire()
  }

  private colAt(x: number, y: number): HTMLElement | null {
    for (const col of Array.from(this.root.querySelectorAll<HTMLElement>('.col'))) {
      const r = col.getBoundingClientRect()
      if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return col
    }
    return null
  }

  private wire(): void {
    this.root.querySelectorAll<HTMLElement>('.card').forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        const colEl = el.closest('.col') as HTMLElement | null
        const col = this.#columns.find((c) => c.id === colEl?.dataset['col'])
        const card = col?.cards.find((k) => k.id === el.dataset['id'])
        if (!col || !card) return
        e.preventDefault()
        this.drag = { card, from: col.id, el, x: e.clientX, y: e.clientY }
        el.setPointerCapture?.(e.pointerId)
        el.classList.add('dragging')
        if (!prefersReducedMotion()) gsap.to(el, { scale: 1.04, duration: 0.12 })
      })
      el.addEventListener('pointermove', (e) => {
        const d = this.drag
        if (!d || d.el !== el) return
        gsap.set(el, { x: e.clientX - d.x, y: e.clientY - d.y })
        this.root.querySelectorAll('.col').forEach((c) => c.classList.remove('over'))
        this.colAt(e.clientX, e.clientY)?.classList.add('over')
      })
      const drop = (e: PointerEvent): void => {
        const d = this.drag
        if (!d || d.el !== el) return
        this.drag = null
        const target = this.colAt(e.clientX, e.clientY)
        const toId = target?.dataset['col']
        if (toId) {
          // insertion index: count cards in target whose midpoint is above the pointer
          const cards = Array.from(target.querySelectorAll<HTMLElement>('.card')).filter(
            (c) => c !== el,
          )
          let index = cards.length
          for (let i = 0; i < cards.length; i++) {
            const r = cards[i]?.getBoundingClientRect()
            if (r && e.clientY < r.top + r.height / 2) {
              index = i
              break
            }
          }
          this.move(d.card.id, toId, index)
        } else {
          this.render()
        }
      }
      el.addEventListener('pointerup', drop)
      el.addEventListener('pointercancel', drop)
      el.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return
        const colEl = el.closest('.col') as HTMLElement | null
        const idx = this.#columns.findIndex((c) => c.id === colEl?.dataset['col'])
        let target: number
        if (e.key === 'ArrowRight') target = idx + 1
        else if (e.key === 'ArrowLeft') target = idx - 1
        else return
        e.preventDefault()
        const to = this.#columns[target]
        if (to) {
          this.move(el.dataset['id'] ?? '', to.id)
          this.root
            .querySelector<HTMLElement>(`.card[data-id="${CSS.escape(el.dataset['id'] ?? '')}"]`)
            ?.focus()
        }
      })
    })
  }
}

register('aurora-taskboard', AuroraTaskboard)
