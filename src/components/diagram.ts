import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

export interface DiagramNode {
  id: string
  label: string
  x: number
  y: number
  color?: string
}

export interface DiagramEdge {
  from: string
  to: string
  label?: string
}

const NODE_W = 132
const NODE_H = 44

const STYLE = `
  :host {
    display: block; position: relative; overflow: hidden; touch-action: none;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; background: var(--aurora-surface, #0f0f18);
    background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 22px 22px; color: var(--aurora-fg, #ececf2);
  }
  svg { display: block; width: 100%; height: var(--aurora-diagram-height, 340px); cursor: grab; }
  svg.panning { cursor: grabbing; }
  .node { cursor: grab; }
  .node rect {
    fill: color-mix(in srgb, var(--c, #6d5cff) 18%, #14141f);
    stroke: color-mix(in srgb, var(--c, #6d5cff) 65%, transparent); stroke-width: 1.4;
    rx: 11;
  }
  .node.selected rect { stroke: var(--c, #6d5cff); stroke-width: 2.2; }
  .node text { fill: var(--aurora-fg, #ececf2); font-size: 12.5px; pointer-events: none; }
  .edge { fill: none; stroke: var(--aurora-muted, #9a98b3); stroke-width: 1.4; opacity: 0.6; }
  .edge-label { fill: var(--aurora-muted, #9a98b3); font-size: 10px; }
  marker path { fill: var(--aurora-muted, #9a98b3); opacity: 0.7; }
`

/**
 * `<aurora-diagram>` — a node-graph canvas: assign `nodes`
 * (`{ id, label, x, y, color? }[]`) and `edges` (`{ from, to, label? }[]`);
 * drag nodes and the curved arrows follow live, drag the background to pan,
 * wheel to zoom, click to select. Emits `aurora-select` with the node and
 * `aurora-move` after a node drag. `readonly` freezes the graph.
 */
export class AuroraDiagram extends AuroraElement {
  #nodes: DiagramNode[] = []
  #edges: DiagramEdge[] = []
  private view = { x: 0, y: 0, w: 800, h: 400 }
  private selected: string | null = null
  private drag: { node: DiagramNode; sx: number; sy: number; ox: number; oy: number } | null = null
  private pan: { sx: number; sy: number; ox: number; oy: number } | null = null

  get nodes(): DiagramNode[] {
    return this.#nodes
  }

  set nodes(v: DiagramNode[]) {
    this.#nodes = v ?? []
    this.render()
  }

  get edges(): DiagramEdge[] {
    return this.#edges
  }

  set edges(v: DiagramEdge[]) {
    this.#edges = v ?? []
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  private toWorld(e: PointerEvent): { x: number; y: number } {
    const svg = this.root.querySelector('svg')
    const r = svg?.getBoundingClientRect()
    if (!r || !r.width) return { x: e.clientX, y: e.clientY }
    return {
      x: this.view.x + ((e.clientX - r.left) / r.width) * this.view.w,
      y: this.view.y + ((e.clientY - r.top) / r.height) * this.view.h,
    }
  }

  private edgePath(a: DiagramNode, b: DiagramNode): string {
    const x1 = a.x + NODE_W / 2
    const y1 = a.y + NODE_H / 2
    const x2 = b.x + NODE_W / 2
    const y2 = b.y + NODE_H / 2
    const mx = (x1 + x2) / 2
    return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
  }

  private render(): void {
    const edges = this.#edges
      .map((e) => {
        const a = this.#nodes.find((n) => n.id === e.from)
        const b = this.#nodes.find((n) => n.id === e.to)
        if (!a || !b) return ''
        const mid = { x: (a.x + b.x) / 2 + NODE_W / 2, y: (a.y + b.y) / 2 + NODE_H / 2 }
        return `<path class="edge" marker-end="url(#arr)" d="${this.edgePath(a, b)}"/>${
          e.label
            ? `<text class="edge-label" x="${mid.x}" y="${mid.y - 6}" text-anchor="middle">${escapeHtml(e.label)}</text>`
            : ''
        }`
      })
      .join('')
    const nodes = this.#nodes
      .map(
        (n) =>
          `<g class="node${n.id === this.selected ? ' selected' : ''}" data-id="${escapeHtml(n.id)}" transform="translate(${n.x} ${n.y})" ${n.color ? `style="--c:${n.color}"` : ''} tabindex="0" role="button" aria-label="${escapeHtml(n.label)}"><rect width="${NODE_W}" height="${NODE_H}" rx="11"/><text x="${NODE_W / 2}" y="${NODE_H / 2 + 4}" text-anchor="middle">${escapeHtml(n.label)}</text></g>`,
      )
      .join('')
    this.root.innerHTML = `<style>${STYLE}</style>
      <svg viewBox="${this.view.x} ${this.view.y} ${this.view.w} ${this.view.h}" part="canvas">
        <defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z"/></marker></defs>
        ${edges}${nodes}
      </svg>`
    this.wire()
  }

  private updateViewBox(): void {
    this.root
      .querySelector('svg')
      ?.setAttribute('viewBox', `${this.view.x} ${this.view.y} ${this.view.w} ${this.view.h}`)
  }

  private wire(): void {
    const svg = this.root.querySelector('svg')
    if (!svg) return
    const readonly = this.hasAttribute('readonly')
    svg.addEventListener('pointerdown', (e) => {
      const g = (e.target as Element).closest?.('.node') as SVGGElement | null
      const world = this.toWorld(e)
      if (g && !readonly) {
        const node = this.#nodes.find((n) => n.id === g.dataset['id'])
        if (!node) return
        this.drag = { node, sx: world.x, sy: world.y, ox: node.x, oy: node.y }
        svg.setPointerCapture?.(e.pointerId)
      } else if (!g) {
        this.pan = { sx: e.clientX, sy: e.clientY, ox: this.view.x, oy: this.view.y }
        svg.classList.add('panning')
        svg.setPointerCapture?.(e.pointerId)
      }
    })
    svg.addEventListener('pointermove', (e) => {
      if (this.drag) {
        const world = this.toWorld(e)
        this.drag.node.x = this.drag.ox + (world.x - this.drag.sx)
        this.drag.node.y = this.drag.oy + (world.y - this.drag.sy)
        this.liveUpdate(this.drag.node)
      } else if (this.pan) {
        const r = svg.getBoundingClientRect()
        if (!r.width) return
        this.view.x = this.pan.ox - ((e.clientX - this.pan.sx) / r.width) * this.view.w
        this.view.y = this.pan.oy - ((e.clientY - this.pan.sy) / r.height) * this.view.h
        this.updateViewBox()
      }
    })
    const finish = (): void => {
      if (this.drag) {
        const node = this.drag.node
        this.drag = null
        this.render()
        this.dispatchEvent(
          new CustomEvent('aurora-move', { detail: { node, x: node.x, y: node.y } }),
        )
      }
      if (this.pan) {
        this.pan = null
        svg.classList.remove('panning')
      }
    }
    svg.addEventListener('pointerup', finish)
    svg.addEventListener('pointercancel', finish)
    svg.addEventListener('wheel', (e) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1.12 : 0.9
      const w = Math.min(Math.max(this.view.w * factor, 240), 4000)
      const h = w * (this.view.h / this.view.w)
      this.view.x += (this.view.w - w) / 2
      this.view.y += (this.view.h - h) / 2
      this.view.w = w
      this.view.h = h
      this.updateViewBox()
    })
    this.root.querySelectorAll<SVGGElement>('.node').forEach((g) => {
      g.addEventListener('click', () => {
        this.selected = g.dataset['id'] ?? null
        this.root.querySelectorAll('.node').forEach((n) => n.classList.toggle('selected', n === g))
        const node = this.#nodes.find((n) => n.id === this.selected)
        if (node) this.dispatchEvent(new CustomEvent('aurora-select', { detail: { node } }))
      })
    })
  }

  /** Redraw just the dragged node and its edges (fast path during drags). */
  private liveUpdate(node: DiagramNode): void {
    const g = this.root.querySelector(`.node[data-id="${CSS.escape(node.id)}"]`)
    g?.setAttribute('transform', `translate(${node.x} ${node.y})`)
    const paths = this.root.querySelectorAll('.edge')
    this.#edges.forEach((e, i) => {
      if (e.from !== node.id && e.to !== node.id) return
      const a = this.#nodes.find((n) => n.id === e.from)
      const b = this.#nodes.find((n) => n.id === e.to)
      if (a && b) paths[i]?.setAttribute('d', this.edgePath(a, b))
    })
  }
}

register('aurora-diagram', AuroraDiagram)
