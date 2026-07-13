import { describe, expect, it } from 'vitest'
import './checkbox'
import './radiogroup'
import type { AuroraCheckbox } from './checkbox'
import type { AuroraRadiogroup } from './radiogroup'

describe('aurora-checkbox', () => {
  it('toggles via click, reflects checked, and emits aurora-change', () => {
    const el = document.createElement('aurora-checkbox') as AuroraCheckbox
    el.setAttribute('label', 'Accept terms')
    document.body.append(el)
    let got: boolean | null = null
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ checked: boolean }>).detail.checked
    })
    el.click()
    expect(el.checked).toBe(true)
    expect(got).toBe(true)
    expect(el.shadowRoot?.querySelector('.box')?.getAttribute('aria-checked')).toBe('true')
    el.click()
    expect(el.checked).toBe(false)
    el.remove()
  })

  it('supports indeterminate (mixed) until toggled and respects disabled', () => {
    const el = document.createElement('aurora-checkbox') as AuroraCheckbox
    el.setAttribute('indeterminate', '')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.box')?.getAttribute('aria-checked')).toBe('mixed')
    el.toggle()
    expect(el.hasAttribute('indeterminate')).toBe(false)
    expect(el.checked).toBe(true)
    el.setAttribute('disabled', '')
    el.toggle()
    expect(el.checked).toBe(true)
    el.remove()
  })
})

describe('aurora-radiogroup', () => {
  function make(): AuroraRadiogroup {
    const el = document.createElement('aurora-radiogroup') as AuroraRadiogroup
    el.innerHTML =
      '<option value="s">Starter</option><option value="p">Pro</option><option value="e">Enterprise</option>'
    document.body.append(el)
    return el
  }

  it('selects on click with radiogroup semantics', () => {
    const el = make()
    expect(el.getAttribute('role')).toBe('radiogroup')
    let got = ''
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelectorAll<HTMLElement>('.opt')[1]?.click()
    expect(got).toBe('p')
    expect(el.value).toBe('p')
    expect(el.shadowRoot?.querySelectorAll('[aria-checked="true"]').length).toBe(2)
    el.remove()
  })

  it('moves selection with arrow keys and wraps', () => {
    const el = make()
    el.value = 'e'
    const dot = el.shadowRoot?.querySelector<HTMLButtonElement>('.opt[data-v="e"] .dot')
    dot?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(el.value).toBe('s')
    el.remove()
  })
})
