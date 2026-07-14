import { describe, expect, it } from 'vitest'
import './chart'
import { aggregateByDate } from './chart'
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

describe('chart depth (v1.3)', () => {
  it('renders title and axis captions', () => {
    const el = document.createElement('aurora-chart') as AuroraChart
    el.setAttribute('chart-title', 'Revenue by quarter')
    el.setAttribute('x-title', 'Quarter')
    el.setAttribute('y-title', 'MRR (k€)')
    document.body.append(el)
    el.labels = ['Q1', 'Q2']
    el.series = [{ label: 'MRR', data: [1, 2] }]
    expect(el.shadowRoot?.querySelector('.heading')?.textContent).toBe('Revenue by quarter')
    expect(el.shadowRoot?.querySelector('.axis-x')?.textContent).toBe('Quarter')
    expect(el.shadowRoot?.querySelector('.axis-y')?.textContent).toBe('MRR (k€)')
    el.remove()
  })

  it('shows the no-data state for empty series and recovers', () => {
    const el = document.createElement('aurora-chart') as AuroraChart
    el.setAttribute('empty-text', 'Nothing yet')
    document.body.append(el)
    el.series = []
    expect(el.shadowRoot?.querySelector<HTMLElement>('.nodata')?.hidden).toBe(false)
    expect(el.shadowRoot?.querySelector('.nodata')?.textContent).toBe('Nothing yet')
    el.series = [{ label: 'A', data: [1, 2, 3] }]
    expect(el.shadowRoot?.querySelector<HTMLElement>('.nodata')?.hidden).toBe(true)
    el.remove()
  })

  it('exposes image export methods', () => {
    const el = document.createElement('aurora-chart') as AuroraChart
    document.body.append(el)
    el.series = [{ label: 'A', data: [1] }]
    expect(typeof el.toImage()).toBe('string')
    el.remove()
  })
})

describe('date series (v2.4)', () => {
  it('buckets daily points into months, aggregating and zero-filling', () => {
    const out = aggregateByDate(
      ['2026-01-05', '2026-01-20', '2026-03-02'],
      [{ label: 'Sales', data: [10, 5, 7] }],
      'month',
    )
    expect(out.unit).toBe('month')
    expect(out.labels).toEqual(['Jan 26', 'Feb 26', 'Mar 26'])
    expect(out.series[0]?.data).toEqual([15, 0, 7])
  })

  it('supports avg/min/max aggregates', () => {
    const labels = ['2026-01-01', '2026-01-02']
    const series = [{ label: 'x', data: [10, 20] }]
    expect(aggregateByDate(labels, series, 'month', 'avg').series[0]?.data).toEqual([15])
    expect(aggregateByDate(labels, series, 'month', 'min').series[0]?.data).toEqual([10])
    expect(aggregateByDate(labels, series, 'month', 'max').series[0]?.data).toEqual([20])
  })

  it('picks a base unit from the span when auto', () => {
    expect(aggregateByDate(['2026-01-01', '2026-01-04'], [{ label: 'x', data: [1, 1] }]).unit).toBe(
      'day',
    )
    expect(aggregateByDate(['2026-01-01', '2026-03-01'], [{ label: 'x', data: [1, 1] }]).unit).toBe(
      'week',
    )
    expect(aggregateByDate(['2024-07-01', '2026-01-01'], [{ label: 'x', data: [1, 1] }]).unit).toBe(
      'month',
    )
    expect(aggregateByDate(['2020-01-01', '2026-01-01'], [{ label: 'x', data: [1, 1] }]).unit).toBe(
      'year',
    )
  })

  it('weeks start on Monday and label by start date', () => {
    const out = aggregateByDate(
      ['2026-07-07', '2026-07-14'], // Tue + following Tue
      [{ label: 'x', data: [1, 2] }],
      'week',
    )
    expect(out.labels).toEqual(['Jul 6', 'Jul 13'])
    expect(out.series[0]?.data).toEqual([1, 2])
  })

  it('carries error bars only through single-point buckets', () => {
    const out = aggregateByDate(
      ['2026-01-01', '2026-02-01', '2026-02-02'],
      [{ label: 'x', data: [10, 4, 6], errors: [2, 1, 1] }],
      'month',
    )
    expect(out.series[0]?.errors).toEqual([2, null])
    expect(out.series[0]?.data).toEqual([10, 10])
  })
})
