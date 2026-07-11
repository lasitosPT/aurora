import { describe, expect, it } from 'vitest'
import './lens'

describe('aurora-lens', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-lens')).toBeTypeOf('function')
  })

  it('renders an accessible <img> fallback beneath the canvas', () => {
    const el = document.createElement('aurora-lens')
    el.setAttribute('src', '/hero.jpg')
    el.setAttribute('alt', 'Aurora artwork')
    document.body.append(el)

    const img = el.shadowRoot?.querySelector('img')
    expect(img?.getAttribute('alt')).toBe('Aurora artwork')
    expect(img?.getAttribute('src')).toContain('hero.jpg')
    // no WebGL in happy-dom: the canvas must stay a dormant overlay
    expect(el.shadowRoot?.querySelector('canvas')?.classList.contains('is-ready')).toBe(false)
    el.remove()
  })
})
