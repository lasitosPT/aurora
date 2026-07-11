import { describe, expect, it } from 'vitest'
import './button'

describe('aurora-button', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-button')).toBeTypeOf('function')
  })

  it('renders a button in the shadow root with the default variant', () => {
    const el = document.createElement('aurora-button')
    document.body.append(el)
    const button = el.shadowRoot?.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.getAttribute('data-variant')).toBe('primary')
    el.remove()
  })

  it('reflects the ghost variant', () => {
    const el = document.createElement('aurora-button')
    el.setAttribute('variant', 'ghost')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('button')?.getAttribute('data-variant')).toBe('ghost')
    el.remove()
  })
})
