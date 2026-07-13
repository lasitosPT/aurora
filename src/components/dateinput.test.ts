import { describe, expect, it } from 'vitest'
import './dateinput'
import type { AuroraDateinput } from './dateinput'

function seg(el: AuroraDateinput, s: string): HTMLElement {
  const node = el.shadowRoot?.querySelector<HTMLElement>(`.seg[data-s="${s}"]`)
  if (!node) throw new Error('no segment')
  return node
}

function type(el: AuroraDateinput, s: string, keys: string): void {
  for (const k of keys)
    seg(el, s).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
}

describe('aurora-dateinput', () => {
  it('accepts typed digits per segment and produces an ISO value', () => {
    const el = document.createElement('aurora-dateinput') as AuroraDateinput
    document.body.append(el)
    let got = ''
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    type(el, 'dd', '14')
    type(el, 'mm', '07')
    type(el, 'yyyy', '2026')
    expect(el.value).toBe('2026-07-14')
    expect(got).toBe('2026-07-14')
    el.remove()
  })

  it('rejects impossible dates and seeds from value', () => {
    const el = document.createElement('aurora-dateinput') as AuroraDateinput
    el.setAttribute('value', '2026-02-10')
    document.body.append(el)
    expect(el.value).toBe('2026-02-10')
    type(el, 'dd', '31')
    expect(el.value).toBeNull()
    el.remove()
  })

  it('increments with arrows and pads', () => {
    const el = document.createElement('aurora-dateinput') as AuroraDateinput
    document.body.append(el)
    seg(el, 'mm').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(seg(el, 'mm').textContent).toBe('01')
    seg(el, 'mm').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(seg(el, 'mm').textContent).toBe('01')
    el.remove()
  })
})
