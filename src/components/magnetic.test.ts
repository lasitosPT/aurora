import { describe, expect, it } from 'vitest'
import './magnetic'

describe('aurora-magnetic', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-magnetic')).toBeTypeOf('function')
  })

  it('wraps slotted content in a transformable element', () => {
    const el = document.createElement('aurora-magnetic')
    el.textContent = 'Hover me'
    document.body.append(el)
    const wrap = el.shadowRoot?.querySelector('.wrap')
    expect(wrap).not.toBeNull()
    expect(wrap?.querySelector('slot')).not.toBeNull()
    el.remove()
  })
})
