import { describe, expect, it } from 'vitest'
import './colorpalette'
import './durationpicker'
import type { AuroraColorpalette } from './colorpalette'
import type { AuroraDurationpicker } from './durationpicker'

describe('aurora-colorpalette', () => {
  it('renders swatches, picks with a check, and emits aurora-change', () => {
    const el = document.createElement('aurora-colorpalette') as AuroraColorpalette
    el.setAttribute('colors', '#111111,#222222,#333333')
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('button').length).toBe(3)
    let got = ''
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('button[data-c="#222222"]')?.click()
    expect(got).toBe('#222222')
    expect(el.value).toBe('#222222')
    expect(
      el.shadowRoot?.querySelector('button[data-c="#222222"]')?.getAttribute('aria-selected'),
    ).toBe('true')
    el.remove()
  })

  it('roves in two dimensions with arrows', () => {
    const el = document.createElement('aurora-colorpalette') as AuroraColorpalette
    el.setAttribute('colors', '#1,#2,#3,#4')
    el.setAttribute('columns', '2')
    document.body.append(el)
    const btns = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button')
    btns?.[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(btns?.[2]?.tabIndex).toBe(0)
    el.remove()
  })
})

describe('aurora-durationpicker', () => {
  function seg(el: AuroraDurationpicker, s: string): HTMLElement {
    const node = el.shadowRoot?.querySelector<HTMLElement>(`.seg[data-s="${s}"]`)
    if (!node) throw new Error('no segment')
    return node
  }

  it('accumulates hh:mm:ss and reports total seconds', () => {
    const el = document.createElement('aurora-durationpicker') as AuroraDurationpicker
    document.body.append(el)
    for (const k of '01')
      seg(el, 'hh').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
    for (const k of '30')
      seg(el, 'mm').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
    for (const k of '15')
      seg(el, 'ss').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
    expect(el.value).toBe('01:30:15')
    expect(el.seconds).toBe(5415)
    el.remove()
  })

  it('wraps minutes at sixty and seeds from value', () => {
    const el = document.createElement('aurora-durationpicker') as AuroraDurationpicker
    el.setAttribute('value', '02:59:00')
    document.body.append(el)
    seg(el, 'mm').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(seg(el, 'mm').textContent).toBe('00')
    expect(el.value).toBe('02:00:00')
    el.remove()
  })
})
