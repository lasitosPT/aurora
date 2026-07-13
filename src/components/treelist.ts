import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

export interface TreeListColumn {
  field: string
  title?: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  formatter?: (value: unknown, row: Record<string, unknown>) => string
}

interface Node {
  row: Record<string, unknown>
  children: Node[]
  key: string
  level: number
}

const STYLE = `
  :host {
    display: block;
    font-size: 0.92rem;
    color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: var(--aurora-grid-radius, 14px);
    background: var(--aurora-surface, #14141f);
    overflow: hidden;
  }
  .viewport { overflow: auto; max-height: var(--aurora-grid-height, none); }
  table { width: 100%; border-collapse: collapse; }
  thead { position: sticky; top: 0; z-index: 2; background: var(--aurora-surface, #14141f); }
  th, td {
    text-align: left;
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
    white-space: nowrap;
  }
  th { font-weight: 600; user-select: none; }
  .sort-btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font: inherit; }
  .sort-btn:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .arrow { font-size: 0.7em; opacity: 0; transition: opacity 0.15s ease; }
  th[aria-sort='ascending'] .arrow, th[aria-sort='descending'] .arrow { opacity: 1; color: var(--aurora-accent, #6d5cff); }
  tbody tr { transition: background 0.15s ease; }
  tbody tr:hover { background: rgba(255, 255, 255, 0.035); }
  tbody tr:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px; }
  tbody tr[aria-selected='true'] { background: rgba(109, 92, 255, 0.14) !important; }
  :host([selectable]) tbody tr { cursor: pointer; }
  :host([dense]) th, :host([dense]) td { padding: 0.4rem 0.7rem; }
  td.num, th.num { text-align: right; }
  td.center, th.center { text-align: center; }
  .cell0 { display: inline-flex; align-items: center; gap: 6px; }
  .caret {
    all: unset; cursor: pointer; width: 18px; height: 18px; display: inline-grid;
    place-items: center; border-radius: 5px; color: var(--aurora-muted, #9a98b3);
    transition: transform 0.2s ease, color 0.15s ease; font-size: 0.72em;
  }
  .caret:hover { color: var(--aurora-fg, #ececf2); }
  .caret:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  tr[aria-expanded='true'] .caret { transform: rotate(90deg); }
  .caret.leaf { visibility: hidden; }
  .empty { padding: 26px; text-align: center; color: var(--aurora-muted, #9a98b3); }
`

/**
 * `<aurora-treelist>` — a hierarchical data grid. Feed `columns` and `data`
 * (nested `children` arrays, or flat rows with id/parent fields — see
 * `id-field`/`parent-field`); rows expand and collapse with staggered child
 * reveals, header clicks sort sibling groups without breaking the hierarchy,
 * and arrow keys navigate rows treeview-style. Emits `aurora-toggle`,
 * `aurora-sort`, and (with `selectable`) `aurora-select`.
 */
export class AuroraTreelist extends AuroraElement {
  #columns: TreeListColumn[] = []
  #data: Record<string, unknown>[] = []
  private nodes: Node[] = []
  private expanded = new Set<string>()
  private selectedKey: string | null = null
  private focusKey: string | null = null
  private sortField: string | null = null
  private sortDir: 1 | -1 = 1

  get columns(): TreeListColumn[] {
    return this.#columns
  }

  set columns(cols: TreeListColumn[]) {
    this.#columns = cols
    this.renderAll()
  }

  get data(): Record<string, unknown>[] {
    return this.#data
  }

  set data(rows: Record<string, unknown>[]) {
    this.#data = rows
    this.buildNodes()
    if (!this.hasAttribute('collapsed')) this.expandAll(false)
    this.renderAll()
  }

  connectedCallback(): void {
    this.renderAll()
  }

  expandAll(render = true): void {
    const walk = (nodes: Node[]): void => {
      for (const n of nodes) {
        if (n.children.length) this.expanded.add(n.key)
        walk(n.children)
      }
    }
    this.expanded.clear()
    walk(this.nodes)
    if (render) this.renderAll()
  }

  collapseAll(): void {
    this.expanded.clear()
    this.renderAll()
  }

  private buildNodes(): void {
    const idField = this.getAttribute('id-field') ?? 'id'
    const parentField = this.getAttribute('parent-field') ?? 'parentId'
    const hasChildren = this.#data.some((r) => Array.isArray(r['children']))
    const make = (row: Record<string, unknown>, key: string, level: number): Node => ({
      row,
      key,
      level,
      children: [],
    })
    if (hasChildren) {
      const walk = (rows: Record<string, unknown>[], prefix: string, level: number): Node[] =>
        rows.map((row, i) => {
          const node = make(row, `${prefix}${i}`, level)
          const kids = row['children']
          if (Array.isArray(kids))
            node.children = walk(kids as Record<string, unknown>[], `${node.key}.`, level + 1)
          return node
        })
      this.nodes = walk(this.#data, '', 0)
      return
    }
    const byId = new Map<unknown, Node>()
    const roots: Node[] = []
    for (const [i, row] of this.#data.entries())
      byId.set(row[idField], make(row, String(row[idField] ?? i), 0))
    for (const row of this.#data) {
      const node = byId.get(row[idField])
      if (!node) continue
      const parent = row[parentField] == null ? undefined : byId.get(row[parentField])
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
    const relevel = (nodes: Node[], level: number): void => {
      for (const n of nodes) {
        n.level = level
        relevel(n.children, level + 1)
      }
    }
    relevel(roots, 0)
    this.nodes = roots
  }

  private visibleNodes(): Node[] {
    const cmp = (a: Node, b: Node): number => {
      if (!this.sortField) return 0
      const va = a.row[this.sortField]
      const vb = b.row[this.sortField]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * this.sortDir
      return String(va ?? '').localeCompare(String(vb ?? '')) * this.sortDir
    }
    const out: Node[] = []
    const walk = (nodes: Node[]): void => {
      const ordered = this.sortField ? [...nodes].sort(cmp) : nodes
      for (const n of ordered) {
        out.push(n)
        if (n.children.length && this.expanded.has(n.key)) walk(n.children)
      }
    }
    walk(this.nodes)
    return out
  }

  private renderAll(freshKeys: string[] = []): void {
    const visible = this.visibleNodes()
    if (this.focusKey === null) this.focusKey = visible[0]?.key ?? null
    const header = this.#columns
      .map((c) => {
        const sortable = c.sortable !== false
        const sorted =
          this.sortField === c.field ? (this.sortDir === 1 ? 'ascending' : 'descending') : null
        const label = escapeHtml(c.title ?? c.field)
        return `<th class="${c.align === 'right' ? 'num' : c.align === 'center' ? 'center' : ''}"${
          c.width ? ` style="width:${c.width}"` : ''
        }${sorted ? ` aria-sort="${sorted}"` : ''}>${
          sortable
            ? `<button class="sort-btn" data-sort="${escapeHtml(c.field)}">${label}<span class="arrow">${
                this.sortDir === 1 ? '▲' : '▼'
              }</span></button>`
            : label
        }</th>`
      })
      .join('')
    const body = visible.length
      ? visible
          .map((n) => {
            const cells = this.#columns
              .map((c, ci) => {
                const raw = n.row[c.field]
                const text = c.formatter ? c.formatter(raw, n.row) : escapeHtml(String(raw ?? ''))
                const cls = c.align === 'right' ? 'num' : c.align === 'center' ? 'center' : ''
                if (ci === 0)
                  return `<td class="${cls}" style="padding-left:${0.9 + n.level * 1.35}rem"><span class="cell0"><button class="caret${
                    n.children.length ? '' : ' leaf'
                  }" tabindex="-1" aria-label="Toggle">▶</button>${text}</span></td>`
                return `<td class="${cls}">${text}</td>`
              })
              .join('')
            return `<tr data-key="${escapeHtml(n.key)}"${freshKeys.includes(n.key) ? ' data-fresh' : ''} role="row" aria-level="${
              n.level + 1
            }"${n.children.length ? ` aria-expanded="${this.expanded.has(n.key)}"` : ''}${
              this.selectedKey === n.key ? ' aria-selected="true"' : ''
            } tabindex="${this.focusKey === n.key ? 0 : -1}">${cells}</tr>`
          })
          .join('')
      : `<tr><td colspan="${this.#columns.length}"><div class="empty">No data</div></td></tr>`
    this.root.innerHTML = `<style>${STYLE}</style><div class="viewport"><table role="treegrid"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`
    this.wire(visible)
    if (freshKeys.length && !prefersReducedMotion()) {
      const fresh = this.root.querySelectorAll('tr[data-fresh]')
      if (fresh.length)
        gsap.fromTo(
          fresh,
          { opacity: 0, x: -8 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' },
        )
    }
  }

  private toggle(key: string): void {
    const node = this.findNode(key)
    if (!node || !node.children.length) return
    const opening = !this.expanded.has(key)
    if (opening) this.expanded.add(key)
    else this.expanded.delete(key)
    this.focusKey = key
    this.renderAll(opening ? node.children.map((c) => c.key) : [])
    this.root.querySelector<HTMLElement>(`tr[data-key="${CSS.escape(key)}"]`)?.focus()
    this.dispatchEvent(
      new CustomEvent('aurora-toggle', { detail: { row: node.row, expanded: opening } }),
    )
  }

  private findNode(key: string): Node | null {
    let found: Node | null = null
    const walk = (nodes: Node[]): void => {
      for (const n of nodes) {
        if (n.key === key) {
          found = n
          return
        }
        walk(n.children)
        if (found) return
      }
    }
    walk(this.nodes)
    return found
  }

  private wire(visible: Node[]): void {
    this.root.querySelectorAll<HTMLButtonElement>('.sort-btn').forEach((btn) =>
      btn.addEventListener('click', () => {
        const field = btn.dataset['sort'] ?? ''
        if (this.sortField === field && this.sortDir === -1) this.sortField = null
        else if (this.sortField === field) this.sortDir = -1
        else {
          this.sortField = field
          this.sortDir = 1
        }
        this.renderAll()
        this.dispatchEvent(
          new CustomEvent('aurora-sort', {
            detail: {
              field: this.sortField,
              dir: this.sortField ? (this.sortDir === 1 ? 'asc' : 'desc') : null,
            },
          }),
        )
      }),
    )
    this.root.querySelectorAll<HTMLTableRowElement>('tbody tr[data-key]').forEach((tr) => {
      const key = tr.dataset['key'] ?? ''
      tr.querySelector('.caret')?.addEventListener('click', (e) => {
        e.stopPropagation()
        this.toggle(key)
      })
      tr.addEventListener('click', () => {
        if (!this.hasAttribute('selectable')) return
        const node = this.findNode(key)
        if (!node) return
        this.selectedKey = key
        this.focusKey = key
        this.renderAll()
        this.dispatchEvent(new CustomEvent('aurora-select', { detail: { row: node.row } }))
      })
      tr.addEventListener('keydown', (e) => {
        const idx = visible.findIndex((n) => n.key === key)
        const node = visible[idx]
        if (!node) return
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const next = visible[idx + (e.key === 'ArrowDown' ? 1 : -1)]
          if (next) {
            this.focusKey = next.key
            this.renderAll()
            this.root.querySelector<HTMLElement>(`tr[data-key="${CSS.escape(next.key)}"]`)?.focus()
          }
        } else if (e.key === 'ArrowRight' && node.children.length && !this.expanded.has(key)) {
          e.preventDefault()
          this.toggle(key)
        } else if (e.key === 'ArrowLeft' && this.expanded.has(key)) {
          e.preventDefault()
          this.toggle(key)
        } else if (e.key === 'Enter' && this.hasAttribute('selectable')) {
          e.preventDefault()
          tr.click()
        }
      })
    })
  }
}

register('aurora-treelist', AuroraTreelist)
