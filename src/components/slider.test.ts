import { describe, expect, it } from 'vitest'
import './slider'
import type { AuroraSlider } from './slider'

describe('aurora-slider', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-slider')).toBeTypeOf('function')
  })

  it('honours the initial value and exposes it via aria', () => {
    const el = document.createElement('aurora-slider') as AuroraSlider
    el.setAttribute('min', '0')
    el.setAttribute('max', '100')
    el.setAttribute('value', '40')
    document.body.append(el)

    expect(el.value).toBe(40)
    expect(el.shadowRoot?.querySelector('.track')?.getAttribute('aria-valuenow')).toBe('40')
    el.remove()
  })

  it('clamps and snaps assigned values to the range and step', () => {
    const el = document.createElement('aurora-slider') as AuroraSlider
    el.setAttribute('min', '0')
    el.setAttribute('max', '10')
    el.setAttribute('step', '2')
    document.body.append(el)

    el.value = 999
    expect(el.value).toBe(10)

    el.value = -5
    expect(el.value).toBe(0)

    el.value = 5
    expect(el.value % 2).toBe(0)
    el.remove()
  })
})
