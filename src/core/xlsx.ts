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

export interface XlsxSheet {
  name: string
  headers: string[] | null
  rows: unknown[][]
}

/**
 * Builds a multi-sheet .xlsx workbook. Numbers become numeric cells;
 * everything else is an inline string. Returns the zip bytes.
 */
export function makeXlsxSheets(sheets: XlsxSheet[]): Uint8Array {
  const enc = new TextEncoder()
  const cell = (value: unknown, c: number, r: number): string => {
    const ref = `${colName(c)}${r + 1}`
    if (typeof value === 'number' && Number.isFinite(value))
      return `<c r="${ref}"><v>${value}</v></c>`
    const text = xmlEscape(String(value ?? ''))
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`
  }
  const sheetXml = (sheet: XlsxSheet): string => {
    const allRows = sheet.headers ? [sheet.headers as unknown[], ...sheet.rows] : sheet.rows
    const sheetRows = allRows
      .map((row, r) => `<row r="${r + 1}">${row.map((v, c) => cell(v, c, r)).join('')}</row>`)
      .join('')
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`
  }
  const refs = sheets
    .map((sh, i) => `<sheet name="${xmlEscape(sh.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('')
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${refs}</sheets></workbook>`
  const rels = sheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join('')
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  const overrides = sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join('')
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}</Types>`
  return zipStore([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels', data: enc.encode(rootRels) },
    { name: 'xl/workbook.xml', data: enc.encode(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRels) },
    ...sheets.map((sh, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: enc.encode(sheetXml(sh)),
    })),
  ])
}

/** Builds a single-sheet .xlsx workbook (see makeXlsxSheets). */
export function makeXlsx(
  headers: string[] | null,
  rows: unknown[][],
  sheetName = 'Sheet1',
): Uint8Array {
  return makeXlsxSheets([{ name: sheetName, headers, rows }])
}

/* ---------- reading ---------- */

function u16(b: Uint8Array, o: number): number {
  return (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8)
}

function u32(b: Uint8Array, o: number): number {
  return (
    ((b[o] ?? 0) | ((b[o + 1] ?? 0) << 8) | ((b[o + 2] ?? 0) << 16) | ((b[o + 3] ?? 0) << 24)) >>> 0
  )
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const stream = new Blob([data.buffer as ArrayBuffer]).stream().pipeThrough(ds)
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

/** Extract named entries from a .zip (store and deflate methods). */
export async function readZip(
  bytes: Uint8Array,
  wanted: string[],
): Promise<Record<string, string>> {
  // locate the end-of-central-directory record
  let eocd = -1
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (u32(bytes, i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('not a zip file')
  const count = u16(bytes, eocd + 10)
  let off = u32(bytes, eocd + 16)
  const decoder = new TextDecoder()
  const out: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    if (u32(bytes, off) !== 0x02014b50) break
    const method = u16(bytes, off + 10)
    const compSize = u32(bytes, off + 20)
    const nameLen = u16(bytes, off + 28)
    const extraLen = u16(bytes, off + 30)
    const commentLen = u16(bytes, off + 32)
    const localOff = u32(bytes, off + 42)
    const name = decoder.decode(bytes.slice(off + 46, off + 46 + nameLen))
    if (wanted.includes(name)) {
      const lNameLen = u16(bytes, localOff + 26)
      const lExtraLen = u16(bytes, localOff + 28)
      const start = localOff + 30 + lNameLen + lExtraLen
      const raw = bytes.slice(start, start + compSize)
      out[name] = decoder.decode(method === 8 ? await inflateRaw(raw) : raw)
    }
    off += 46 + nameLen + extraLen + commentLen
  }
  return out
}

const decodeXml = (s: string): string =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')

function parseSheetCells(sheet: string, shared: string[]): Record<string, string> {
  const cells: Record<string, string> = {}
  for (const cell of sheet.match(/<c [^>]*?r="[A-Z]+\d+"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []) {
    const ref = /r="([A-Z]+\d+)"/.exec(cell)?.[1]
    if (!ref) continue
    const type = /t="([a-zA-Z]+)"/.exec(cell)?.[1]
    if (type === 'inlineStr') {
      const text = (cell.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [])
        .map((t) => decodeXml(t.replace(/<t[^>]*>|<\/t>/g, '')))
        .join('')
      if (text !== '') cells[ref] = text
      continue
    }
    const v = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1]
    if (v === undefined) continue
    if (type === 's') {
      const text = shared[Number(v)] ?? ''
      if (text !== '') cells[ref] = text
    } else {
      cells[ref] = decodeXml(v)
    }
  }
  return cells
}

/**
 * Parse every worksheet of a .xlsx into ordered `{ name, cells }` entries,
 * where cells is an `{ A1: value }` map. Handles inline strings, shared
 * strings, and numeric cells; formulas come back as their cached values.
 */
export async function parseXlsxSheets(
  bytes: Uint8Array,
): Promise<{ name: string; cells: Record<string, string> }[]> {
  const meta = await readZip(bytes, [
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/sharedStrings.xml',
  ])
  const shared: string[] = []
  const sharedXml = meta['xl/sharedStrings.xml']
  if (sharedXml) {
    for (const si of sharedXml.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
      shared.push(
        (si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [])
          .map((t) => decodeXml(t.replace(/<t[^>]*>|<\/t>/g, '')))
          .join(''),
      )
    }
  }
  const targets = new Map<string, string>()
  for (const rel of meta['xl/_rels/workbook.xml.rels']?.match(/<Relationship [^>]*\/>/g) ?? []) {
    const id = /Id="([^"]+)"/.exec(rel)?.[1]
    const target = /Target="([^"]+)"/.exec(rel)?.[1]
    if (id && target)
      targets.set(
        id,
        target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`,
      )
  }
  const wanted: { name: string; path: string }[] = []
  for (const tag of meta['xl/workbook.xml']?.match(/<sheet [^>]*\/>/g) ?? []) {
    const name = /name="([^"]*)"/.exec(tag)?.[1]
    const rid = /r:id="([^"]+)"/.exec(tag)?.[1]
    const path = rid ? targets.get(rid) : undefined
    if (name !== undefined && path) wanted.push({ name: decodeXml(name), path })
  }
  if (!wanted.length) {
    // no workbook part — fall back to the conventional first-sheet path
    const files = await readZip(bytes, ['xl/worksheets/sheet1.xml'])
    const sheet = files['xl/worksheets/sheet1.xml']
    if (!sheet) throw new Error('no worksheet found')
    return [{ name: 'Sheet1', cells: parseSheetCells(sheet, shared) }]
  }
  const files = await readZip(
    bytes,
    wanted.map((w) => w.path),
  )
  return wanted.map((w) => ({
    name: w.name,
    cells: parseSheetCells(files[w.path] ?? '', shared),
  }))
}

/**
 * Parse the first worksheet of a .xlsx into an `{ A1: value }` map
 * (see parseXlsxSheets).
 */
export async function parseXlsx(bytes: Uint8Array): Promise<Record<string, string>> {
  const sheets = await parseXlsxSheets(bytes)
  const first = sheets[0]
  if (!first) throw new Error('no worksheet found')
  return first.cells
}
