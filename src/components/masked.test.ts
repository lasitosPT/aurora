import { describe, expect, it } from 'vitest'
import './masked'
import type { AuroraMasked } from './masked'

describe('aurora-masked', () => {
  it('registers and formats typed input to the mask', () => {
    const el = document.createElement('aurora-masked') as AuroraMasked
    el.setAttribute('mask', '(###) ###-####')
    document.body.append(el)
    const input = el.shadowRoot?.querySelector('input')
    input!.value = '5551234567'
    input!.dispatchEvent(new Event('input'))
    expect(el.value).toBe('(555) 123-4567')
    expect(el.raw).toBe('5551234567')
    expect(el.hasAttribute('complete')).toBe(true)
    el.remove()
  })

  it('rejects wrong character classes and reports incomplete', () => {
    const el = document.createElement('aurora-masked') as AuroraMasked
    el.setAttribute('mask', 'AA-##')
    document.body.append(el)
    const input = el.shadowRoot?.querySelector('input')
    input!.value = 'ab12'
    input!.dispatchEvent(new Event('input'))
    expect(el.value).toBe('ab-12')
    input!.value = 'ab1'
    input!.dispatchEvent(new Event('input'))
    expect(el.hasAttribute('complete')).toBe(false)
    el.remove()
  })
})
