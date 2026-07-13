import { describe, expect, it } from 'vitest'
import './timeline'
import type { AuroraTimeline } from './timeline'

describe('aurora-timeline', () => {
  it('renders items with dates, headings, slotted bodies and list semantics', () => {
    const el = document.createElement('aurora-timeline') as AuroraTimeline
    el.innerHTML = `
      <aurora-timeline-item date="Jan 2026" heading="First release">Shipped v0.1</aurora-timeline-item>
      <aurora-timeline-item date="Jul 2026" heading="Enterprise" color="#22d3ee">TreeList lands</aurora-timeline-item>
    `
    document.body.append(el)
    expect(el.getAttribute('role')).toBe('list')
    const items = el.querySelectorAll('aurora-timeline-item')
    expect(items.length).toBe(2)
    expect(items[0]?.getAttribute('role')).toBe('listitem')
    expect(items[0]?.shadowRoot?.querySelector('.date')?.textContent).toBe('Jan 2026')
    expect(items[0]?.shadowRoot?.querySelector('h4')?.textContent).toBe('First release')
    expect(items[1]?.shadowRoot?.querySelector('.dot')).not.toBeNull()
    expect((items[1] as HTMLElement).style.getPropertyValue('--aurora-timeline-dot')).toBe(
      '#22d3ee',
    )
    expect(el.shadowRoot?.querySelector('.line')).not.toBeNull()
    el.remove()
  })

  it('renders items without a date or heading gracefully', () => {
    const el = document.createElement('aurora-timeline') as AuroraTimeline
    el.innerHTML = '<aurora-timeline-item>Just text</aurora-timeline-item>'
    document.body.append(el)
    const item = el.querySelector('aurora-timeline-item')
    expect(item?.shadowRoot?.querySelector('.date')).toBeNull()
    expect(item?.shadowRoot?.querySelector('h4')).toBeNull()
    expect(item?.shadowRoot?.querySelector('.card')).not.toBeNull()
    el.remove()
  })
})
