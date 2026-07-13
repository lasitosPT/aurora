import { describe, expect, it } from 'vitest'
import './gauge'
import type { AuroraGauge } from './gauge'

describe('aurora-gauge', () => {
  it('registers and renders each type with meter semantics', () => {
    for (const type of ['arc', 'circular', 'linear']) {
      const el = document.createElement('aurora-gauge') as AuroraGauge
      el.setAttribute('type', type)
      el.setAttribute('value', '72')
      el.setAttribute('label', 'CPU')
      document.body.append(el)
      expect(el.shadowRoot?.querySelector('svg')).not.toBeNull()
      expect(el.getAttribute('role')).toBe('meter')
      expect(el.getAttribute('aria-valuemax')).toBe('100')
      el.remove()
    }
  })

  it('clamps the fraction to min/max bounds', () => {
    const el = document.createElement('aurora-gauge') as AuroraGauge
    el.setAttribute('value', '250')
    el.setAttribute('max', '200')
    document.body.append(el)
    expect(el.value).toBe(250)
    expect(el.getAttribute('aria-valuemax')).toBe('200')
    el.remove()
  })
})
