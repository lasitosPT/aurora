import { describe, expect, it } from 'vitest'
import './textarea'
import type { AuroraTextarea } from './textarea'

describe('aurora-textarea', () => {
  it('renders label, seeds value, and re-emits input across the boundary', () => {
    const el = document.createElement('aurora-textarea') as AuroraTextarea
    el.setAttribute('label', 'Bio')
    el.setAttribute('value', 'Hello')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.label')?.textContent).toBe('Bio')
    expect(el.value).toBe('Hello')
    let fired = false
    el.addEventListener('input', () => {
      fired = true
    })
    const area = el.shadowRoot?.querySelector('textarea')
    if (area) {
      area.value = 'Hello world'
      area.dispatchEvent(new Event('input'))
    }
    expect(fired).toBe(true)
    expect(el.value).toBe('Hello world')
    el.remove()
  })

  it('tracks the character counter against maxlength', () => {
    const el = document.createElement('aurora-textarea') as AuroraTextarea
    el.setAttribute('maxlength', '10')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.counter')?.textContent).toBe('0 / 10')
    el.value = '1234567890'
    expect(el.shadowRoot?.querySelector('.counter')?.textContent).toBe('10 / 10')
    expect(el.shadowRoot?.querySelector('.counter')?.classList.contains('over')).toBe(true)
    el.remove()
  })
})
