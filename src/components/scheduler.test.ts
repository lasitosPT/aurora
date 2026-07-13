import { describe, expect, it } from 'vitest'
import './scheduler'
import type { AuroraScheduler } from './scheduler'

describe('aurora-scheduler', () => {
  it('registers, renders the week grid and positions events', () => {
    const el = document.createElement('aurora-scheduler') as AuroraScheduler
    el.setAttribute('date', '2026-07-13') // a Monday
    document.body.append(el)
    el.events = [
      { title: 'Standup', start: '2026-07-13T09:00', end: '2026-07-13T09:30' },
      { title: 'Review', start: '2026-07-15T14:00', end: '2026-07-15T15:30', color: '#22d3ee' },
    ]
    expect(el.shadowRoot?.querySelectorAll('.day').length).toBe(7)
    expect(el.shadowRoot?.querySelectorAll('.ev').length).toBe(2)
    expect(el.shadowRoot?.querySelector('.bar strong')?.textContent).toContain('Jul 13')

    let picked = ''
    el.addEventListener('aurora-select', (e) => {
      picked = (e as CustomEvent<{ event: { title: string } }>).detail.event.title
    })
    el.shadowRoot?.querySelector<HTMLElement>('.ev')?.click()
    expect(picked).toBe('Standup')
    el.remove()
  })

  it('pages weeks and emits aurora-range', () => {
    const el = document.createElement('aurora-scheduler') as AuroraScheduler
    el.setAttribute('date', '2026-07-13')
    document.body.append(el)
    let start = ''
    el.addEventListener('aurora-range', (e) => {
      start = (e as CustomEvent<{ start: string }>).detail.start
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-w="1"]')?.click()
    expect(start).toBe('2026-07-20')
    el.remove()
  })
})

describe('scheduler views', () => {
  const EVENTS = [
    { title: 'Standup', start: '2026-07-13T09:00', end: '2026-07-13T09:30' },
    { title: 'Review', start: '2026-07-13T14:00', end: '2026-07-13T15:00', color: '#22d3ee' },
    { title: 'Retro', start: '2026-07-15T16:00', end: '2026-07-15T17:00' },
  ]

  function makeView(view: string): AuroraScheduler {
    const el = document.createElement('aurora-scheduler') as AuroraScheduler
    el.setAttribute('date', '2026-07-13')
    el.setAttribute('view', view)
    document.body.append(el)
    el.events = EVENTS
    return el
  }

  it('renders a single-column day view', () => {
    const el = makeView('day')
    expect(el.shadowRoot?.querySelectorAll('.day').length).toBe(1)
    expect(el.shadowRoot?.querySelectorAll('.ev').length).toBe(2)
    el.remove()
  })

  it('renders month cells with chips and a more tail', () => {
    const el = makeView('month')
    expect((el.shadowRoot?.querySelectorAll('.mcell').length ?? 1) % 7).toBe(0)
    expect(el.shadowRoot?.querySelectorAll('.chip').length).toBe(3)
    expect(el.shadowRoot?.querySelector('strong')?.textContent).toBe('July 2026')
    el.remove()
  })

  it('renders a grouped agenda and pages by fourteen days', () => {
    const el = makeView('agenda')
    expect(el.shadowRoot?.querySelectorAll('.aday').length).toBe(2)
    expect(el.shadowRoot?.querySelectorAll('.arow').length).toBe(3)
    let range: { start: string; view: string } | null = null
    el.addEventListener('aurora-range', (e) => {
      range = (e as CustomEvent<{ start: string; view: string }>).detail
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-w="1"]')?.click()
    expect(range).toEqual({ start: '2026-07-27', view: 'agenda' })
    expect(el.shadowRoot?.querySelector('.empty')).not.toBeNull()
    el.remove()
  })

  it('switches views from the toolbar and emits the change', () => {
    const el = makeView('week')
    let range: { view: string } | null = null
    el.addEventListener('aurora-range', (e) => {
      range = (e as CustomEvent<{ view: string }>).detail
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-view="month"]')?.click()
    expect(el.view).toBe('month')
    expect(range).toEqual(expect.objectContaining({ view: 'month' }))
    expect(el.shadowRoot?.querySelector('[data-view="month"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    )
    el.remove()
  })
})
