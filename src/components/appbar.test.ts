import { describe, expect, it } from 'vitest'
import './appbar'
import type { AuroraAppbar } from './appbar'

describe('aurora-appbar', () => {
  it('renders three slot regions with banner semantics', () => {
    const el = document.createElement('aurora-appbar') as AuroraAppbar
    el.innerHTML =
      '<strong slot="start">aurora</strong><nav>links</nav><button slot="end">Sign in</button>'
    document.body.append(el)
    expect(el.getAttribute('role')).toBe('banner')
    expect(el.shadowRoot?.querySelector('slot[name="start"]')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('slot[name="end"]')).not.toBeNull()
    expect(el.hasAttribute('elevated')).toBe(false)
    el.remove()
  })

  it('elevates once scrolled and hides on downward scroll when asked', () => {
    const el = document.createElement('aurora-appbar') as AuroraAppbar
    el.setAttribute('hide-on-scroll', '')
    document.body.append(el)
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    expect(el.hasAttribute('elevated')).toBe(true)
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    expect(el.hasAttribute('hidden-by-scroll')).toBe(true)
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    expect(el.hasAttribute('hidden-by-scroll')).toBe(false)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    el.remove()
  })
})
