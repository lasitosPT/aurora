import { describe, expect, it } from 'vitest'
import { evaluateFormula, expandRange, indexToCol } from './formula'

const CELLS: Record<string, number | string> = {
  A1: 10,
  A2: 20,
  A3: 30,
  B1: 2,
  B2: '',
  C1: 'text',
}
const read = (ref: string): number | string | null => CELLS[ref] ?? null

describe('formula engine', () => {
  it('handles arithmetic with precedence, parens, and unary minus', () => {
    expect(evaluateFormula('1+2*3', read)).toBe(7)
    expect(evaluateFormula('(1+2)*3', read)).toBe(9)
    expect(evaluateFormula('-4 + 10 / 2', read)).toBe(1)
    expect(evaluateFormula('2*-3', read)).toBe(-6)
  })

  it('resolves cell references and mixes them with math', () => {
    expect(evaluateFormula('A1+A2', read)).toBe(30)
    expect(evaluateFormula('A1*B1 - 5', read)).toBe(15)
    expect(evaluateFormula('B2+1', read)).toBe(1)
  })

  it('computes functions over ranges and mixed args', () => {
    expect(evaluateFormula('SUM(A1:A3)', read)).toBe(60)
    expect(evaluateFormula('AVG(A1:A3)', read)).toBe(20)
    expect(evaluateFormula('MAX(A1:A3)', read)).toBe(30)
    expect(evaluateFormula('MIN(A1:B1)', read)).toBe(2)
    expect(evaluateFormula('COUNT(A1:A3)', read)).toBe(3)
    expect(evaluateFormula('SUM(A1:A2, 5, B1*2)', read)).toBe(39)
    expect(evaluateFormula('sum(a1:a3)', read)).toBe(60)
  })

  it('throws typed errors', () => {
    expect(() => evaluateFormula('1/0', read)).toThrow('#DIV/0')
    expect(() => evaluateFormula('C1+1', read)).toThrow('#VALUE')
    expect(() => evaluateFormula('NOPE(1)', read)).toThrow('unknown')
    expect(() => evaluateFormula('1+', read)).toThrow()
  })

  it('expands ranges and round-trips column names', () => {
    expect(expandRange('A1:B2')).toEqual(['A1', 'B1', 'A2', 'B2'])
    expect(indexToCol(0)).toBe('A')
    expect(indexToCol(25)).toBe('Z')
    expect(indexToCol(26)).toBe('AA')
  })
})
