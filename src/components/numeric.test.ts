import { describe, expect, it } from 'vitest'
import './numeric'
import type { AuroraNumeric } from './numeric'

describe('aurora-numeric', () => {
  it('registers, steps within bounds and emits aurora-change', () => {
    const el = document.createElement('aurora-numeric') as AuroraNumeric
    el.setAttribute('value', '9')
    el.setAttribute('min', '0')
    el.setAttribute('max', '10')
    el.setAttribute('step', '1')
    document.body.append(el)
    let changed = -1
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: number }>).detail.value
    })
    const plus = el.shadowRoot?.querySelector<HTMLButtonElement>('[data-d="1"]')
    plus?.click()
    expect(el.value).toBe(10)
    expect(changed).toBe(10)
    plus?.click()
    expect(el.value).toBe(10) // clamped
    el.remove()
  })

  it('clamps and snaps typed input on commit', () => {
    const el = document.createElement('aurora-numeric') as AuroraNumeric
    el.setAttribute('min', '0')
    el.setAttribute('max', '100')
    el.setAttribute('step', '5')
    document.body.append(el)
    const input = el.shadowRoot?.querySelector('input')
    input!.value = '999'
    input!.dispatchEvent(new Event('blur'))
    expect(el.value).toBe(100)
    input!.value = '13'
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(el.value).toBe(15)
    el.remove()
  })
})
