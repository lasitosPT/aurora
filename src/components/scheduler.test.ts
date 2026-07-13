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
