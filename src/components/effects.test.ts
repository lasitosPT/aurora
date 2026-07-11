import { describe, expect, it } from 'vitest'
import './orbit'
import './glitch'
import './progress'

describe('aurora-orbit', () => {
  it('is registered and hosts center + orbiting slots', () => {
    expect(customElements.get('aurora-orbit')).toBeTypeOf('function')
    const el = document.createElement('aurora-orbit')
    el.innerHTML = '<span slot="center">✦</span><i></i><i></i><i></i>'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('slot[name="center"]')).not.toBeNull()
    el.remove()
  })
})

describe('aurora-glitch', () => {
  it('is registered and renders base text plus two hidden layers', () => {
    expect(customElements.get('aurora-glitch')).toBeTypeOf('function')
    const el = document.createElement('aurora-glitch')
    el.textContent = 'AURORA'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.base')?.textContent).toBe('AURORA')
    expect(el.shadowRoot?.querySelectorAll('.layer').length).toBe(2)
    el.remove()
  })
})

describe('aurora-progress', () => {
  it('is registered and renders its bar', () => {
    expect(customElements.get('aurora-progress')).toBeTypeOf('function')
    const el = document.createElement('aurora-progress')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.bar')).not.toBeNull()
    expect(el.getAttribute('aria-hidden')).toBe('true')
    el.remove()
  })
})
