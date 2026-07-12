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
