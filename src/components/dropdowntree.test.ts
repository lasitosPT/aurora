import { describe, expect, it } from 'vitest'
import './dropdowntree'
import type { AuroraDropdowntree } from './dropdowntree'

const ITEMS = [
  {
    label: 'Engineering',
    open: true,
    children: [
      { label: 'Frontend', value: 'fe' },
      { label: 'Backend', value: 'be' },
    ],
  },
  { label: 'Design', value: 'design' },
]

describe('aurora-dropdowntree', () => {
  it('opens a composed treeview and commits the picked node', () => {
    const el = document.createElement('aurora-dropdowntree') as AuroraDropdowntree
    document.body.append(el)
    el.items = ITEMS
    el.shadowRoot?.querySelector<HTMLButtonElement>('.field')?.click()
    expect(el.hasAttribute('open')).toBe(true)
    const tree = el.shadowRoot?.querySelector('aurora-treeview')
    expect(tree).not.toBeNull()
    let got = ''
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    tree?.dispatchEvent(new CustomEvent('aurora-select', { detail: { value: 'fe' } }))
    expect(got).toBe('fe')
    expect(el.value).toBe('fe')
    expect(el.hasAttribute('open')).toBe(false)
    expect(el.shadowRoot?.querySelector('.text')?.textContent).toBe('fe')
    el.remove()
  })

  it('shows the placeholder until a value exists and closes on Escape', () => {
    const el = document.createElement('aurora-dropdowntree') as AuroraDropdowntree
    el.setAttribute('placeholder', 'Team…')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.text')?.textContent).toBe('Team…')
    el.shadowRoot?.querySelector<HTMLButtonElement>('.field')?.click()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})
