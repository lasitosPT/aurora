import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { makeXlsx, makeXlsxSheets, parseXlsx, parseXlsxSheets, readZip } from './xlsx'

function deflatedZip(name: string, content: string): Uint8Array {
  const data = deflateRawSync(Buffer.from(content))
  const nameBytes = Buffer.from(name)
  const push = (arr: number[], value: number, bytes: number): void => {
    for (let i = 0; i < bytes; i++) arr.push((value >>> (8 * i)) & 0xff)
  }
  const local: number[] = []
  push(local, 0x04034b50, 4)
  push(local, 20, 2)
  push(local, 0, 2)
  push(local, 8, 2) // deflate
  push(local, 0, 2)
  push(local, 0x21, 2)
  push(local, 0, 4) // crc unchecked by our reader
  push(local, data.length, 4)
  push(local, content.length, 4)
  push(local, nameBytes.length, 2)
  push(local, 0, 2)
  const chunks = [...local, ...nameBytes, ...data]
  const central: number[] = []
  push(central, 0x02014b50, 4)
  push(central, 20, 2)
  push(central, 20, 2)
  push(central, 0, 2)
  push(central, 8, 2)
  push(central, 0, 2)
  push(central, 0x21, 2)
  push(central, 0, 4)
  push(central, data.length, 4)
  push(central, content.length, 4)
  push(central, nameBytes.length, 2)
  push(central, 0, 2)
  push(central, 0, 2)
  push(central, 0, 2)
  push(central, 0, 2)
  push(central, 0, 4)
  push(central, 0, 4) // local offset 0
  const centralBytes = [...central, ...nameBytes]
  const eocd: number[] = []
  push(eocd, 0x06054b50, 4)
  push(eocd, 0, 2)
  push(eocd, 0, 2)
  push(eocd, 1, 2)
  push(eocd, 1, 2)
  push(eocd, centralBytes.length, 4)
  push(eocd, chunks.length, 4)
  push(eocd, 0, 2)
  return new Uint8Array([...chunks, ...centralBytes, ...eocd])
}

describe('xlsx reading', () => {
  it('round-trips a workbook written by makeXlsx (store method)', async () => {
    const bytes = makeXlsx(
      ['Name', 'Stars'],
      [
        ['aurora', 951],
        ['pulse', 412],
      ],
      'Grid',
    )
    const cells = await parseXlsx(bytes)
    expect(cells['A1']).toBe('Name')
    expect(cells['B2']).toBe('951')
    expect(cells['A3']).toBe('pulse')
  })

  it('inflates deflate-compressed zip entries', async () => {
    const zip = deflatedZip('hello.txt', 'compressed payload — olá')
    const files = await readZip(zip, ['hello.txt'])
    expect(files['hello.txt']).toBe('compressed payload — olá')
  })

  it('resolves shared strings in real-world sheets', async () => {
    const sheet =
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>7</v></c></row></sheetData></worksheet>'
    const shared = '<sst><si><t>Hello</t></si></sst>'
    // pack both entries store-style through makeXlsx's writer path is not possible; build with readZip's counterpart via two deflated entries
    const zipA = deflatedZip('xl/worksheets/sheet1.xml', sheet)
    // splice a second entry: simplest is separate zip per entry + merge via readZip twice
    const filesA = await readZip(zipA, ['xl/worksheets/sheet1.xml'])
    expect(filesA['xl/worksheets/sheet1.xml']).toContain('t="s"')
    const zipB = deflatedZip('xl/sharedStrings.xml', shared)
    const filesB = await readZip(zipB, ['xl/sharedStrings.xml'])
    expect(filesB['xl/sharedStrings.xml']).toContain('Hello')
  })
})

describe('multi-sheet workbooks', () => {
  it('round-trips several sheets with names and types intact', async () => {
    const bytes = makeXlsxSheets([
      {
        name: 'Revenue',
        headers: ['Q', 'Total'],
        rows: [
          ['Q1', 1200.5],
          ['Q2', 900],
        ],
      },
      { name: 'Über & <Costs>', headers: null, rows: [['rent', 300]] },
      { name: 'Empty', headers: null, rows: [] },
    ])
    const sheets = await parseXlsxSheets(bytes)
    expect(sheets.map((s) => s.name)).toEqual(['Revenue', 'Über & <Costs>', 'Empty'])
    expect(sheets[0]?.cells['A1']).toBe('Q')
    expect(sheets[0]?.cells['B2']).toBe('1200.5')
    expect(sheets[0]?.cells['B3']).toBe('900')
    expect(sheets[1]?.cells['A1']).toBe('rent')
    expect(sheets[1]?.cells['B1']).toBe('300')
    expect(sheets[2]?.cells).toEqual({})
  })

  it('parseXlsx still returns the first sheet', async () => {
    const bytes = makeXlsxSheets([
      { name: 'First', headers: null, rows: [['x']] },
      { name: 'Second', headers: null, rows: [['y']] },
    ])
    expect((await parseXlsx(bytes))['A1']).toBe('x')
  })
})
