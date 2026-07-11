import { describe, expect, it } from 'vitest'
import './reveal'

describe('aurora-reveal', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-reveal')).toBeTypeOf('function')
  })

  it('renders its content through a slot', () => {
    const el = document.createElement('aurora-reveal')
    el.innerHTML = '<p>Revealed content</p>'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    expect(el.querySelector('p')?.textContent).toBe('Revealed content')
    el.remove()
  })
})
