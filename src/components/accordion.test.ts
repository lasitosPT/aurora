import { describe, expect, it } from 'vitest'
import './accordion'
import type { AuroraAccordion } from './accordion'

describe('aurora-accordion', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-accordion')).toBeTypeOf('function')
  })

  it('toggles open state and aria-expanded', () => {
    const el = document.createElement('aurora-accordion') as AuroraAccordion
    el.setAttribute('label', 'Section')
    el.textContent = 'Body content'
    document.body.append(el)

    const header = el.shadowRoot?.querySelector('.header')
    expect(header?.getAttribute('aria-expanded')).toBe('false')

    el.show()
    expect(el.hasAttribute('open')).toBe(true)
    expect(header?.getAttribute('aria-expanded')).toBe('true')

    el.hide()
    expect(el.hasAttribute('open')).toBe(false)
    expect(header?.getAttribute('aria-expanded')).toBe('false')
    el.remove()
  })
})
