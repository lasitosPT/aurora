import { describe, expect, it } from 'vitest'
import './wave'

describe('aurora-wave', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-wave')).toBeTypeOf('function')
  })

  it('mounts a canvas and degrades gracefully without WebGL', () => {
    const el = document.createElement('aurora-wave')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('canvas')).not.toBeNull()
    el.remove()
  })
})
