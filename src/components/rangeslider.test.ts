import { describe, expect, it } from 'vitest'
import './rangeslider'
import type { AuroraRangeslider } from './rangeslider'

describe('aurora-rangeslider', () => {
  it('seeds from attributes and reflects positions and values', () => {
    const el = document.createElement('aurora-rangeslider') as AuroraRangeslider
    el.setAttribute('start', '20')
    el.setAttribute('end', '70')
    document.body.append(el)
    expect(el.start).toBe(20)
    expect(el.end).toBe(70)
    expect(el.shadowRoot?.querySelector('.thumb[data-t="a"]')?.getAttribute('aria-valuenow')).toBe(
      '20',
    )
    expect(el.shadowRoot?.querySelector('.va')?.textContent).toBe('20')
    expect(el.shadowRoot?.querySelector<HTMLElement>('.fill')?.style.width).toBe('50%')
    el.remove()
  })

  it('steps with arrows, clamps at the other thumb, and emits aurora-change', () => {
    const el = document.createElement('aurora-rangeslider') as AuroraRangeslider
    el.setAttribute('start', '48')
    el.setAttribute('end', '50')
    el.setAttribute('step', '2')
    document.body.append(el)
    let got: { start: number; end: number } | null = null
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ start: number; end: number }>).detail
    })
    const ta = el.shadowRoot?.querySelector<HTMLButtonElement>('.thumb[data-t="a"]')
    ta?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(el.start).toBe(50)
    ta?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(el.start).toBe(50)
    expect(got).toEqual({ start: 50, end: 50 })
    ta?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(el.start).toBe(0)
    el.remove()
  })

  it('setRange normalizes order and clamps to bounds', () => {
    const el = document.createElement('aurora-rangeslider') as AuroraRangeslider
    el.setAttribute('max', '50')
    document.body.append(el)
    el.setRange(80, 10)
    expect(el.start).toBe(10)
    expect(el.end).toBe(50)
    el.remove()
  })
})
