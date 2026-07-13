import { describe, expect, it } from 'vitest'
import './pivotgrid'
import type { AuroraPivotgrid } from './pivotgrid'

const SALES = [
  { region: 'EU', product: 'Grid', quarter: 'Q1', amount: 10 },
  { region: 'EU', product: 'Grid', quarter: 'Q2', amount: 20 },
  { region: 'EU', product: 'Chart', quarter: 'Q1', amount: 5 },
  { region: 'US', product: 'Grid', quarter: 'Q1', amount: 40 },
  { region: 'US', product: 'Chart', quarter: 'Q2', amount: 15 },
]

function make(rows: string[] | string): AuroraPivotgrid {
  const el = document.createElement('aurora-pivotgrid') as AuroraPivotgrid
  document.body.append(el)
  el.rows = rows
  el.cols = 'quarter'
  el.measure = 'amount'
  el.data = SALES
  return el
}

function cell(el: AuroraPivotgrid, r: string, c: string): string {
  return el.shadowRoot?.querySelector(`td[data-r="${r}"][data-c="${c}"]`)?.textContent ?? ''
}

describe('aurora-pivotgrid', () => {
  it('crosses rows and columns with sums, totals, and a grand total', () => {
    const el = make('region')
    expect(cell(el, 'EU', 'Q1')).toBe('15')
    expect(cell(el, 'EU', 'Q2')).toBe('20')
    expect(cell(el, 'US', 'Q1')).toBe('40')
    const totalsRow = el.shadowRoot?.querySelector('tr.totals')
    expect(totalsRow?.textContent).toContain('90')
    expect(el.shadowRoot?.querySelectorAll('thead th').length).toBe(4)
    el.remove()
  })

  it('supports avg and count aggregates', () => {
    const el = make('region')
    el.setAttribute('aggregate', 'avg')
    el.data = SALES
    expect(cell(el, 'EU', 'Q1')).toBe('7.5')
    el.setAttribute('aggregate', 'count')
    el.data = SALES
    expect(cell(el, 'EU', 'Q1')).toBe('2')
    el.remove()
  })

  it('nests two row fields with collapsible subtotal groups', () => {
    const el = make(['region', 'product'])
    expect(el.shadowRoot?.querySelectorAll('tr.group').length).toBe(2)
    expect(el.shadowRoot?.querySelectorAll('tr.sub').length).toBe(4)
    expect(cell(el, 'EU·Grid', 'Q1')).toBe('10')
    el.shadowRoot?.querySelector<HTMLButtonElement>('.caret[data-k="EU"]')?.click()
    expect(el.shadowRoot?.querySelectorAll('tr.sub').length).toBe(2)
    el.remove()
  })

  it('emits the clicked intersection', () => {
    const el = make('region')
    let got: { row: string; col: string; value: number } | null = null
    el.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ row: string; col: string; value: number }>).detail
    })
    el.shadowRoot?.querySelector<HTMLTableCellElement>('td[data-r="US"][data-c="Q1"]')?.click()
    expect(got).toEqual({ row: 'US', col: 'Q1', value: 40 })
    el.remove()
  })
})
