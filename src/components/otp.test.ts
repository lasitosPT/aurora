import { describe, expect, it } from 'vitest'
import './otp'
import type { AuroraOtp } from './otp'

describe('aurora-otp', () => {
  it('registers, auto-advances and emits aurora-complete', () => {
    const el = document.createElement('aurora-otp') as AuroraOtp
    el.setAttribute('length', '4')
    document.body.append(el)
    const cells = el.shadowRoot?.querySelectorAll('input')
    expect(cells?.length).toBe(4)

    let complete = ''
    el.addEventListener('aurora-complete', (e) => {
      complete = (e as CustomEvent<{ value: string }>).detail.value
    })
    cells?.forEach((c, i) => {
      c.value = String(i + 1)
      c.dispatchEvent(new Event('input'))
    })
    expect(el.value).toBe('1234')
    expect(complete).toBe('1234')
    expect(el.hasAttribute('complete')).toBe(true)
    el.remove()
  })

  it('rejects non-digits in numeric mode', () => {
    const el = document.createElement('aurora-otp') as AuroraOtp
    document.body.append(el)
    const first = el.shadowRoot?.querySelector('input')
    first!.value = 'x'
    first!.dispatchEvent(new Event('input'))
    expect(el.value).toBe('')
    el.remove()
  })
})
