import { describe, expect, it } from 'vitest'
import './spreadsheet'
import type { AuroraSpreadsheet } from './spreadsheet'

function make(): AuroraSpreadsheet {
  const el = document.createElement('aurora-spreadsheet') as AuroraSpreadsheet
  el.setAttribute('rows', '5')
  el.setAttribute('cols', '4')
  document.body.append(el)
  return el
}

describe('aurora-spreadsheet', () => {
  it('computes formulas across cells and re-renders results', () => {
    const el = make()
    el.data = { A1: '10', A2: '20', A3: '=SUM(A1:A2)', B1: '=A3*2' }
    expect(el.valueAt('A3')).toBe(30)
    expect(el.valueAt('B1')).toBe(60)
    expect(el.shadowRoot?.querySelector('td[data-ref="A3"]')?.textContent).toBe('30')
    el.setCell('A1', '15')
    expect(el.shadowRoot?.querySelector('td[data-ref="B1"]')?.textContent).toBe('70')
    el.remove()
  })

  it('flags circular references and formula errors without crashing', () => {
    const el = make()
    el.data = { A1: '=B1', B1: '=A1', C1: '=1/0', D1: '=NOPE(1)' }
    expect(el.valueAt('A1')).toBe('#CIRC')
    expect(el.valueAt('C1')).toBe('#DIV/0')
    expect(el.valueAt('D1')).toBe('#ERR')
    expect(el.shadowRoot?.querySelector('td[data-ref="C1"]')?.classList.contains('err')).toBe(true)
    el.remove()
  })

  it('edits through the cell editor and advances on Enter', () => {
    const el = make()
    const td = el.shadowRoot?.querySelector<HTMLTableCellElement>('td[data-ref="A1"]')
    td?.dispatchEvent(new Event('dblclick'))
    const input = td?.querySelector('input')
    if (!input) throw new Error('no editor')
    input.value = '42'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(el.getCell('A1')).toBe('42')
    expect(el.valueAt('A1')).toBe(42)
    expect(el.shadowRoot?.querySelector('td[data-ref="A2"]')?.getAttribute('aria-selected')).toBe(
      'true',
    )
    el.remove()
  })

  it('commits from the formula bar and exports computed CSV', () => {
    const el = make()
    el.data = { A1: '2', B1: '=A1*3' }
    const fx = el.shadowRoot?.querySelector<HTMLInputElement>('.fx')
    if (fx) {
      fx.value = '5'
      fx.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    }
    expect(el.getCell('A1')).toBe('5')
    const csv = el.toCsv()
    expect(csv.split('\n')[0]).toBe('"5","15","",""')
    el.remove()
  })
})
