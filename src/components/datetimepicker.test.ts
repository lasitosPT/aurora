import { describe, expect, it } from 'vitest'
import './datetimepicker'
import type { AuroraDatetimepicker } from './datetimepicker'

describe('aurora-datetimepicker', () => {
  it('opens, renders time slots by step, and seeds from value', () => {
    const el = document.createElement('aurora-datetimepicker') as AuroraDatetimepicker
    el.setAttribute('step', '60')
    el.setAttribute('value', '2026-07-15T14:00')
    document.body.append(el)
    expect(el.value).toBe('2026-07-15T14:00')
    el.shadowRoot?.querySelector<HTMLButtonElement>('.field')?.click()
    expect(el.hasAttribute('open')).toBe(true)
    expect(el.shadowRoot?.querySelectorAll('.times button').length).toBe(24)
    expect(el.shadowRoot?.querySelector('.text')?.textContent).toBe('2026-07-15 14:00')
    el.remove()
  })

  it('commits only when both date and time are picked, then closes', () => {
    const el = document.createElement('aurora-datetimepicker') as AuroraDatetimepicker
    el.setAttribute('step', '360')
    document.body.append(el)
    let got: string | null = null
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.field')?.click()
    el.shadowRoot?.querySelector<HTMLButtonElement>('.times button[data-t="12:00"]')?.click()
    expect(got).toBeNull()
    expect(el.hasAttribute('open')).toBe(true)
    const cal = el.shadowRoot?.querySelector('aurora-calendar') as
      (HTMLElement & { value: string | null }) | null
    if (cal) {
      cal.value = '2026-07-20'
      cal.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: '2026-07-20' } }))
    }
    expect(got).toBe('2026-07-20T12:00')
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})
