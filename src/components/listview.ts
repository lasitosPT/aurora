import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: block;
    color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: var(--aurora-grid-radius, 14px);
    background: var(--aurora-surface, #14141f);
    overflow: hidden;
    font-size: 0.93rem;
  }
  .items { max-height: var(--aurora-grid-height, none); overflow: auto; }
  .item {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.07));
    transition: background 0.15s ease;
  }
  .item:last-child { border-bottom: none; }
  .item:hover { background: rgba(255, 255, 255, 0.035); }
  .item:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px; }
  .item[aria-selected='true'] { background: rgba(109, 92, 255, 0.14); }
  :host([selectable]) .item { cursor: pointer; }
  .empty { padding: 26px; text-align: center; color: var(--aurora-muted, #9a98b3); }
  .pager {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 0.55rem 0.9rem; font-size: 0.84em;
    border-top: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
    color: var(--aurora-muted, #9a98b3);
  }
  .pager button {
    all: unset; cursor: pointer; padding: 3px 11px; border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .pager button:hover:not(:disabled) { border-color: var(--aurora-accent, #6d5cff); color: var(--aurora-fg, #ececf2); }
  .pager button:disabled { opacity: 0.35; cursor: default; }
`

/**
 * `<aurora-listview>` — a templated, data-bound list. Assign `data` and a
 * `template` (row → HTML string); rows stagger in, page with `page-size`,
 * select with `selectable` (or `selectable="multiple"`), navigate with
 * arrows/Enter. Emits `aurora-select` with `{ rows }`.
 */
export class AuroraListview extends AuroraElement {
  #data: Record<string, unknown>[] = []
  #template: ((row: Record<string, unknown>) => string) | null = null
  private page = 0
  private selected = new Set<number>()
  private focusIdx = 0

  get data(): Record<string, unknown>[] {
    return this.#data
  }

  set data(rows: Record<string, unknown>[]) {
    this.#data = rows
    this.page = 0
    this.selected.clear()
    this.renderAll(true)
  }

  get template(): ((row: Record<string, unknown>) => string) | null {
    return this.#template
  }

  set template(fn: ((row: Record<string, unknown>) => string) | null) {
    this.#template = fn
    this.renderAll()
  }

  get rows(): Record<string, unknown>[] {
    return [...this.selected]
      .map((i) => this.#data[i])
      .filter((r): r is Record<string, unknown> => r !== undefined)
  }

  connectedCallback(): void {
    this.renderAll()
  }

  private pageItems(): { row: Record<string, unknown>; index: number }[] {
    const size = this.numberAttr('page-size', 0)
    const all = this.#data.map((row, index) => ({ row, index }))
    if (!size) return all
    return all.slice(this.page * size, (this.page + 1) * size)
  }

  private renderAll(entrance = false): void {
    const size = this.numberAttr('page-size', 0)
    const pages = size ? Math.max(1, Math.ceil(this.#data.length / size)) : 1
    const items = this.pageItems()
    const body = items.length
      ? items
          .map(
            ({ row, index }) =>
              `<div class="item" role="option" data-i="${index}" aria-selected="${this.selected.has(index)}" tabindex="${
                index === this.focusIdx ? 0 : -1
              }">${this.#template ? this.#template(row) : escapeHtml(Object.values(row).join(' · '))}</div>`,
          )
          .join('')
      : '<div class="empty">No items</div>'
    const pager =
      pages > 1
        ? `<div class="pager"><button class="prev" ${this.page === 0 ? 'disabled' : ''}>‹ Prev</button><span>${
            this.page + 1
          } / ${pages}</span><button class="next" ${this.page >= pages - 1 ? 'disabled' : ''}>Next ›</button></div>`
        : ''
    this.root.innerHTML = `<style>${STYLE}</style><div class="items" role="listbox" aria-multiselectable="${
      this.getAttribute('selectable') === 'multiple'
    }">${body}</div>${pager}`
    this.wire()
    if (entrance && !prefersReducedMotion()) {
      const els = this.root.querySelectorAll('.item')
      if (els.length)
        gsap.fromTo(
          els,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
        )
    }
  }

  private wire(): void {
    this.root.querySelector('.prev')?.addEventListener('click', () => {
      this.page = Math.max(0, this.page - 1)
      this.renderAll()
    })
    this.root.querySelector('.next')?.addEventListener('click', () => {
      this.page++
      this.renderAll()
    })
    this.root.querySelectorAll<HTMLElement>('.item').forEach((el) => {
      el.addEventListener('click', () => this.pick(Number(el.dataset['i'])))
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.pick(Number(el.dataset['i']))
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const sib = e.key === 'ArrowDown' ? el.nextElementSibling : el.previousElementSibling
          if (sib?.classList.contains('item')) {
            this.focusIdx = Number((sib as HTMLElement).dataset['i'])
            el.tabIndex = -1
            ;(sib as HTMLElement).tabIndex = 0
            ;(sib as HTMLElement).focus()
          }
        }
      })
    })
  }

  private pick(index: number): void {
    const mode = this.getAttribute('selectable')
    if (mode === null) return
    this.focusIdx = index
    if (mode === 'multiple') {
      if (this.selected.has(index)) this.selected.delete(index)
      else this.selected.add(index)
    } else {
      this.selected.clear()
      this.selected.add(index)
    }
    this.renderAll()
    this.dispatchEvent(new CustomEvent('aurora-select', { detail: { rows: this.rows } }))
  }
}

register('aurora-listview', AuroraListview)
