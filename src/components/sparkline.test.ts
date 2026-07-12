import { describe, expect, it } from 'vitest'
import './sparkline'
import type { AuroraSparkline } from './sparkline'

describe('aurora-sparkline', () => {
  it('registers, renders a canvas with img role and accepts data safely', () => {
    const el = document.createElement('aurora-sparkline') as AuroraSparkline
    document.body.append(el)
    expect(customElements.get('aurora-sparkline')).toBeTypeOf('function')
    expect(el.shadowRoot?.querySelector('canvas')).not.toBeNull()
    expect(el.getAttribute('role')).toBe('img')
    // happy-dom has no 2D context — assigning data must not throw
    expect(() => {
      el.data = [3, 7, 4, 9, 6, 12, 8]
    }).not.toThrow()
    expect(el.data.length).toBe(7)
    el.remove()
  })
})
