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
  li.filtered-out { display: none; }
  .cb {
    all: unset; width: 15px; height: 15px; border-radius: 5px; flex: none; box-sizing: border-box;
    border: 1.5px solid var(--aurora-border, rgba(128, 128, 128, 0.55));
    display: inline-grid; place-items: center; font-size: 10px; color: #fff; cursor: pointer;
  }
  .cb:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 1px; }
  .cb[data-state='on'] { background: var(--aurora-accent, #6d5cff); border-color: var(--aurora-accent, #6d5cff); }
  .cb[data-state='mixed'] { background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 45%, transparent); border-color: var(--aurora-accent, #6d5cff); }
  .filter {
    all: unset; box-sizing: border-box; width: 100%; margin-bottom: 8px;
    padding: 0.42rem 0.7rem; font: inherit; font-size: 0.88rem;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 9px;
  }
  .filter:focus { border-color: var(--aurora-accent, #6d5cff); }
  .loading { opacity: 0.55; font-size: 0.8em; padding: 0.3rem 0.55rem 0.3rem 1.6rem; color: var(--aurora-muted, #9a98b3); }
`

export interface TreeNode {
  label: string
  value?: string
  open?: boolean
  checked?: boolean
  children?: TreeNode[]
  /** Lazy branch: called on first expand; result becomes `children`. */
  load?: () => Promise<TreeNode[]>
}

/**
 * `<aurora-treeview>` — hierarchical navigation. Assign `items` (nested
 * `{ label, value?, open?, children? }`); branches expand/collapse with an
 * animated caret, and the full ARIA tree keyboard pattern works: Up/Down move
 * visible rows, Right expands, Left collapses, Enter selects. Emits
 * `aurora-select` with `{ value }` and `aurora-toggle` with `{ value, open }`.
 * `checkboxes` adds tri-state checking (branches cascade down, parents show
 * mixed; `checkedValues` + `aurora-check`); `filterable` adds a search box
 * (`filter(text)` keeps matches and their ancestors); nodes with a `load`
 * function fetch their children on first expand.
 */
export class AuroraTreeview extends AuroraElement {
  #items: TreeNode[] = []
  private selected: string | null = null
  private query = ''

  /** Leaf-level checked values (branches summarize as their leaves). */
  get checkedValues(): string[] {
    const out: string[] = []
    const walk = (nodes: TreeNode[]): void => {
      for (const n of nodes) {
        if (n.children?.length) walk(n.children)
        else if (n.checked) out.push(n.value ?? n.label)
      }
    }
    walk(this.#items)
    return out
  }

  set checkedValues(values: string[]) {
    const set = new Set(values)
    const walk = (nodes: TreeNode[]): void => {
      for (const n of nodes) {
        if (n.children?.length) walk(n.children)
        else n.checked = set.has(n.value ?? n.label)
      }
    }
    walk(this.#items)
    this.render()
  }

  /** Show only nodes matching `text` (and their ancestors). Empty clears. */
  filter(text: string): void {
    this.query = text.trim().toLowerCase()
    this.render()
  }

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

  private matchesQuery(n: TreeNode): boolean {
    if (!this.query) return true
    if (n.label.toLowerCase().includes(this.query)) return true
    return (n.children ?? []).some((c) => this.matchesQuery(c))
  }

  private checkState(n: TreeNode): 'on' | 'off' | 'mixed' {
    if (!n.children?.length) return n.checked ? 'on' : 'off'
    const states = n.children.map((c) => this.checkState(c))
    if (states.every((s) => s === 'on')) return 'on'
    if (states.every((s) => s === 'off')) return 'off'
    return 'mixed'
  }

  private render(): void {
    const checkboxes = this.hasAttribute('checkboxes')
    const branch = (nodes: TreeNode[]): string =>
      `<ul role="group">${nodes
        .map((n) => {
          const value = n.value ?? n.label
          const kids = (n.children && n.children.length > 0) || typeof n.load === 'function'
          const hidden = !this.matchesQuery(n)
          const forceOpen = this.query !== '' && !hidden
          const cb = checkboxes
            ? `<button class="cb" data-state="${this.checkState(n)}" role="checkbox" aria-checked="${
                { on: 'true', off: 'false', mixed: 'mixed' }[this.checkState(n)]
              }" aria-label="Check ${escapeHtml(n.label)}">${this.checkState(n) === 'on' ? '✓' : this.checkState(n) === 'mixed' ? '–' : ''}</button>`
            : ''
          return `<li role="treeitem" class="${kids ? '' : 'leaf'}${hidden ? ' filtered-out' : ''}"${kids ? ` aria-expanded="${forceOpen || n.open === true ? 'true' : n.open !== false && !n.load ? 'true' : 'false'}"` : ''}><div class="row" tabindex="-1" data-v="${escapeHtml(value)}" aria-selected="${value === this.selected}"><span class="caret" aria-hidden="true">▸</span>${cb}${escapeHtml(n.label)}</div>${kids && n.children ? branch(n.children) : ''}</li>`
        })
        .join('')}</ul>`
    this.root.innerHTML = `<style>${STYLE}</style>${
      this.hasAttribute('filterable')
        ? `<input class="filter" placeholder="Filter…" aria-label="Filter tree" value="${escapeHtml(this.query)}" />`
        : ''
    }${branch(this.#items).replace('role="group"', 'role="tree"')}`

    const filterBox = this.root.querySelector<HTMLInputElement>('.filter')
    filterBox?.addEventListener('input', () => {
      const pos = filterBox.selectionStart
      this.filter(filterBox.value)
      const next = this.root.querySelector<HTMLInputElement>('.filter')
      next?.focus()
      next?.setSelectionRange(pos, pos)
    })
    const rows = this.visibleRows()
    if (rows[0]) rows[0].tabIndex = 0
    this.root.querySelectorAll<HTMLElement>('.row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList?.contains('cb')) return
        this.activate(row)
      })
      row.addEventListener('keydown', (e) => this.onKey(e, row))
    })
    this.root.querySelectorAll<HTMLButtonElement>('.cb').forEach((cb) =>
      cb.addEventListener('click', (e) => {
        e.stopPropagation()
        const value = (cb.closest('.row') as HTMLElement | null)?.dataset['v'] ?? ''
        this.toggleCheck(value)
      }),
    )
  }

  private findNode(nodes: TreeNode[], value: string): TreeNode | null {
    for (const n of nodes) {
      if ((n.value ?? n.label) === value) return n
      const hit = this.findNode(n.children ?? [], value)
      if (hit) return hit
    }
    return null
  }

  private toggleCheck(value: string): void {
    const node = this.findNode(this.#items, value)
    if (!node) return
    const next = this.checkState(node) !== 'on'
    const cascade = (n: TreeNode): void => {
      n.checked = next
      n.children?.forEach(cascade)
    }
    cascade(node)
    this.render()
    this.dispatchEvent(
      new CustomEvent('aurora-check', {
        detail: { value, checked: next, values: this.checkedValues },
      }),
    )
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
      const node = this.findNode(this.#items, row.dataset.v ?? '')
      if (open && node?.load && !node.children) {
        const loading = document.createElement('div')
        loading.className = 'loading'
        loading.textContent = 'Loading…'
        li.appendChild(loading)
        li.setAttribute('aria-expanded', 'true')
        void node.load().then((children) => {
          node.children = children
          node.open = true
          delete node.load
          this.render()
          this.dispatchEvent(
            new CustomEvent('aurora-toggle', { detail: { value: row.dataset.v, open: true } }),
          )
        })
        return
      }
      if (node) node.open = open
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
