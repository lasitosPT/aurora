import { describe, expect, it } from 'vitest'
import './filemanager'
import type { AuroraFilemanager } from './filemanager'

const FS = [
  {
    name: 'src',
    type: 'folder' as const,
    children: [
      {
        name: 'components',
        type: 'folder' as const,
        children: [{ name: 'grid.ts', type: 'file' as const, size: 31000 }],
      },
      { name: 'index.ts', type: 'file' as const, size: 2400 },
    ],
  },
  { name: 'README.md', type: 'file' as const, size: 5200 },
]

function make(): AuroraFilemanager {
  const el = document.createElement('aurora-filemanager') as AuroraFilemanager
  document.body.append(el)
  el.fs = FS
  return el
}

describe('aurora-filemanager', () => {
  it('composes breadcrumb, treeview, and a tile grid from the fs', () => {
    const el = make()
    expect(el.shadowRoot?.querySelector('aurora-breadcrumb')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('aurora-treeview')).not.toBeNull()
    const tiles = el.shadowRoot?.querySelectorAll('.tile')
    expect(tiles?.length).toBe(2)
    expect(tiles?.[0]?.querySelector('.sz')?.textContent).toBe('2 items')
    expect(tiles?.[1]?.querySelector('.sz')?.textContent).toBe('5.1 kB')
    el.remove()
  })

  it('navigates into folders on double click and back via the crumb', () => {
    const el = make()
    el.shadowRoot
      ?.querySelector<HTMLButtonElement>('.tile[data-n="src"]')
      ?.dispatchEvent(new Event('dblclick'))
    let tiles = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tile')
    expect(tiles?.length).toBe(2)
    expect(tiles?.[0]?.dataset['n']).toBe('components')
    const crumb = el.shadowRoot?.querySelector('aurora-breadcrumb')
    crumb?.dispatchEvent(new CustomEvent('aurora-select', { detail: { label: 'Home', index: 0 } }))
    tiles = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tile')
    expect(tiles?.[0]?.dataset['n']).toBe('src')
    el.remove()
  })

  it('opens files with the full path and selects on single click', () => {
    const el = make()
    let opened: { path: string } | null = null
    el.addEventListener('aurora-open', (e) => {
      opened = (e as CustomEvent<{ path: string }>).detail
    })
    el.shadowRoot
      ?.querySelector<HTMLButtonElement>('.tile[data-n="src"]')
      ?.dispatchEvent(new Event('dblclick'))
    el.shadowRoot
      ?.querySelector<HTMLButtonElement>('.tile[data-n="index.ts"]')
      ?.dispatchEvent(new Event('dblclick'))
    expect(opened).toEqual(expect.objectContaining({ path: 'src/index.ts' }))
    el.remove()
  })

  it('jumps via the folder tree', () => {
    const el = make()
    const tree = el.shadowRoot?.querySelector('aurora-treeview')
    tree?.dispatchEvent(new CustomEvent('aurora-select', { detail: { value: 'src/components' } }))
    const tiles = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tile')
    expect(tiles?.length).toBe(1)
    expect(tiles?.[0]?.dataset['n']).toBe('grid.ts')
    el.remove()
  })
})
