import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

type Level = 'L' | 'M' | 'Q' | 'H'

/* Versions 1-10 per level: [ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] */
const RS: Record<Level, readonly (readonly number[])[]> = {
  L: [
    [7, 1, 19, 0, 0],
    [10, 1, 34, 0, 0],
    [15, 1, 55, 0, 0],
    [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0],
    [18, 2, 68, 0, 0],
    [20, 2, 78, 0, 0],
    [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0],
    [18, 2, 68, 2, 69],
  ],
  M: [
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44],
  ],
  Q: [
    [13, 1, 13, 0, 0],
    [22, 1, 22, 0, 0],
    [18, 2, 17, 0, 0],
    [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16],
    [24, 4, 19, 0, 0],
    [18, 2, 14, 4, 15],
    [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17],
    [24, 6, 19, 2, 20],
  ],
  H: [
    [17, 1, 9, 0, 0],
    [28, 1, 16, 0, 0],
    [22, 2, 13, 0, 0],
    [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12],
    [28, 4, 15, 0, 0],
    [26, 4, 13, 1, 14],
    [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13],
    [28, 6, 15, 2, 16],
  ],
}

const ALIGN: readonly (readonly number[])[] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const VERSION_INFO = [0x07c94, 0x085bc, 0x09a99, 0x0a4d3]
const LEVEL_BITS: Record<Level, number> = { L: 1, M: 0, Q: 3, H: 2 }

const MASKS: readonly ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

/* GF(256), polynomial 0x11d */
const EXP: number[] = []
const LOG: number[] = []
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x
  LOG[x] = i
  x <<= 1
  if (x & 0x100) x ^= 0x11d
}
const gexp = (i: number): number => EXP[i % 255] ?? 0
const gmul = (a: number, b: number): number => (a && b ? gexp((LOG[a] ?? 0) + (LOG[b] ?? 0)) : 0)

function rsGen(degree: number): number[] {
  let g = [1]
  for (let d = 0; d < degree; d++) {
    const ng = new Array<number>(g.length + 1).fill(0)
    for (let i = 0; i < g.length; i++) {
      ng[i] = (ng[i] ?? 0) ^ (g[i] ?? 0)
      ng[i + 1] = (ng[i + 1] ?? 0) ^ gmul(g[i] ?? 0, gexp(d))
    }
    g = ng
  }
  return g
}

function ecBytes(data: number[], gen: number[]): number[] {
  const res = data.concat(new Array<number>(gen.length - 1).fill(0))
  for (let i = 0; i < data.length; i++) {
    const factor = res[i] ?? 0
    if (!factor) continue
    for (let j = 0; j < gen.length; j++) res[i + j] = (res[i + j] ?? 0) ^ gmul(gen[j] ?? 0, factor)
  }
  return res.slice(data.length)
}

function buildCodewords(text: string, level: Level): { bytes: number[]; version: number } | null {
  const data = Array.from(new TextEncoder().encode(text))
  let version = 0
  let spec: readonly number[] = []
  for (let v = 1; v <= 10; v++) {
    const s = RS[level][v - 1] ?? []
    const [, g1 = 0, d1 = 0, g2 = 0, d2 = 0] = s
    if (data.length * 8 + 4 + (v >= 10 ? 16 : 8) <= (g1 * d1 + g2 * d2) * 8) {
      version = v
      spec = s
      break
    }
  }
  if (!version) return null
  const [ec = 0, g1 = 0, d1 = 0, g2 = 0, d2 = 0] = spec
  const dataCw = g1 * d1 + g2 * d2
  const bits: number[] = []
  const push = (val: number, len: number): void => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1)
  }
  push(0b0100, 4)
  push(data.length, version >= 10 ? 16 : 8)
  for (const b of data) push(b, 8)
  push(0, Math.min(4, dataCw * 8 - bits.length))
  while (bits.length % 8) bits.push(0)
  const cws: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] ?? 0)
    cws.push(b)
  }
  for (let t = 0; cws.length < dataCw; t++) cws.push(t % 2 ? 0x11 : 0xec)
  const blocks: number[][] = []
  let off = 0
  for (let b = 0; b < g1; b++) {
    blocks.push(cws.slice(off, off + d1))
    off += d1
  }
  for (let b = 0; b < g2; b++) {
    blocks.push(cws.slice(off, off + d2))
    off += d2
  }
  const gen = rsGen(ec)
  const eblocks = blocks.map((bl) => ecBytes(bl, gen))
  const out: number[] = []
  for (let i = 0; i < Math.max(d1, d2); i++)
    for (const bl of blocks) {
      const v = bl[i]
      if (v !== undefined) out.push(v)
    }
  for (let i = 0; i < ec; i++) for (const eb of eblocks) out.push(eb[i] ?? 0)
  return { bytes: out, version }
}

function makeMatrix(data: number[], version: number, level: Level, mask: number): number[] {
  const size = 17 + 4 * version
  const m = new Array<number>(size * size).fill(-1)
  const put = (r: number, c: number, v: boolean): void => {
    m[r * size + c] = v ? 1 : 0
  }
  const get = (r: number, c: number): number => m[r * size + c] ?? -1
  for (const [fr, fc] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ] as const) {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const rr = fr + r
        const cc = fc + c
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        put(
          rr,
          cc,
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4),
        )
      }
  }
  const pos = ALIGN[version - 1] ?? []
  for (const ar of pos)
    for (const ac of pos) {
      if (get(ar, ac) !== -1) continue
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          put(ar + dr, ac + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1)
    }
  for (let i = 8; i < size - 8; i++) {
    if (get(6, i) === -1) put(6, i, i % 2 === 0)
    if (get(i, 6) === -1) put(i, 6, i % 2 === 0)
  }
  const fdata = (LEVEL_BITS[level] << 3) | mask
  let rem = fdata << 10
  for (let i = 4; i >= 0; i--) if ((rem >> (10 + i)) & 1) rem ^= 0x537 << i
  const fbits = ((fdata << 10) | (rem & 0x3ff)) ^ 0x5412
  for (let i = 0; i < 15; i++) {
    const v = ((fbits >> i) & 1) === 1
    if (i < 6) put(i, 8, v)
    else if (i < 8) put(i + 1, 8, v)
    else put(size - 15 + i, 8, v)
    if (i < 8) put(8, size - i - 1, v)
    else if (i < 9) put(8, 15 - i, v)
    else put(8, 15 - i - 1, v)
  }
  put(size - 8, 8, true)
  if (version >= 7) {
    const vbits = VERSION_INFO[version - 7] ?? 0
    for (let i = 0; i < 18; i++) {
      const v = ((vbits >> i) & 1) === 1
      put(Math.floor(i / 3), (i % 3) + size - 11, v)
      put((i % 3) + size - 11, Math.floor(i / 3), v)
    }
  }
  const maskFn = MASKS[mask] ?? ((r: number, c: number): boolean => (r + c) % 2 === 0)
  let byteIndex = 0
  let bitIndex = 7
  let row = size - 1
  let inc = -1
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (;;) {
      for (let c = 0; c < 2; c++) {
        if (get(row, col - c) === -1) {
          let dark = false
          if (byteIndex < data.length) dark = (((data[byteIndex] ?? 0) >> bitIndex) & 1) === 1
          if (maskFn(row, col - c)) dark = !dark
          put(row, col - c, dark)
          bitIndex--
          if (bitIndex === -1) {
            byteIndex++
            bitIndex = 7
          }
        }
      }
      row += inc
      if (row < 0 || row >= size) {
        row -= inc
        inc = -inc
        break
      }
    }
  }
  return m
}

function penalty(m: number[], size: number): number {
  const at = (r: number, c: number): number => m[r * size + c] ?? 0
  let score = 0
  for (let axis = 0; axis < 2; axis++)
    for (let i = 0; i < size; i++) {
      let run = 1
      let prev = axis ? at(0, i) : at(i, 0)
      for (let j = 1; j < size; j++) {
        const cur = axis ? at(j, i) : at(i, j)
        if (cur === prev) run++
        else {
          if (run >= 5) score += run - 2
          run = 1
          prev = cur
        }
      }
      if (run >= 5) score += run - 2
    }
  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++) {
      const v = at(r, c)
      if (v === at(r, c + 1) && v === at(r + 1, c) && v === at(r + 1, c + 1)) score += 3
    }
  const p1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]
  const p2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]
  for (let axis = 0; axis < 2; axis++)
    for (let i = 0; i < size; i++)
      for (let j = 0; j + 11 <= size; j++)
        for (const p of [p1, p2]) {
          let hit = true
          for (let k = 0; k < 11; k++)
            if ((axis ? at(j + k, i) : at(i, j + k)) !== p[k]) {
              hit = false
              break
            }
          if (hit) {
            score += 40
            break
          }
        }
  let dark = 0
  for (const v of m) dark += v
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10
  return score
}

/**
 * Encodes `text` as a QR symbol (byte mode, versions 1-10). Returns the module
 * matrix, or null if the payload exceeds capacity at the given level. Pass
 * `forceMask` (0-7) to skip mask evaluation; by default all eight masks are
 * scored per spec and the lowest-penalty one wins.
 */
export function encodeQr(text: string, level: Level = 'M', forceMask = -1): boolean[][] | null {
  const built = buildCodewords(text, level)
  if (!built) return null
  const size = 17 + 4 * built.version
  const candidates = forceMask >= 0 ? [forceMask] : [0, 1, 2, 3, 4, 5, 6, 7]
  let best: number[] = []
  let bestScore = Infinity
  for (const mk of candidates) {
    const candidate = makeMatrix(built.bytes, built.version, level, mk)
    const s = candidates.length === 1 ? 0 : penalty(candidate, size)
    if (s < bestScore) {
      bestScore = s
      best = candidate
    }
  }
  const rows: boolean[][] = []
  for (let r = 0; r < size; r++) {
    const rowArr: boolean[] = []
    for (let c = 0; c < size; c++) rowArr.push(best[r * size + c] === 1)
    rows.push(rowArr)
  }
  return rows
}

const STYLE = `
  :host { display: inline-block; width: 180px; }
  .wrap { will-change: transform; }
  svg {
    display: block; width: 100%; height: auto; border-radius: 12px;
    background: var(--aurora-qr-bg, #fff);
  }
  path { fill: var(--aurora-qr-fg, #16161f); }
  .err { font-size: 12px; color: var(--aurora-danger, #f43f5e); }
`

/**
 * `<aurora-qrcode value="https://…">` — a dependency-free QR code renderer.
 * The encoder (byte mode, versions 1-10, all four EC levels, spec mask
 * scoring) lives in this module; the symbol renders as crisp SVG with a
 * 4-module quiet zone and scales into view. Emits `aurora-error` if the
 * payload exceeds capacity.
 */
export class AuroraQrcode extends AuroraElement {
  static readonly observedAttributes = ['value', 'level']
  private ready = false
  private cleanup: (() => void) | null = null

  connectedCallback(): void {
    this.renderQr()
    this.ready = true
    this.cleanup = whenVisible(this, () => {
      const wrap = this.root.querySelector('.wrap')
      if (wrap && !prefersReducedMotion())
        gsap.fromTo(
          wrap,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' },
        )
    })
  }

  disconnectedCallback(): void {
    this.cleanup?.()
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (this.ready && oldValue !== newValue) this.renderQr()
  }

  private renderQr(): void {
    const value = this.getAttribute('value') ?? ''
    const levelAttr = this.getAttribute('level') ?? 'M'
    const level: Level =
      levelAttr === 'L' || levelAttr === 'Q' || levelAttr === 'H' ? levelAttr : 'M'
    const matrix = value ? encodeQr(value, level) : null
    if (!matrix) {
      this.root.innerHTML = `<style>${STYLE}</style><div class="err">Payload exceeds QR capacity</div>`
      this.dispatchEvent(new CustomEvent('aurora-error', { detail: { reason: 'capacity' } }))
      return
    }
    let d = ''
    matrix.forEach((rowArr, r) =>
      rowArr.forEach((v, c) => {
        if (v) d += `M${c + 4} ${r + 4}h1v1h-1z`
      }),
    )
    const n = matrix.length + 8
    this.root.innerHTML = `<style>${STYLE}</style><div class="wrap"><svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" focusable="false" aria-hidden="true"><path d="${d}"/></svg></div>`
    this.setAttribute('role', 'img')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', `QR code: ${value}`)
  }
}

register('aurora-qrcode', AuroraQrcode)
