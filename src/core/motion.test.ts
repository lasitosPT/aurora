import { describe, expect, it } from 'vitest'
import { clamp, lerp } from './motion'

describe('clamp', () => {
  it('returns values within range unchanged', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to the bounds', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('lerp', () => {
  it('interpolates between two values', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 1)).toBe(10)
  })
})
