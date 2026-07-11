import { describe, expect, it } from 'vitest'
import './text'

describe('aurora-text', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-text')).toBeTypeOf('function')
  })

  it('splits into one unit per word by default', () => {
    const el = document.createElement('aurora-text')
    el.textContent = 'Motion built in'
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('.unit').length).toBe(3)
    expect(el.shadowRoot?.querySelectorAll('.mask').length).toBe(3)
    el.remove()
  })

  it('splits into one unit per character with by="chars"', () => {
    const el = document.createElement('aurora-text')
    el.setAttribute('by', 'chars')
    el.textContent = 'aurora glow'
    document.body.append(el)
    // 10 non-space characters across 2 word masks
    expect(el.shadowRoot?.querySelectorAll('.unit').length).toBe(10)
    expect(el.shadowRoot?.querySelectorAll('.mask').length).toBe(2)
    el.remove()
  })
})
