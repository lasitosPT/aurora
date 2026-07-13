import { describe, expect, it } from 'vitest'
import './listview'
import type { AuroraListview } from './listview'

const DATA = Array.from({ length: 7 }, (_, i) => ({ name: `Item ${i + 1}`, n: i + 1 }))

describe('aurora-listview', () => {
  it('renders rows through the template and pages them', () => {
    const el = document.createElement('aurora-listview') as AuroraListview
    el.setAttribute('page-size', '3')
    document.body.append(el)
    el.template = (row) => `<strong>${String(row['name'])}</strong>`
    el.data = DATA
    expect(el.shadowRoot?.querySelectorAll('.item').length).toBe(3)
    expect(el.shadowRoot?.querySelector('.item strong')?.textContent).toBe('Item 1')
    expect(el.shadowRoot?.querySelector('.pager span')?.textContent).toBe('1 / 3')
    el.shadowRoot?.querySelector<HTMLButtonElement>('.next')?.click()
    expect(el.shadowRoot?.querySelector('.item strong')?.textContent).toBe('Item 4')
    el.remove()
  })

  it('selects single and multiple, emitting the chosen rows', () => {
    const el = document.createElement('aurora-listview') as AuroraListview
    el.setAttribute('selectable', 'multiple')
    document.body.append(el)
    el.data = DATA
    let got: unknown[] = []
    el.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ rows: unknown[] }>).detail.rows
    })
    el.shadowRoot?.querySelectorAll<HTMLElement>('.item')[1]?.click()
    el.shadowRoot?.querySelectorAll<HTMLElement>('.item')[3]?.click()
    expect(got.length).toBe(2)
    expect(el.shadowRoot?.querySelectorAll('[aria-selected="true"]').length).toBe(2)
    el.shadowRoot?.querySelectorAll<HTMLElement>('.item')[1]?.click()
    expect(el.rows.length).toBe(1)
    el.remove()
  })

  it('shows an empty state and default rendering without a template', () => {
    const el = document.createElement('aurora-listview') as AuroraListview
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.empty')).not.toBeNull()
    el.data = [{ a: 'x', b: 'y' }]
    expect(el.shadowRoot?.querySelector('.item')?.textContent).toBe('x · y')
    el.remove()
  })
})
