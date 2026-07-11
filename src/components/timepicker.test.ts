import { describe, expect, it } from 'vitest'
import './timepicker'
import type { AuroraTimepicker } from './timepicker'

describe('aurora-timepicker', () => {
  it('registers, renders columns and picks a time', () => {
    const el = document.createElement('aurora-timepicker') as AuroraTimepicker
    el.setAttribute('value', '14:30')
    el.setAttribute('step', '15')
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('[data-h]').length).toBe(24)
    expect(el.shadowRoot?.querySelectorAll('[data-m]').length).toBe(4)
    expect(el.shadowRoot?.querySelector('.label')?.textContent).toBe('14:30')

    let changed = ''
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.open()
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-h="9"]')?.click()
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-m="45"]')?.click()
    expect(changed).toBe('09:45')
    expect(el.value).toBe('09:45')
    el.remove()
  })
})
