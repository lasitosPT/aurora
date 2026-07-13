import { describe, expect, it } from 'vitest'
import './treelist'
import type { AuroraTreelist } from './treelist'

const flat = [
  { id: 1, name: 'src', size: 0 },
  { id: 2, name: 'components', size: 0, parentId: 1 },
  { id: 3, name: 'grid.ts', size: 31, parentId: 2 },
  { id: 4, name: 'button.ts', size: 4, parentId: 2 },
  { id: 5, name: 'core', size: 0, parentId: 1 },
  { id: 6, name: 'README.md', size: 2 },
]

function makeList(): AuroraTreelist {
  const el = document.createElement('aurora-treelist') as AuroraTreelist
  document.body.append(el)
  el.columns = [
    { field: 'name', title: 'Name' },
    { field: 'size', title: 'kB', align: 'right' },
  ]
  el.data = flat
  return el
}

describe('aurora-treelist', () => {
  it('assembles a hierarchy from flat id/parentId rows and expands by default', () => {
    const el = makeList()
    const rows = el.shadowRoot?.querySelectorAll('tbody tr[data-key]')
    expect(rows?.length).toBe(6)
    const first = el.shadowRoot?.querySelector('tr[data-key="1"]')
    expect(first?.getAttribute('aria-level')).toBe('1')
    expect(el.shadowRoot?.querySelector('tr[data-key="3"]')?.getAttribute('aria-level')).toBe('3')
    el.remove()
  })

  it('collapses and expands branches, emitting aurora-toggle', () => {
    const el = makeList()
    let toggled: { expanded: boolean } | null = null
    el.addEventListener('aurora-toggle', (e) => {
      toggled = (e as CustomEvent<{ expanded: boolean }>).detail
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('tr[data-key="2"] .caret')?.click()
    expect(toggled).toEqual(expect.objectContaining({ expanded: false }))
    expect(el.shadowRoot?.querySelectorAll('tbody tr[data-key]').length).toBe(4)
    el.collapseAll()
    expect(el.shadowRoot?.querySelectorAll('tbody tr[data-key]').length).toBe(2)
    el.expandAll()
    expect(el.shadowRoot?.querySelectorAll('tbody tr[data-key]').length).toBe(6)
    el.remove()
  })

  it('sorts sibling groups without breaking the hierarchy', () => {
    const el = makeList()
    el.shadowRoot?.querySelector<HTMLButtonElement>('.sort-btn[data-sort="name"]')?.click()
    const names = Array.from(el.shadowRoot?.querySelectorAll('tbody tr[data-key]') ?? []).map(
      (tr) => tr.querySelector('.cell0')?.textContent?.replace('▶', '') ?? '',
    )
    expect(names).toEqual(['README.md', 'src', 'components', 'button.ts', 'grid.ts', 'core'])
    el.remove()
  })

  it('supports nested children arrays and selection', () => {
    const el = document.createElement('aurora-treelist') as AuroraTreelist
    el.setAttribute('selectable', '')
    document.body.append(el)
    el.columns = [{ field: 'name' }]
    el.data = [{ name: 'root', children: [{ name: 'leaf' }] }]
    let selected = ''
    el.addEventListener('aurora-select', (e) => {
      selected = String((e as CustomEvent<{ row: { name: string } }>).detail.row.name)
    })
    const rows = el.shadowRoot?.querySelectorAll<HTMLTableRowElement>('tbody tr[data-key]')
    expect(rows?.length).toBe(2)
    rows?.[1]?.click()
    expect(selected).toBe('leaf')
    expect(el.shadowRoot?.querySelector('tr[aria-selected="true"]')).not.toBeNull()
    el.remove()
  })
})
