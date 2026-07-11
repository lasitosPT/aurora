import { describe, expect, it } from 'vitest'
import './calendar'
import type { AuroraCalendar } from './calendar'

describe('aurora-calendar', () => {
  it('registers, renders a month and picks a date', () => {
    const el = document.createElement('aurora-calendar') as AuroraCalendar
    el.setAttribute('value', '2026-07-11')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.title')?.textContent).toContain('July 2026')
    expect(el.shadowRoot?.querySelector('[aria-selected="true"]')?.textContent).toBe('11')

    let changed = ''
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-20"]')?.click()
    expect(changed).toBe('2026-07-20')
    expect(el.value).toBe('2026-07-20')
    el.remove()
  })

  it('navigates months', () => {
    const el = document.createElement('aurora-calendar') as AuroraCalendar
    el.setAttribute('value', '2026-07-11')
    document.body.append(el)
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-nav="1"]')?.click()
    expect(el.shadowRoot?.querySelector('.title')?.textContent).toContain('August 2026')
    el.remove()
  })
})
