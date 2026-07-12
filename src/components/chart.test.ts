import { describe, expect, it } from 'vitest'
import './chart'
import type { AuroraChart } from './chart'

describe('aurora-chart', () => {
  it('registers, renders legend keys and accepts series safely', () => {
    const el = document.createElement('aurora-chart') as AuroraChart
    el.setAttribute('type', 'bar')
    document.body.append(el)
    el.labels = ['Q1', 'Q2', 'Q3']
    expect(() => {
      el.series = [
        { label: 'Stars', data: [4, 9, 6] },
        { label: 'Forks', data: [2, 5, 3] },
      ]
    }).not.toThrow()
    const keys = el.shadowRoot?.querySelectorAll('.key')
    expect(keys?.length).toBe(2)
    expect(keys?.[0]?.textContent).toContain('Stars')
    expect(el.getAttribute('role')).toBe('img')
    el.remove()
  })
})
