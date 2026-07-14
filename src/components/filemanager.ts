import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { t } from '../core/i18n'
import './breadcrumb'
import './treeview'
import type { AuroraBreadcrumb } from './breadcrumb'
import type { AuroraTreeview, TreeNode } from './treeview'

export interface FsNode {
  name: string
  type: 'folder' | 'file'
  size?: number
  children?: FsNode[]
}

const ICONS: Record<string, string> = {
  folder: '📁',
  image: '🖼',
  code: '⌨',
  doc: '📄',
  media: '🎬',
  archive: '🗜',
}

function iconFor(node: FsNode): string {
  if (node.type === 'folder') return ICONS['folder'] ?? '📁'
  const ext = node.name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return ICONS['image'] ?? '🖼'
  if (['ts', 'js', 'json', 'html', 'css', 'py', 'go'].includes(ext)) return ICONS['code'] ?? '⌨'
  if (['mp4', 'webm', 'mp3', 'wav'].includes(ext)) return ICONS['media'] ?? '🎬'
  if (['zip', 'tar', 'gz'].includes(ext)) return ICONS['archive'] ?? '🗜'
  return ICONS['doc'] ?? '📄'
}

const STYLE = `
  :host {
    display: block; font-size: 0.88rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .top { padding: 10px 14px; border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08)); }
  .body { display: grid; grid-template-columns: 200px 1fr; min-height: 260px; }
  .side {
    border-right: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
    padding: 10px; overflow-y: auto;
  }
  .files { padding: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; }
  .tile {
    all: unset; cursor: pointer; width: 96px; padding: 12px 6px; border-radius: 12px;
    display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center;
  }
  .tile:hover { background: rgba(255, 255, 255, 0.05); }
  .tile:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .tile[aria-selected='true'] { background: rgba(109, 92, 255, 0.16); }
  .tile .ico { font-size: 1.7rem; }
  .tile .nm { font-size: 0.76rem; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tile .sz { font-size: 0.66rem; color: var(--aurora-muted, #9a98b3); }
  .empty { color: var(--aurora-muted, #9a98b3); padding: 30px; width: 100%; text-align: center; }
  @media (max-width: 640px) { .body { grid-template-columns: 1fr; } .side { display: none; } }
`

/**
 * `<aurora-filemanager>` — a file browser composed from aurora parts:
 * `aurora-breadcrumb` for the path, `aurora-treeview` for folders, and a
 * tile grid for contents. Assign `fs` (nested
 * `{ name, type, size?, children? }`); navigate by tree, crumb, or
 * double-click. Emits `aurora-open` with `{ path, node }` for files and
 * `aurora-select` on highlight.
 */
export class AuroraFilemanager extends AuroraElement {
  #fs: FsNode[] = []
  private path: string[] = []
  private selected: string | null = null

  get fs(): FsNode[] {
    return this.#fs
  }

  set fs(v: FsNode[]) {
    this.#fs = v ?? []
    this.path = []
    this.render()
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="top"><aurora-breadcrumb></aurora-breadcrumb></div>
      <div class="body">
        <div class="side"><aurora-treeview></aurora-treeview></div>
        <div class="files" part="files"></div>
      </div>`
    const crumb = this.root.querySelector('aurora-breadcrumb') as AuroraBreadcrumb | null
    crumb?.addEventListener('aurora-select', (e) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail
      this.path = this.path.slice(0, index)
      this.render()
    })
    const tree = this.root.querySelector('aurora-treeview') as AuroraTreeview | null
    tree?.addEventListener('aurora-select', (e) => {
      const { value } = (e as CustomEvent<{ value: string }>).detail
      this.path = value ? value.split('/').filter(Boolean) : []
      this.render()
    })
    this.render()
  }

  private cwd(): FsNode[] {
    let nodes = this.#fs
    for (const segment of this.path) {
      nodes = nodes.find((n) => n.name === segment && n.type === 'folder')?.children ?? []
    }
    return nodes
  }

  private toTree(nodes: FsNode[], prefix: string): TreeNode[] {
    return nodes
      .filter((n) => n.type === 'folder')
      .map((n) => ({
        label: n.name,
        value: `${prefix}${n.name}`,
        open: this.path.includes(n.name),
        children: this.toTree(n.children ?? [], `${prefix}${n.name}/`),
      }))
  }

  private fmtSize(bytes?: number): string {
    if (bytes === undefined) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  private render(): void {
    const crumb = this.root.querySelector('aurora-breadcrumb') as AuroraBreadcrumb | null
    if (crumb) crumb.items = [{ label: 'Home' }, ...this.path.map((p) => ({ label: p }))]
    const tree = this.root.querySelector('aurora-treeview') as AuroraTreeview | null
    if (tree) tree.items = this.toTree(this.#fs, '')
    const files = this.root.querySelector<HTMLElement>('.files')
    if (!files) return
    const nodes = this.cwd()
    files.innerHTML = nodes.length
      ? nodes
          .map(
            (n) =>
              `<button class="tile" data-n="${escapeHtml(n.name)}" data-t="${n.type}" aria-selected="${this.selected === n.name}"><span class="ico" aria-hidden="true">${iconFor(n)}</span><span class="nm">${escapeHtml(n.name)}</span><span class="sz">${n.type === 'folder' ? `${n.children?.length ?? 0} items` : this.fmtSize(n.size)}</span></button>`,
          )
          .join('')
      : `<div class="empty">${t('filemanager.empty')}</div>`
    files.querySelectorAll<HTMLButtonElement>('.tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        this.selected = tile.dataset['n'] ?? null
        files
          .querySelectorAll('.tile')
          .forEach((t) => t.setAttribute('aria-selected', String(t === tile)))
        const node = nodes.find((n) => n.name === this.selected)
        if (node)
          this.dispatchEvent(
            new CustomEvent('aurora-select', {
              detail: { node, path: [...this.path, node.name].join('/') },
            }),
          )
      })
      tile.addEventListener('dblclick', () => {
        const node = nodes.find((n) => n.name === tile.dataset['n'])
        if (!node) return
        if (node.type === 'folder') {
          this.path = [...this.path, node.name]
          this.selected = null
          this.render()
        } else {
          this.dispatchEvent(
            new CustomEvent('aurora-open', {
              detail: { node, path: [...this.path, node.name].join('/') },
            }),
          )
        }
      })
    })
    if (!prefersReducedMotion()) {
      const tiles = files.querySelectorAll('.tile')
      if (tiles.length)
        gsap.fromTo(
          tiles,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out', clearProps: 'all' },
        )
    }
  }
}

register('aurora-filemanager', AuroraFilemanager)
