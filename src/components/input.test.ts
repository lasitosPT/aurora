import { describe, expect, it } from 'vitest'
import './input'
import type { AuroraInput } from './input'

describe('aurora-input', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-input')).toBeTypeOf('function')
  })

  it('renders a label and reflects its value', () => {
    const el = document.createElement('aurora-input') as AuroraInput
    el.setAttribute('label', 'Email')
    el.setAttribute('value', 'a@b.com')
    document.body.append(el)

    expect(el.shadowRoot?.querySelector('.label')?.textContent).toBe('Email')
    expect(el.value).toBe('a@b.com')

    el.value = 'changed'
    expect((el.shadowRoot?.querySelector('input') as HTMLInputElement).value).toBe('changed')
    el.remove()
  })
})
