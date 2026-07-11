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

describe('aurora-grid (kendo parity wave 1)', () => {
  it('multi-sorts with shift+click', () => {
    const grid = buildGrid()
    const click = (f: string, shift = false) =>
      grid.shadowRoot
        ?.querySelector<HTMLButtonElement>(`[data-sort="${f}"]`)
        ?.dispatchEvent(new MouseEvent('click', { shiftKey: shift, bubbles: true }))
    click('lang')
    click('stars', true)
    expect(cellTexts(grid, 0)).toEqual(['Volley', 'Critique', 'Statelet', 'Pulse'])
    grid.remove()
  })

  it('searches across all columns via the toolbar', () => {
    const grid = buildGrid({ searchable: '' })
    const box = grid.shadowRoot?.querySelector<HTMLInputElement>('[data-search]')
    box!.value = 'go'
    box!.dispatchEvent(new Event('input'))
    expect(cellTexts(grid, 0)).toEqual(['Volley'])
    grid.remove()
  })

  it('groups with collapsible headers and per-group aggregates', () => {
    const grid = buildGrid()
    grid.columns = [
      { field: 'name', title: 'Project' },
      { field: 'stars', title: 'Stars', aggregate: 'sum' },
      { field: 'lang', title: 'Language' },
    ]
    grid.groupBy = 'lang'
    const groups = grid.shadowRoot?.querySelectorAll('tr.group-row')
    expect(groups?.length).toBe(2)
    expect(groups?.[1]?.textContent).toContain('TypeScript (3)')
    expect(groups?.[1]?.textContent).toContain('sum: 680')
    ;(groups?.[0] as HTMLElement).click()
    expect(grid.shadowRoot?.querySelectorAll('tbody tr:not(.group-row)').length).toBe(3)
    grid.remove()
  })

  it('renders footer aggregates', () => {
    const grid = buildGrid()
    grid.columns = [{ field: 'name' }, { field: 'stars', aggregate: 'max' }, { field: 'lang' }]
    expect(grid.shadowRoot?.querySelector('tfoot')?.textContent).toContain('max: 320')
    grid.remove()
  })

  it('edits a cell inline and emits aurora-edit', () => {
    const grid = buildGrid({ editable: '' })
    let detail: Record<string, unknown> = {}
    grid.addEventListener('aurora-edit', (e) => {
      detail = (e as CustomEvent<Record<string, unknown>>).detail
    })
    const td = grid.shadowRoot?.querySelector<HTMLElement>('[data-edit="stars"]')
    td!.dispatchEvent(new MouseEvent('dblclick'))
    const input = td!.querySelector('input')
    input!.value = '999'
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(detail.value).toBe(999)
    expect(grid.data.some((r) => r.stars === 999)).toBe(true)
    grid.remove()
  })

  it('expands row detail templates', () => {
    const grid = buildGrid()
    grid.detail = (row) => `About ${String(row.name)}`
    grid.shadowRoot?.querySelector<HTMLButtonElement>('[data-expand="0"]')?.click()
    expect(grid.shadowRoot?.querySelector('tr.detail-row')?.textContent).toContain('About Pulse')
    grid.remove()
  })

  it('exports CSV of the full filtered view', () => {
    const grid = buildGrid()
    const csv = grid.toCsv()
    expect(csv.split('\n').length).toBe(5)
    expect(csv).toContain('"Project","Stars","Language"')
    expect(csv).toContain('"Volley","95","Go"')
    grid.remove()
  })

  it('hides and shows columns via toggleColumn', () => {
    const grid = buildGrid()
    grid.toggleColumn('lang')
    expect(grid.shadowRoot?.querySelectorAll('thead th').length).toBe(2)
    grid.toggleColumn('lang')
    expect(grid.shadowRoot?.querySelectorAll('thead th').length).toBe(3)
    grid.remove()
  })
})

describe('aurora-grid (kendo parity wave 2)', () => {
  it('renders resize handles with resizable', () => {
    const grid = buildGrid({ resizable: '' })
    expect(grid.shadowRoot?.querySelectorAll('.rz').length).toBe(3)
    grid.remove()
  })

  it('reorders columns by drag and drop', () => {
    const grid = buildGrid({ reorderable: '' })
    let order: string[] = []
    grid.addEventListener('aurora-reorder', (e) => {
      order = (e as CustomEvent<{ order: string[] }>).detail.order
    })
    const ths = grid.shadowRoot?.querySelectorAll<HTMLElement>('th[data-col]')
    ths?.[2]?.dispatchEvent(new Event('dragstart'))
    ths?.[0]?.dispatchEvent(new Event('drop'))
    expect(order).toEqual(['lang', 'name', 'stars'])
    expect(grid.shadowRoot?.querySelector('th')?.textContent).toContain('Language')
    grid.remove()
  })

  it('navigates cells with arrow keys', () => {
    const grid = buildGrid()
    const cells = grid.shadowRoot?.querySelectorAll<HTMLElement>('td[data-cell]')
    expect(cells?.[0]?.tabIndex).toBe(0)
    cells?.[0]?.focus()
    cells?.[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(grid.shadowRoot?.activeElement).toBe(cells?.[1])
    grid.remove()
  })
})
