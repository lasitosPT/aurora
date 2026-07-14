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

describe('chart type wave', () => {
  const series = [{ label: 'Revenue', data: [4, 8, 6, 10] }]
  const labels = ['Q1', 'Q2', 'Q3', 'Q4']

  it('renders area, pie, scatter, and stacked variants without error', () => {
    for (const type of ['area', 'pie', 'scatter']) {
      const el = document.createElement('aurora-chart') as AuroraChart
      el.setAttribute('type', type)
      document.body.append(el)
      el.labels = labels
      el.series = series
      expect(el.shadowRoot?.querySelector('canvas')).not.toBeNull()
      el.remove()
    }
    const stacked = document.createElement('aurora-chart') as AuroraChart
    stacked.setAttribute('stacked', '')
    document.body.append(stacked)
    stacked.labels = labels
    stacked.series = [
      { label: 'A', data: [1, 2, 3, 4] },
      { label: 'B', data: [4, 3, 2, 1] },
    ]
    expect(stacked.shadowRoot?.querySelectorAll('.key').length).toBe(2)
    stacked.remove()
  })

  it('legends pie/donut charts by category labels, not series', () => {
    const el = document.createElement('aurora-chart') as AuroraChart
    el.setAttribute('type', 'pie')
    document.body.append(el)
    el.labels = labels
    el.series = series
    const keys = el.shadowRoot?.querySelectorAll('.key')
    expect(keys?.length).toBe(4)
    expect(keys?.[0]?.textContent).toBe('Q1')
    el.remove()
  })
})

describe('funnel and pyramid charts', () => {
  it('renders both stage types with category legends', () => {
    for (const type of ['funnel', 'pyramid']) {
      const el = document.createElement('aurora-chart') as AuroraChart
      el.setAttribute('type', type)
      document.body.append(el)
      el.labels = ['Visits', 'Signups', 'Paid']
      el.series = [{ label: 'Conversion', data: [1000, 320, 64] }]
      const keys = el.shadowRoot?.querySelectorAll('.key')
      expect(keys?.length).toBe(3)
      expect(keys?.[0]?.textContent).toBe('Visits')
      el.remove()
    }
  })
})
