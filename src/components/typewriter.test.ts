import { describe, expect, it } from 'vitest'
import './typewriter'
import type { AuroraTypewriter } from './typewriter'

describe('aurora-typewriter', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-typewriter')).toBeTypeOf('function')
  })

  it('types out its text after start()', async () => {
    const el = document.createElement('aurora-typewriter') as AuroraTypewriter
    el.setAttribute('speed', '400')
    el.textContent = 'typed'
    document.body.append(el)

    const span = el.shadowRoot?.querySelector('.text')
    el.start()
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(span?.textContent).toBe('typed')
    expect(el.shadowRoot?.querySelector('.caret')).not.toBeNull()
    el.remove()
  })
})
