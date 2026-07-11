import { describe, expect, it } from 'vitest'
import './nebula'
import './cursor'

describe('aurora-nebula', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-nebula')).toBeTypeOf('function')
  })

  it('mounts a canvas and degrades gracefully without WebGL', () => {
    const el = document.createElement('aurora-nebula')
    document.body.append(el)
    // happy-dom has no WebGL: the component must render its canvas and not throw.
    expect(el.shadowRoot?.querySelector('canvas')).not.toBeNull()
    el.remove()
  })
})

describe('aurora-cursor', () => {
  it('is registered and renders the trailing ring on fine pointers', () => {
    expect(customElements.get('aurora-cursor')).toBeTypeOf('function')
    const el = document.createElement('aurora-cursor')
    document.body.append(el)
    // happy-dom reports a fine pointer, so the ring renders.
    expect(el.shadowRoot?.querySelector('.ring')).not.toBeNull()
    el.remove()
  })
})
