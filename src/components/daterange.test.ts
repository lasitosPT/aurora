import { describe, expect, it } from 'vitest'
import './daterange'
import type { AuroraDaterange } from './daterange'

describe('aurora-daterange', () => {
  it('registers, picks a range with auto-swap and emits aurora-change', () => {
    const el = document.createElement('aurora-daterange') as AuroraDaterange
    el.setAttribute('start', '2026-07-01')
    document.body.append(el)
    let range: Record<string, string> = {}
    el.addEventListener('aurora-change', (e) => {
      range = (e as CustomEvent<Record<string, string>>).detail
    })
    el.open()
    // pick 20th then 10th — should swap
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-20"]')?.click()
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-iso="2026-07-10"]')?.click()
    expect(el.start).toBe('2026-07-10')
    expect(el.end).toBe('2026-07-20')
    expect(range.start).toBe('2026-07-10')
    // in-range highlighting
    el.open()
    expect(el.shadowRoot?.querySelector('[data-iso="2026-07-15"]')?.classList.contains('in')).toBe(
      true,
    )
    expect(
      el.shadowRoot?.querySelector('[data-iso="2026-07-10"]')?.classList.contains('start'),
    ).toBe(true)
    el.remove()
  })
})
