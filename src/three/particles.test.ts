import { describe, expect, it } from 'vitest'
import './particles'

describe('aurora-particles', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-particles')).toBeTypeOf('function')
  })

  it('mounts a canvas and degrades gracefully without WebGL', () => {
    const el = document.createElement('aurora-particles')
    el.setAttribute('count', '10')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('canvas')).not.toBeNull()
    el.remove()
  })
})
