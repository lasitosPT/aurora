import { describe, expect, it } from 'vitest'
import './propertygrid'
import type { AuroraPropertygrid } from './propertygrid'

describe('aurora-propertygrid', () => {
  it('infers editors from value types and renders rows', () => {
    const el = document.createElement('aurora-propertygrid') as AuroraPropertygrid
    document.body.append(el)
    el.value = { title: 'Aurora', width: 320, visible: true, accent: '#6d5cff' }
    expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(4)
    expect(el.shadowRoot?.querySelector('input[type="text"][data-k="title"]')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('input[type="number"][data-k="width"]')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('aurora-checkbox[data-k="visible"]')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('input[type="color"][data-k="accent"]')).not.toBeNull()
    el.remove()
  })

  it('honors explicit property defs with groups and selects', () => {
    const el = document.createElement('aurora-propertygrid') as AuroraPropertygrid
    document.body.append(el)
    el.value = { size: 'md', dense: false }
    el.properties = [
      { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md', 'lg'], group: 'Layout' },
      { key: 'dense', label: 'Dense rows', type: 'boolean', group: 'Layout' },
    ]
    expect(el.shadowRoot?.querySelector('.group')?.textContent).toBe('Layout')
    const select = el.shadowRoot?.querySelector<HTMLSelectElement>('select[data-k="size"]')
    expect(select?.value).toBe('md')
    let got: { key: string; value: unknown } | null = null
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ key: string; value: unknown }>).detail
    })
    if (select) {
      select.value = 'lg'
      select.dispatchEvent(new Event('change'))
    }
    expect(got).toEqual(expect.objectContaining({ key: 'size', value: 'lg' }))
    expect(el.value['size']).toBe('lg')
    el.remove()
  })

  it('coerces numeric edits back to numbers', () => {
    const el = document.createElement('aurora-propertygrid') as AuroraPropertygrid
    document.body.append(el)
    el.value = { width: 100 }
    const input = el.shadowRoot?.querySelector<HTMLInputElement>('input[data-k="width"]')
    if (input) {
      input.value = '480'
      input.dispatchEvent(new Event('change'))
    }
    expect(el.value['width']).toBe(480)
    el.remove()
  })
})
