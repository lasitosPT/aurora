import { describe, expect, it } from 'vitest'
import './spreadsheet'
import { AuroraSpreadsheet } from './spreadsheet'

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

describe('spreadsheet depth (v1.7)', () => {
  it('formats cells with bold, alignment, and color', () => {
    const el = make()
    el.data = { A1: 'Title' }
    el.formatCell({ bold: true, align: 'center', color: '#ff0000' }, 'A1')
    const td = el.shadowRoot?.querySelector<HTMLElement>('td[data-ref="A1"]')
    expect(td?.getAttribute('style')).toContain('font-weight:700')
    expect(td?.getAttribute('style')).toContain('text-align:center')
    expect(td?.getAttribute('style')).toContain('#ff0000')
    expect(el.styles['A1']).toEqual({ bold: true, align: 'center', color: '#ff0000' })
    el.remove()
  })

  it('registers custom formula functions', () => {
    AuroraSpreadsheet.registerFunction('DOUBLE', (v) => (v[0] ?? 0) * 2)
    const el = make()
    el.data = { A1: '21', A2: '=DOUBLE(A1)' }
    expect(el.valueAt('A2')).toBe(42)
    el.remove()
  })

  it('exports computed values as a valid xlsx workbook', () => {
    const el = make()
    el.data = { A1: '2', B1: '=A1*5' }
    const bytes = el.toExcel()
    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('<v>10</v>')
    el.remove()
  })
})

describe('spreadsheet xlsx import (v1.10)', () => {
  it('round-trips a sheet through export and import', async () => {
    const a = make()
    a.data = { A1: 'Item', B1: 'Qty', A2: 'Grid', B2: '4' }
    const bytes = a.toExcel()
    const b = make()
    let imported: Record<string, string> | null = null
    b.addEventListener('aurora-import', (e) => {
      imported = (e as CustomEvent<{ cells: Record<string, string> }>).detail.cells
    })
    await b.importExcel(bytes)
    expect(b.getCell('A2')).toBe('Grid')
    expect(b.getCell('B2')).toBe('4')
    expect(imported?.['A1']).toBe('Item')
    a.remove()
    b.remove()
  })
})

describe('spreadsheet multiple sheets (v2.2)', () => {
  it('holds independent data per sheet and switches via tabs', () => {
    const el = make()
    el.data = { A1: 'first' }
    el.addSheet('Budget')
    expect(el.sheetNames).toEqual(['Sheet1', 'Budget'])
    expect(el.activeSheet).toBe(1)
    expect(el.getCell('A1')).toBe('')
    el.data = { A1: 'second' }
    el.activeSheet = 0
    expect(el.getCell('A1')).toBe('first')
    const tabs = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tabs .tab')
    expect(tabs?.length).toBe(2)
    tabs?.[1]?.click()
    expect(el.activeSheet).toBe(1)
    expect(el.getCell('A1')).toBe('second')
    el.remove()
  })

  it('emits aurora-sheet on switch and supports rename/remove', () => {
    const el = make()
    el.addSheet()
    let detail: { index: number; name?: string } | null = null
    el.addEventListener('aurora-sheet', (e) => {
      detail = (e as CustomEvent<{ index: number; name?: string }>).detail
    })
    el.activeSheet = 0
    expect(detail).toEqual({ index: 0, name: 'Sheet1' })
    el.renameSheet(1, 'Data')
    expect(el.sheetNames[1]).toBe('Data')
    el.removeSheet(1)
    el.removeSheet(0)
    expect(el.sheetNames).toEqual(['Sheet1'])
    el.remove()
  })

  it('round-trips every tab through xlsx export and import', async () => {
    const a = make()
    a.data = { A1: 'one', B1: '=1+1' }
    a.addSheet('Numbers')
    a.data = { A1: '41.5' }
    const bytes = a.toExcel()
    const b = make()
    await b.importExcel(bytes)
    expect(b.sheetNames).toEqual(['Sheet1', 'Numbers'])
    expect(b.getCell('A1')).toBe('one')
    expect(b.getCell('B1')).toBe('2')
    b.activeSheet = 1
    expect(b.getCell('A1')).toBe('41.5')
    a.remove()
    b.remove()
  })
})
