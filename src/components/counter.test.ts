import { describe, expect, it } from 'vitest'
import './counter'
import type { AuroraCounter } from './counter'

describe('aurora-counter', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-counter')).toBeTypeOf('function')
  })

  it('renders the starting value and counts to the target on start()', async () => {
    const el = document.createElement('aurora-counter') as AuroraCounter
    el.setAttribute('from', '5')
    el.setAttribute('value', '42')
    el.setAttribute('duration', '0.05')
    document.body.append(el)

    const span = el.shadowRoot?.querySelector('span')
    expect(span?.textContent).toBe('5')

    el.start()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(span?.textContent).toBe('42')
    el.remove()
  })

  it('respects decimals', () => {
    const el = document.createElement('aurora-counter') as AuroraCounter
    el.setAttribute('from', '1.5')
    el.setAttribute('decimals', '1')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('span')?.textContent).toBe('1.5')
    el.remove()
  })
})
