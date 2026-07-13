import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; flex-direction: column; gap: 8px; width: 210px; color: var(--aurora-fg, #ececf2); }
  .title { font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--aurora-muted, #9a98b3); }
  .list {
    display: flex; flex-direction: column; gap: 3px; padding: 6px; min-height: 180px;
    background: var(--aurora-surface, #14141f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12)); border-radius: 12px;
    overflow: auto; max-height: var(--aurora-listbox-height, 240px);
  }
  .item {
    all: unset; cursor: pointer; padding: 0.45rem 0.7rem; border-radius: 8px;
    font-size: 0.92rem; transition: background 0.12s ease;
  }
  .item:hover { background: rgba(255, 255, 255, 0.05); }
  .item[aria-selected='true'] { background: rgba(109, 92, 255, 0.18); }
  .item:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px; }
  .tools { display: flex; gap: 6px; }
  .tools button {
    all: unset; cursor: pointer; flex: 1; text-align: center; padding: 5px 0;
    border-radius: 8px; font-size: 0.85rem; color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .tools button:hover:not(:disabled) { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  .tools button:disabled { opacity: 0.35; cursor: default; }
  .tools button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .empty { color: var(--aurora-muted, #9a98b3); font-size: 0.85rem; text-align: center; padding: 18px 0; }
`

/**
 * `<aurora-listbox connect="otherId">` — an orderable list with a toolbar:
 * move items up/down, and transfer the selection (or double-click) to a
 * connected listbox. Items from `<option>` children or the `items` property.
 * Emits `aurora-change` on reorder and `aurora-transfer` on moves between
 * boxes.
 */
export class AuroraListbox extends AuroraElement {
  #items: string[] = []
  private selected: string | null = null

  get items(): string[] {
    return [...this.#items]
  }

  set items(list: string[]) {
    this.#items = [...list]
    this.renderList()
  }

  connectedCallback(): void {
    this.#items = Array.from(this.querySelectorAll('option')).map(
      (o) => o.getAttribute('value') ?? o.textContent?.trim() ?? '',
    )
    const title = this.getAttribute('label') ?? ''
    const connected = this.hasAttribute('connect')
    this.root.innerHTML = `<style>${STYLE}</style>${
      title ? `<span class="title" part="label">${escapeHtml(title)}</span>` : ''
    }<div class="list" part="list" role="listbox" aria-label="${escapeHtml(title || 'List')}"></div>
    <div class="tools" part="tools">
      <button data-act="up" aria-label="Move up">▲</button>
      <button data-act="down" aria-label="Move down">▼</button>
      ${connected ? '<button data-act="send" aria-label="Transfer to connected list">→</button>' : ''}
      <button data-act="remove" aria-label="Remove">✕</button>
    </div>`
    this.root
      .querySelectorAll<HTMLButtonElement>('.tools button')
      .forEach((btn) => btn.addEventListener('click', () => this.act(btn.dataset['act'] ?? '')))
    this.renderList()
  }

  /** Receive an item from a connected listbox (appends and pops). */
  receive(item: string): void {
    this.#items.push(item)
    this.renderList()
    const last = this.root.querySelector('.list')?.lastElementChild
    if (last && !prefersReducedMotion())
      gsap.fromTo(
        last,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' },
      )
  }

  private act(action: string): void {
    if (!this.selected) return
    const idx = this.#items.indexOf(this.selected)
    if (idx < 0) return
    if (action === 'up' || action === 'down') {
      const to = action === 'up' ? idx - 1 : idx + 1
      if (to < 0 || to >= this.#items.length) return
      const tmp = this.#items[to]
      this.#items[to] = this.#items[idx] ?? ''
      this.#items[idx] = tmp ?? ''
      this.renderList()
      this.dispatchEvent(new CustomEvent('aurora-change', { detail: { items: this.items } }))
    } else if (action === 'remove') {
      this.#items.splice(idx, 1)
      this.selected = null
      this.renderList()
      this.dispatchEvent(new CustomEvent('aurora-change', { detail: { items: this.items } }))
    } else if (action === 'send') {
      this.transfer(this.selected)
    }
  }

  private transfer(item: string): void {
    const targetId = this.getAttribute('connect')
    const target = targetId ? (document.getElementById(targetId) as AuroraListbox | null) : null
    if (!target?.receive) return
    this.#items = this.#items.filter((i) => i !== item)
    this.selected = null
    this.renderList()
    target.receive(item)
    this.dispatchEvent(new CustomEvent('aurora-transfer', { detail: { item, to: targetId } }))
  }

  private renderList(): void {
    const list = this.root.querySelector('.list')
    if (!list) return
    list.innerHTML = this.#items.length
      ? this.#items
          .map(
            (item) =>
              `<button class="item" role="option" data-v="${escapeHtml(item)}" aria-selected="${item === this.selected}">${escapeHtml(item)}</button>`,
          )
          .join('')
      : '<div class="empty">Empty</div>'
    list.querySelectorAll<HTMLButtonElement>('.item').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selected = btn.dataset['v'] ?? null
        this.renderList()
      })
      btn.addEventListener('dblclick', () => {
        if (this.hasAttribute('connect')) this.transfer(btn.dataset['v'] ?? '')
      })
      btn.addEventListener('keydown', (e) => {
        const key = (e as KeyboardEvent).key
        if (key !== 'ArrowUp' && key !== 'ArrowDown') return
        e.preventDefault()
        const sib = key === 'ArrowDown' ? btn.nextElementSibling : btn.previousElementSibling
        if (sib?.classList.contains('item')) {
          this.selected = (sib as HTMLElement).dataset['v'] ?? null
          this.renderList()
          this.root.querySelector<HTMLButtonElement>(`.item[aria-selected="true"]`)?.focus()
        }
      })
    })
    const hasSel = this.selected !== null
    this.root.querySelectorAll<HTMLButtonElement>('.tools button').forEach((btn) => {
      btn.disabled = !hasSel
    })
  }
}

register('aurora-listbox', AuroraListbox)
