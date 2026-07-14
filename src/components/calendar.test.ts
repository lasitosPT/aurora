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

describe('calendar depth (v1.1)', () => {
  it('disables days outside min/max and explicit disabled dates', () => {
    const el = document.createElement('aurora-calendar') as AuroraCalendar
    el.setAttribute('value', '2026-07-15')
    el.setAttribute('min', '2026-07-10')
    el.setAttribute('max', '2026-07-20')
    el.setAttribute('disabled-dates', '2026-07-14')
    document.body.append(el)
    expect(
      el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-05"]')?.disabled,
    ).toBe(true)
    expect(
      el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-25"]')?.disabled,
    ).toBe(true)
    expect(
      el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-14"]')?.disabled,
    ).toBe(true)
    expect(
      el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-12"]')?.disabled,
    ).toBe(false)
    let changed = false
    el.addEventListener('aurora-change', () => {
      changed = true
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-14"]')?.click()
    expect(changed).toBe(false)
    el.remove()
  })

  it('supports a disabledDate veto function', () => {
    const el = document.createElement('aurora-calendar') as AuroraCalendar
    el.setAttribute('value', '2026-07-15')
    document.body.append(el)
    el.disabledDate = (iso) => new Date(`${iso}T00:00`).getDay() === 0
    el.value = '2026-07-15'
    expect(
      el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-19"]')?.disabled,
    ).toBe(true)
    expect(
      el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-18"]')?.disabled,
    ).toBe(false)
    el.remove()
  })

  it('shows ISO week numbers and hides other-month days on request', () => {
    const el = document.createElement('aurora-calendar') as AuroraCalendar
    el.setAttribute('value', '2026-07-15')
    el.setAttribute('week-numbers', '')
    el.setAttribute('hide-other-months', '')
    document.body.append(el)
    const weeks = Array.from(el.shadowRoot?.querySelectorAll('.wk') ?? []).map((w) => w.textContent)
    expect(weeks).toContain('29')
    expect(el.shadowRoot?.querySelectorAll('.day.hidden-other').length).toBeGreaterThan(0)
    el.remove()
  })

  it('zooms month → year → decade and drills back down', () => {
    const el = document.createElement('aurora-calendar') as AuroraCalendar
    el.setAttribute('value', '2026-07-15')
    document.body.append(el)
    el.shadowRoot?.querySelector<HTMLButtonElement>('.title')?.click()
    expect(el.shadowRoot?.querySelector('.title')?.textContent).toBe('2026')
    expect(el.shadowRoot?.querySelectorAll('.zoom button').length).toBe(12)
    el.shadowRoot?.querySelector<HTMLButtonElement>('.title')?.click()
    expect(el.shadowRoot?.querySelector('.title')?.textContent).toBe('2020 – 2029')
    // pick 2027 (label match)
    const yearBtn = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.zoom button') ?? [],
    ).find((b) => b.textContent === '2027')
    yearBtn?.click()
    expect(el.shadowRoot?.querySelector('.title')?.textContent).toBe('2027')
    const marBtn = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.zoom button') ?? [],
    ).find((b) => b.textContent === 'Mar')
    marBtn?.click()
    expect(el.shadowRoot?.querySelector('.title')?.textContent).toBe('March 2027')
    expect(el.shadowRoot?.querySelectorAll('.day').length).toBe(42)
    el.remove()
  })

  it('starts in a configured view', () => {
    const el = document.createElement('aurora-calendar') as AuroraCalendar
    el.setAttribute('start-view', 'year')
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('.zoom button').length).toBe(12)
    el.remove()
  })
})
