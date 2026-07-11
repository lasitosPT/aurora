import { describe, expect, it } from 'vitest'
import './scramble'
import type { AuroraScramble } from './scramble'

describe('aurora-scramble', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-scramble')).toBeTypeOf('function')
  })

  it('renders the original text and settles back to it after play()', async () => {
    const el = document.createElement('aurora-scramble') as AuroraScramble
    el.setAttribute('duration', '0.05')
    el.textContent = 'decode me'
    document.body.append(el)

    const span = el.shadowRoot?.querySelector('span[part="text"], span')
    expect(span?.textContent).toBe('decode me')

    let completed = false
    el.addEventListener('aurora-complete', () => {
      completed = true
    })
    el.play()
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(span?.textContent).toBe('decode me')
    expect(completed).toBe(true)
    el.remove()
  })
})
