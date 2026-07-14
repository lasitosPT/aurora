import { describe, expect, it } from 'vitest'
import './diagram'
import type { AuroraDiagram } from './diagram'

const NODES = [
  { id: 'a', label: 'Ingest', x: 40, y: 60 },
  { id: 'b', label: 'Process', x: 300, y: 60, color: '#22d3ee' },
  { id: 'c', label: 'Store', x: 560, y: 60 },
]
const EDGES = [
  { from: 'a', to: 'b', label: 'raw' },
  { from: 'b', to: 'c' },
]

function make(): AuroraDiagram {
  const el = document.createElement('aurora-diagram') as AuroraDiagram
  document.body.append(el)
  el.nodes = JSON.parse(JSON.stringify(NODES))
  el.edges = EDGES
  return el
}

describe('aurora-diagram', () => {
  it('renders nodes, curved edges with arrowheads, and labels', () => {
    const el = make()
    expect(el.shadowRoot?.querySelectorAll('.node').length).toBe(3)
    expect(el.shadowRoot?.querySelectorAll('.edge').length).toBe(2)
    expect(el.shadowRoot?.querySelector('.edge')?.getAttribute('marker-end')).toBe('url(#arr)')
    expect(el.shadowRoot?.querySelector('.edge-label')?.textContent).toBe('raw')
    expect(el.shadowRoot?.querySelector('.node[data-id="b"]')?.getAttribute('transform')).toBe(
      'translate(300 60)',
    )
    el.remove()
  })

  it('selects nodes on click and emits the node', () => {
    const el = make()
    let got = ''
    el.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ node: { id: string } }>).detail.node.id
    })
    const g = el.shadowRoot?.querySelector<SVGGElement>('.node[data-id="b"]')
    g?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(got).toBe('b')
    expect(el.shadowRoot?.querySelector('.node[data-id="b"]')?.classList.contains('selected')).toBe(
      true,
    )
    el.remove()
  })

  it('moves nodes through the drag pipeline and keeps edges attached', () => {
    const el = make()
    let moved: { x: number; y: number } | null = null
    el.addEventListener('aurora-move', (e) => {
      moved = (e as CustomEvent<{ x: number; y: number }>).detail
    })
    const svg = el.shadowRoot?.querySelector('svg')
    const g = el.shadowRoot?.querySelector('.node[data-id="a"]')
    g?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 70 }))
    svg?.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 120, clientY: 90 }))
    svg?.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    expect(moved).not.toBeNull()
    const d = el.shadowRoot?.querySelector('.edge')?.getAttribute('d') ?? ''
    expect(d.startsWith('M')).toBe(true)
    el.remove()
  })
})
