import { describe, expect, it } from 'vitest'
import './combobox'
import type { AuroraCombobox } from './combobox'

function make(custom = false): AuroraCombobox {
  const el = document.createElement('aurora-combobox') as AuroraCombobox
  if (custom) el.setAttribute('allow-custom', '')
  el.innerHTML = '<option>TypeScript</option><option>JavaScript</option><option>Go</option>'
  document.body.append(el)
  return el
}

describe('aurora-combobox', () => {
  it('filters options as you type with highlighted matches', () => {
    const el = make()
    const input = el.shadowRoot?.querySelector('input')
    if (!input) throw new Error('no input')
    input.value = 'script'
    input.dispatchEvent(new Event('input'))
    const items = el.shadowRoot?.querySelectorAll('.panel button[data-v]')
    expect(items?.length).toBe(2)
    expect(el.shadowRoot?.querySelector('.panel mark')?.textContent).toBe('Script')
    el.remove()
  })

  it('commits a pick via arrows and Enter, emitting aurora-change', () => {
    const el = make()
    const input = el.shadowRoot?.querySelector('input')
    if (!input) throw new Error('no input')
    let got: { value: string; custom: boolean } | null = null
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string; custom: boolean }>).detail
    })
    input.value = 'go'
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(got).toEqual({ value: 'Go', custom: false })
    expect(el.value).toBe('Go')
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })

  it('rejects free text without allow-custom and accepts it with', () => {
    const strict = make()
    const si = strict.shadowRoot?.querySelector('input')
    if (si) {
      si.value = 'Zig'
      si.dispatchEvent(new Event('input'))
      si.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }
    expect(strict.hasAttribute('open')).toBe(true)
    strict.remove()
    const loose = make(true)
    let got: { custom: boolean } | null = null
    loose.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ custom: boolean }>).detail
    })
    const li = loose.shadowRoot?.querySelector('input')
    if (li) {
      li.value = 'Zig'
      li.dispatchEvent(new Event('input'))
      li.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }
    expect(got).toEqual(expect.objectContaining({ custom: true }))
    expect(loose.value).toBe('Zig')
    loose.remove()
  })
})
