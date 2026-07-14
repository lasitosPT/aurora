/* A small spreadsheet formula engine: numbers, cell refs, ranges in
   functions, + - * / with precedence, parentheses, unary minus. */

export type CellReader = (ref: string) => number | string | null

const FUNCS: Record<string, (values: number[]) => number> = {
  SUM: (v) => v.reduce((a, b) => a + b, 0),
  AVG: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  MIN: (v) => (v.length ? Math.min(...v) : 0),
  MAX: (v) => (v.length ? Math.max(...v) : 0),
  COUNT: (v) => v.length,
  ROUND: (v) => Math.round(v[0] ?? 0),
  ABS: (v) => Math.abs(v[0] ?? 0),
}

/** Register a custom formula function (name is case-insensitive in formulas). */
export function registerFormulaFunction(name: string, fn: (values: number[]) => number): void {
  FUNCS[name.toUpperCase()] = fn
}

export function colToIndex(col: string): number {
  let n = 0
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

export function indexToCol(i: number): string {
  let name = ''
  let n = i
  do {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return name
}

/** Expand "A1:B3" into every ref inside the rectangle. */
export function expandRange(range: string): string[] {
  const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range)
  if (!m) return [range]
  const c1 = colToIndex(m[1] ?? 'A')
  const r1 = Number(m[2])
  const c2 = colToIndex(m[3] ?? 'A')
  const r2 = Number(m[4])
  const out: string[] = []
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) out.push(`${indexToCol(c)}${r}`)
  return out
}

class Parser {
  private pos = 0
  constructor(
    private readonly src: string,
    private readonly read: CellReader,
  ) {}

  parse(): number {
    const value = this.expression()
    this.ws()
    if (this.pos < this.src.length) throw new Error('trailing input')
    return value
  }

  private ws(): void {
    while (this.src[this.pos] === ' ') this.pos++
  }

  private expression(): number {
    let left = this.term()
    for (;;) {
      this.ws()
      const op = this.src[this.pos]
      if (op !== '+' && op !== '-') return left
      this.pos++
      const right = this.term()
      left = op === '+' ? left + right : left - right
    }
  }

  private term(): number {
    let left = this.factor()
    for (;;) {
      this.ws()
      const op = this.src[this.pos]
      if (op !== '*' && op !== '/') return left
      this.pos++
      const right = this.factor()
      if (op === '/') {
        if (right === 0) throw new Error('#DIV/0')
        left = left / right
      } else left = left * right
    }
  }

  private factor(): number {
    this.ws()
    const ch = this.src[this.pos]
    if (ch === '-') {
      this.pos++
      return -this.factor()
    }
    if (ch === '(') {
      this.pos++
      const value = this.expression()
      this.ws()
      if (this.src[this.pos] !== ')') throw new Error('missing )')
      this.pos++
      return value
    }
    const num = /^\d+(\.\d+)?/.exec(this.src.slice(this.pos))
    if (num) {
      this.pos += num[0].length
      return Number(num[0])
    }
    const ident = /^[A-Z]+(?=\()/i.exec(this.src.slice(this.pos))
    if (ident) {
      const name = ident[0].toUpperCase()
      const fn = FUNCS[name]
      if (!fn) throw new Error(`unknown ${name}`)
      this.pos += ident[0].length + 1
      const values: number[] = []
      this.ws()
      if (this.src[this.pos] === ')') this.pos++
      else
        for (;;) {
          values.push(...this.arg())
          this.ws()
          const next = this.src[this.pos]
          this.pos++
          if (next === ')') break
          if (next !== ',') throw new Error('bad args')
        }
      return fn(values)
    }
    const ref = /^[A-Z]+\d+(:[A-Z]+\d+)?/i.exec(this.src.slice(this.pos))
    if (ref) {
      this.pos += ref[0].length
      const refs = expandRange(ref[0].toUpperCase())
      if (refs.length !== 1) throw new Error('range outside function')
      return this.cellNumber(refs[0] ?? '')
    }
    throw new Error('unexpected input')
  }

  private arg(): number[] {
    this.ws()
    const range = /^[A-Z]+\d+:[A-Z]+\d+/i.exec(this.src.slice(this.pos))
    if (range) {
      this.pos += range[0].length
      return expandRange(range[0].toUpperCase())
        .map((r) => this.read(r))
        .filter((v): v is number | string => v !== null && v !== '')
        .map(Number)
        .filter((n) => !Number.isNaN(n))
    }
    return [this.expression()]
  }

  private cellNumber(ref: string): number {
    const raw = this.read(ref)
    if (raw === null || raw === '') return 0
    const n = Number(raw)
    if (Number.isNaN(n)) throw new Error('#VALUE')
    return n
  }
}

/**
 * Evaluate a formula body (the text after `=`). `read` resolves cell refs to
 * already-computed values. Throws on parse errors, #DIV/0, and #VALUE.
 */
export function evaluateFormula(body: string, read: CellReader): number {
  return new Parser(body, read).parse()
}
