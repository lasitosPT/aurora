import { describe, expect, it } from 'vitest'
import './grid'
import type { AuroraGrid } from './grid'

const DATA = [
  { name: 'Pulse', stars: 320, lang: 'TypeScript' },
  { name: 'Volley', stars: 95, lang: 'Go' },
  { name: 'Statelet', stars: 210, lang: 'TypeScript' },
  { name: 'Critique', stars: 150, lang: 'TypeScript' },
]

function buildGrid(attrs: Record<string, string> = {}): AuroraGrid {
  const grid = document.createElement('aurora-grid') as AuroraGrid
  Object.entries(attrs).forEach(([key, value]) => grid.setAttribute(key, value))
  document.body.append(grid)
  grid.columns = [
    { field: 'name', title: 'Project' },
    { field: 'stars', title: 'Stars', align: 'right' },
    { field: 'lang', title: 'Language' },
  ]
  grid.data = DATA
  return grid
}

const cellTexts = (grid: AuroraGrid, col: number): string[] =>
  Array.from(grid.shadowRoot?.querySelectorAll('tbody tr') ?? []).map(
    (tr) => tr.children[col]?.textContent ?? '',
  )

describe('aurora-grid', () => {
  it('is registered and renders rows from data', () => {
    expect(customElements.get('aurora-grid')).toBeTypeOf('function')
    const grid = buildGrid()
    expect(grid.shadowRoot?.querySelectorAll('tbody tr').length).toBe(4)
    expect(grid.shadowRoot?.querySelector('th')?.textContent).toContain('Project')
    grid.remove()
  })

  it('sorts numerically and cycles asc → desc → off', () => {
    const grid = buildGrid()
    const sortStars = (): void =>
      grid.shadowRoot?.querySelector<HTMLButtonElement>('[data-sort="stars"]')?.click()
    sortStars()
    expect(cellTexts(grid, 1)).toEqual(['95', '150', '210', '320'])
    sortStars()
    expect(cellTexts(grid, 1)).toEqual(['320', '210', '150', '95'])
    sortStars()
    expect(cellTexts(grid, 1)).toEqual(['320', '95', '210', '150'])
    grid.remove()
  })

  it('filters per column and shows the empty state', () => {
    const grid = buildGrid({ filterable: '' })
    const input = grid.shadowRoot?.querySelector<HTMLInputElement>('[data-filter="lang"]')
    input!.value = 'go'
    input!.dispatchEvent(new Event('input'))
    expect(cellTexts(grid, 0)).toEqual(['Volley'])

    const again = grid.shadowRoot?.querySelector<HTMLInputElement>('[data-filter="lang"]')
    again!.value = 'zzz'
    again!.dispatchEvent(new Event('input'))
    expect(grid.shadowRoot?.querySelector('.empty')).not.toBeNull()
    grid.remove()
  })

  it('pages and reports the range', () => {
    const grid = buildGrid({ 'page-size': '3' })
    expect(grid.shadowRoot?.querySelectorAll('tbody tr').length).toBe(3)
    expect(grid.shadowRoot?.querySelector('.pager')?.textContent).toContain('1–3 of 4')
    grid.shadowRoot?.querySelector<HTMLButtonElement>('[data-page="next"]')?.click()
    expect(grid.shadowRoot?.querySelectorAll('tbody tr').length).toBe(1)
    grid.remove()
  })

  it('selects rows with checkboxes and select-all, emitting aurora-selection', () => {
    const grid = buildGrid({ selectable: 'multiple' })
    let last: unknown[] = []
    grid.addEventListener('aurora-selection', (event) => {
      last = (event as CustomEvent<{ selected: unknown[] }>).detail.selected
    })
    grid.shadowRoot?.querySelector<HTMLInputElement>('[data-row="1"]')!.click()
    expect(grid.selected.length).toBe(1)
    expect(last.length).toBe(1)

    grid.shadowRoot?.querySelector<HTMLInputElement>('[data-all]')!.click()
    expect(grid.selected.length).toBe(4)
    grid.remove()
  })

  it('applies formatters', () => {
    const grid = document.createElement('aurora-grid') as AuroraGrid
    document.body.append(grid)
    grid.columns = [{ field: 'stars', formatter: (v) => `★ ${String(v)}` }]
    grid.data = [{ stars: 7 }]
    expect(grid.shadowRoot?.querySelector('td')?.textContent).toBe('★ 7')
    grid.remove()
  })
})
