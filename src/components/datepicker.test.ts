import { describe, expect, it } from 'vitest'
import './datepicker'
import type { AuroraDatepicker } from './datepicker'

describe('aurora-datepicker', () => {
  it('registers, composes an aurora-calendar, and picks through it', () => {
    const el = document.createElement('aurora-datepicker') as AuroraDatepicker
    el.setAttribute('value', '2026-07-11')
    document.body.append(el)
    const cal = el.shadowRoot?.querySelector('aurora-calendar')
    expect(cal).not.toBeNull()
    expect(el.shadowRoot?.querySelector('.label')?.textContent).toBe('2026-07-11')

    let changed = ''
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.open()
    cal?.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-24"]')?.click()
    expect(changed).toBe('2026-07-24')
    expect(el.value).toBe('2026-07-24')
    expect(el.shadowRoot?.querySelector<HTMLElement>('.pop')?.style.display).toBe('none')
    el.remove()
  })
})
