import { describe, expect, it } from 'vitest'
import './multicolumncombobox'
import type { AuroraMulticolumncombobox } from './multicolumncombobox'

const DATA = [
  { code: 'PT', name: 'Portugal', capital: 'Lisbon' },
  { code: 'DE', name: 'Germany', capital: 'Berlin' },
  { code: 'FR', name: 'France', capital: 'Paris' },
]

function make(): AuroraMulticolumncombobox {
  const el = document.createElement('aurora-multicolumncombobox') as AuroraMulticolumncombobox
  el.setAttribute('text-field', 'name')
  el.setAttribute('value-field', 'code')
  document.body.append(el)
  el.columns = [
    { field: 'name', title: 'Country' },
    { field: 'capital', title: 'Capital' },
  ]
  el.data = DATA
  return el
}

describe('aurora-multicolumncombobox', () => {
  it('filters across all columns with a tabular dropdown', () => {
    const el = make()
    const input = el.shadowRoot?.querySelector('input')
    if (!input) throw new Error('no input')
    input.value = 'lis'
    input.dispatchEvent(new Event('input'))
    expect(el.shadowRoot?.querySelectorAll('tbody tr').length).toBe(1)
    expect(el.shadowRoot?.querySelector('mark')?.textContent).toBe('Lis')
    expect(el.shadowRoot?.querySelectorAll('th').length).toBe(2)
    el.remove()
  })

  it('commits a row with text/value field mapping', () => {
    const el = make()
    const input = el.shadowRoot?.querySelector('input')
    if (!input) throw new Error('no input')
    let got: { value: string; row: { code: string } } | null = null
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string; row: { code: string } }>).detail
    })
    input.value = 'germ'
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(got).toEqual(expect.objectContaining({ value: 'DE' }))
    expect(input.value).toBe('Germany')
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})
