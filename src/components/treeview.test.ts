import { describe, expect, it } from 'vitest'
import './treeview'
import type { AuroraTreeview } from './treeview'

const ITEMS = [
  {
    label: 'src',
    open: true,
    children: [{ label: 'components', children: [{ label: 'grid.ts' }] }, { label: 'index.ts' }],
  },
  { label: 'README.md' },
]

describe('aurora-treeview', () => {
  it('registers, renders the hierarchy and toggles branches', () => {
    const el = document.createElement('aurora-treeview') as AuroraTreeview
    document.body.append(el)
    el.items = ITEMS
    expect(el.shadowRoot?.querySelectorAll('li').length).toBe(5)
    const src = el.shadowRoot?.querySelector('li')
    expect(src?.getAttribute('aria-expanded')).toBe('true')

    let toggled: Record<string, unknown> = {}
    el.addEventListener('aurora-toggle', (e) => {
      toggled = (e as CustomEvent<Record<string, unknown>>).detail
    })
    src?.querySelector<HTMLElement>('.row')?.click()
    expect(src?.getAttribute('aria-expanded')).toBe('false')
    expect(toggled.open).toBe(false)
    el.remove()
  })

  it('selects leaves and emits aurora-select', () => {
    const el = document.createElement('aurora-treeview') as AuroraTreeview
    document.body.append(el)
    el.items = ITEMS
    let selected = ''
    el.addEventListener('aurora-select', (e) => {
      selected = (e as CustomEvent<{ value: string }>).detail.value
    })
    const readme = el.shadowRoot?.querySelector<HTMLElement>('[data-v="README.md"]')
    readme?.click()
    expect(selected).toBe('README.md')
    expect(readme?.getAttribute('aria-selected')).toBe('true')
    el.remove()
  })
})

describe('treeview depth (v1.5)', () => {
  const ITEMS = [
    {
      label: 'src',
      children: [
        { label: 'grid.ts', value: 'grid' },
        { label: 'chart.ts', value: 'chart' },
      ],
    },
    { label: 'README.md', value: 'readme' },
  ]

  it('cascades tri-state checkboxes down and summarizes up', () => {
    const el = document.createElement('aurora-treeview') as AuroraTreeview
    el.setAttribute('checkboxes', '')
    document.body.append(el)
    el.items = JSON.parse(JSON.stringify(ITEMS))
    let got: string[] = []
    el.addEventListener('aurora-check', (e) => {
      got = (e as CustomEvent<{ values: string[] }>).detail.values
    })
    // check the branch — both leaves check
    el.shadowRoot?.querySelector<HTMLButtonElement>('.row[data-v="src"] .cb')?.click()
    expect(got.sort()).toEqual(['chart', 'grid'])
    expect(el.shadowRoot?.querySelector('.row[data-v="src"] .cb')?.getAttribute('data-state')).toBe(
      'on',
    )
    // uncheck one leaf — parent goes mixed
    el.shadowRoot?.querySelector<HTMLButtonElement>('.row[data-v="grid"] .cb')?.click()
    expect(el.shadowRoot?.querySelector('.row[data-v="src"] .cb')?.getAttribute('data-state')).toBe(
      'mixed',
    )
    expect(el.checkedValues).toEqual(['chart'])
    el.remove()
  })

  it('filters to matches and their ancestors', () => {
    const el = document.createElement('aurora-treeview') as AuroraTreeview
    el.setAttribute('filterable', '')
    document.body.append(el)
    el.items = JSON.parse(JSON.stringify(ITEMS))
    el.filter('chart')
    expect(
      el.shadowRoot
        ?.querySelector('.row[data-v="readme"]')
        ?.closest('li')
        ?.classList.contains('filtered-out'),
    ).toBe(true)
    expect(
      el.shadowRoot
        ?.querySelector('.row[data-v="chart"]')
        ?.closest('li')
        ?.classList.contains('filtered-out'),
    ).toBe(false)
    expect(
      el.shadowRoot
        ?.querySelector('.row[data-v="src"]')
        ?.closest('li')
        ?.classList.contains('filtered-out'),
    ).toBe(false)
    el.filter('')
    expect(el.shadowRoot?.querySelectorAll('li.filtered-out').length).toBe(0)
    el.remove()
  })

  it('loads lazy branches on first expand', async () => {
    const el = document.createElement('aurora-treeview') as AuroraTreeview
    document.body.append(el)
    el.items = [
      {
        label: 'Remote',
        value: 'remote',
        load: () => Promise.resolve([{ label: 'fetched.ts', value: 'fetched' }]),
      },
    ]
    const row = el.shadowRoot?.querySelector<HTMLElement>('.row[data-v="remote"]')
    expect(row?.closest('li')?.getAttribute('aria-expanded')).toBe('false')
    row?.click()
    await new Promise((r) => setTimeout(r, 0))
    expect(el.shadowRoot?.querySelector('.row[data-v="fetched"]')).not.toBeNull()
    el.remove()
  })
})

describe('treeview node drag-and-drop (v1.12)', () => {
  it('re-parents via moveNode and refuses descendants', () => {
    const el = document.createElement('aurora-treeview') as AuroraTreeview
    el.setAttribute('draggable-nodes', '')
    document.body.append(el)
    el.items = [{ label: 'a', children: [{ label: 'a1' }] }, { label: 'b' }]
    let moved: { value: string; parent: string | null } | null = null
    el.addEventListener('aurora-move', (e) => {
      moved = (e as CustomEvent<{ value: string; parent: string | null }>).detail
    })
    expect(el.moveNode('b', 'a')).toBe(true)
    expect(moved).toEqual({ value: 'b', parent: 'a' })
    expect(el.items[0]?.children?.map((c) => c.label)).toEqual(['a1', 'b'])
    // refuse moving a into its own descendant
    expect(el.moveNode('a', 'a1')).toBe(false)
    // move back to root
    expect(el.moveNode('b', null)).toBe(true)
    expect(el.items.map((n) => n.label)).toEqual(['a', 'b'])
    el.remove()
  })
})
