import { describe, expect, it } from 'vitest'
import './chartwizard'
import type { AuroraChartwizard } from './chartwizard'

const ROWS = [
  { quarter: 'Q1', revenue: 40, costs: 22 },
  { quarter: 'Q2', revenue: 55, costs: 25 },
  { quarter: 'Q3', revenue: 61, costs: 28 },
]

describe('aurora-chartwizard', () => {
  it('detects field types and seeds a live preview', () => {
    const el = document.createElement('aurora-chartwizard') as AuroraChartwizard
    document.body.append(el)
    el.data = ROWS
    expect(el.config).toEqual({ type: 'bar', labelField: 'quarter', valueFields: ['revenue'] })
    const chart = el.shadowRoot?.querySelector('aurora-chart') as
      (HTMLElement & { labels: string[]; series: { label: string }[] }) | null
    expect(chart?.labels).toEqual(['Q1', 'Q2', 'Q3'])
    expect(chart?.series[0]?.label).toBe('revenue')
    el.remove()
  })

  it('reconfigures through the controls and emits the config', () => {
    const el = document.createElement('aurora-chartwizard') as AuroraChartwizard
    document.body.append(el)
    el.data = ROWS
    let config = el.config
    el.addEventListener('aurora-change', (e) => {
      config = (e as CustomEvent<{ config: typeof config }>).detail.config
    })
    const group = el.shadowRoot?.querySelector('aurora-buttongroup')
    group?.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: 'area' } }))
    expect(config.type).toBe('area')
    expect(el.shadowRoot?.querySelector('aurora-chart')?.getAttribute('type')).toBe('area')
    const compare = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLSelectElement>('select[data-s]') ?? [],
    ).find((s) => s.dataset['s'] === 'Compare')
    if (compare) {
      compare.value = 'costs'
      compare.dispatchEvent(new Event('change'))
    }
    expect(config.valueFields).toEqual(['revenue', 'costs'])
    el.remove()
  })
})
