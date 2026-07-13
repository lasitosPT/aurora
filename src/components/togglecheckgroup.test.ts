import { describe, expect, it } from 'vitest'
import './checkboxgroup'
import './togglebutton'
import type { AuroraCheckboxgroup } from './checkboxgroup'
import type { AuroraTogglebutton } from './togglebutton'

describe('aurora-checkboxgroup', () => {
  it('composes checkboxes, seeds values, and tracks the checked set', () => {
    const el = document.createElement('aurora-checkboxgroup') as AuroraCheckboxgroup
    el.setAttribute('values', 'a,c')
    el.innerHTML =
      '<option value="a">Alpha</option><option value="b">Beta</option><option value="c">Gamma</option>'
    document.body.append(el)
    const boxes = el.shadowRoot?.querySelectorAll('aurora-checkbox')
    expect(boxes?.length).toBe(3)
    expect(el.values.sort()).toEqual(['a', 'c'])
    let got: string[] = []
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ values: string[] }>).detail.values
    })
    ;(boxes?.[1] as HTMLElement & { toggle: () => void }).toggle()
    expect(got.sort()).toEqual(['a', 'b', 'c'])
    el.remove()
  })
})

describe('aurora-togglebutton', () => {
  it('flips pressed on click with aria and events', () => {
    const el = document.createElement('aurora-togglebutton') as AuroraTogglebutton
    el.textContent = 'Bold'
    document.body.append(el)
    let got: boolean | null = null
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ pressed: boolean }>).detail.pressed
    })
    el.shadowRoot?.querySelector('button')?.click()
    expect(el.pressed).toBe(true)
    expect(got).toBe(true)
    expect(el.shadowRoot?.querySelector('button')?.getAttribute('aria-pressed')).toBe('true')
    el.shadowRoot?.querySelector('button')?.click()
    expect(el.pressed).toBe(false)
    el.remove()
  })
})
