/* Minimal .xlsx writer — a store-only ZIP of hand-built OOXML parts. */

const CRC_TABLE = ((): Uint32Array => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const b of bytes) crc = (CRC_TABLE[(crc ^ b) & 0xff] ?? 0) ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const chunks: number[] = []
  const central: number[] = []
  const push = (arr: number[], ...vals: [number, number][]): void => {
    for (const [value, bytes] of vals)
      for (let i = 0; i < bytes; i++) arr.push((value >>> (8 * i)) & 0xff)
  }
  let offset = 0
  for (const file of files) {
    const name = Array.from(new TextEncoder().encode(file.name))
    const crc = crc32(file.data)
    const header: number[] = []
    push(header, [0x04034b50, 4], [20, 2], [0, 2], [0, 2], [0, 2], [0x21, 2])
    push(header, [crc, 4], [file.data.length, 4], [file.data.length, 4])
    push(header, [name.length, 2], [0, 2])
    chunks.push(...header, ...name, ...file.data)
    push(central, [0x02014b50, 4], [20, 2], [20, 2], [0, 2], [0, 2], [0, 2], [0x21, 2])
    push(central, [crc, 4], [file.data.length, 4], [file.data.length, 4])
    push(central, [name.length, 2], [0, 2], [0, 2], [0, 2], [0, 2], [0, 4], [offset, 4])
    central.push(...name)
    offset += header.length + name.length + file.data.length
  }
  const eocd: number[] = []
  push(eocd, [0x06054b50, 4], [0, 2], [0, 2], [files.length, 2], [files.length, 2])
  push(eocd, [central.length, 4], [offset, 4], [0, 2])
  return new Uint8Array([...chunks, ...central, ...eocd])
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function colName(i: number): string {
  let name = ''
  let n = i
  do {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return name
}

/**
 * Builds a single-sheet .xlsx workbook. Numbers become numeric cells;
 * everything else is an inline string. Returns the zip bytes.
 */
export function makeXlsx(headers: string[], rows: unknown[][], sheetName = 'Sheet1'): Uint8Array {
  const enc = new TextEncoder()
  const cell = (value: unknown, c: number, r: number): string => {
    const ref = `${colName(c)}${r + 1}`
    if (typeof value === 'number' && Number.isFinite(value))
      return `<c r="${ref}"><v>${value}</v></c>`
    const text = xmlEscape(String(value ?? ''))
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`
  }
  const allRows = [headers as unknown[], ...rows]
  const sheetRows = allRows
    .map((row, r) => `<row r="${r + 1}">${row.map((v, c) => cell(v, c, r)).join('')}</row>`)
    .join('')
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
  return zipStore([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels', data: enc.encode(rootRels) },
    { name: 'xl/workbook.xml', data: enc.encode(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRels) },
    { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheet) },
  ])
}
