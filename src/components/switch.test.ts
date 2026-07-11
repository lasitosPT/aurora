import { describe, expect, it } from 'vitest'
import './switch'
import type { AuroraSwitch } from './switch'

describe('aurora-switch', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-switch')).toBeTypeOf('function')
  })

  it('toggles checked state and aria-checked on click', () => {
    const el = document.createElement('aurora-switch') as AuroraSwitch
    document.body.append(el)
    const track = el.shadowRoot?.querySelector('.track') as HTMLElement

    expect(el.checked).toBe(false)
    expect(track.getAttribute('aria-checked')).toBe('false')

    track.click()
    expect(el.checked).toBe(true)
    expect(track.getAttribute('aria-checked')).toBe('true')

    el.checked = false
    expect(el.hasAttribute('checked')).toBe(false)
    expect(track.getAttribute('aria-checked')).toBe('false')
    el.remove()
  })
})
