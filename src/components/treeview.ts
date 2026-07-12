import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; font-size: 0.95rem; color: var(--aurora-fg, #ececf2); }
  ul { list-style: none; margin: 0; padding: 0; }
  ul ul { padding-left: 1.15rem; border-left: 1px solid var(--aurora-border, rgba(255,255,255,0.08)); margin-left: 0.55rem; }
  .row {
    display: flex; align-items: center; gap: 7px; padding: 0.34rem 0.55rem; border-radius: 8px;
    cursor: pointer; user-select: none;
  }
  .row:hover { background: rgba(109, 92, 255, 0.1); }
  .row:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px; }
  .row[aria-selected='true'] { background: rgba(109, 92, 255, 0.18); }
  .caret { display: inline-block; width: 0.9em; transition: transform 0.2s ease; color: var(--aurora-muted, #9a98b3); }
  li[aria-expanded='true'] > .row .caret { transform: rotate(90deg); }
  .leaf .caret { visibility: hidden; }
  li[aria-expanded='false'] > ul { display: none; }
`

export interface TreeNode {
  label: string
  value?: string
  open?: boolean
  children?: TreeNode[]
}

/**
 * `<aurora-treeview>` — hierarchical navigation. Assign `items` (nested
 * `{ label, value?, open?, children? }`); branches expand/collapse with an
 * animated caret, and the full ARIA tree keyboard pattern works: Up/Down move
 * visible rows, Right expands, Left collapses, Enter selects. Emits
 * `aurora-select` with `{ value }` and `aurora-toggle` with `{ value, open }`.
 */
export class AuroraTreeview extends AuroraElement {
  #items: TreeNode[] = []
  private selected: string | null = null

  get items(): TreeNode[] {
    return this.#items
  }

  set items(v: TreeNode[]) {
    this.#items = v ?? []
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  private render(): void {
    const branch = (nodes: TreeNode[]): string =>
      `<ul role="group">${nodes
        .map((n) => {
          const value = n.value ?? n.label
          const kids = n.children && n.children.length > 0
          return `<li role="treeitem" class="${kids ? '' : 'leaf'}"${kids ? ` aria-expanded="${n.open !== false}"` : ''}><div class="row" tabindex="-1" data-v="${escapeHtml(value)}" aria-selected="${value === this.selected}"><span class="caret" aria-hidden="true">▸</span>${escapeHtml(n.label)}</div>${kids ? branch(n.children ?? []) : ''}</li>`
        })
        .join('')}</ul>`
    this.root.innerHTML = `<style>${STYLE}</style>${branch(this.#items).replace('role="group"', 'role="tree"')}`

    const rows = this.visibleRows()
    if (rows[0]) rows[0].tabIndex = 0
    this.root.querySelectorAll<HTMLElement>('.row').forEach((row) => {
      row.addEventListener('click', () => this.activate(row))
      row.addEventListener('keydown', (e) => this.onKey(e, row))
    })
  }

  private visibleRows(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>('.row')).filter(
      (r) => r.offsetParent !== null || !r.closest('li[aria-expanded="false"] ul'),
    )
  }

  private activate(row: HTMLElement): void {
    const li = row.closest('li')
    if (li?.hasAttribute('aria-expanded')) {
      const open = li.getAttribute('aria-expanded') !== 'true'
      li.setAttribute('aria-expanded', String(open))
      if (!prefersReducedMotion() && open) {
        const ul = li.querySelector(':scope > ul')
        if (ul)
          gsap.fromTo(
            ul.children,
            { opacity: 0, x: -6 },
            {
              opacity: 1,
              x: 0,
              duration: 0.25,
              stagger: 0.04,
              ease: 'power2.out',
              clearProps: 'all',
            },
          )
      }
      this.dispatchEvent(
        new CustomEvent('aurora-toggle', { detail: { value: row.dataset.v, open } }),
      )
    } else {
      this.selected = row.dataset.v ?? null
      this.root
        .querySelectorAll('.row')
        .forEach((r) => r.setAttribute('aria-selected', String(r === row)))
      this.dispatchEvent(new CustomEvent('aurora-select', { detail: { value: this.selected } }))
    }
    row.focus()
  }

  private onKey(e: KeyboardEvent, row: HTMLElement): void {
    const li = row.closest('li')
    const rows = this.visibleRows()
    const i = rows.indexOf(row)
    const move = (j: number): void => {
      const target = rows[j]
      if (!target) return
      e.preventDefault()
      row.tabIndex = -1
      target.tabIndex = 0
      target.focus()
    }
    if (e.key === 'ArrowDown') move(i + 1)
    else if (e.key === 'ArrowUp') move(i - 1)
    else if (e.key === 'ArrowRight' && li?.getAttribute('aria-expanded') === 'false')
      this.activate(row)
    else if (e.key === 'ArrowLeft' && li?.getAttribute('aria-expanded') === 'true')
      this.activate(row)
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      this.activate(row)
    }
  }
}

register('aurora-treeview', AuroraTreeview)
