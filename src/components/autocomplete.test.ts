import { describe, expect, it } from 'vitest'
import './autocomplete'
import type { AuroraAutocomplete } from './autocomplete'

describe('aurora-autocomplete', () => {
  it('registers, filters with highlight and selects via Enter', () => {
    const el = document.createElement('aurora-autocomplete') as AuroraAutocomplete
    document.body.append(el)
    el.options = ['TypeScript', 'JavaScript', 'Go', 'Rust']
    const input = el.shadowRoot?.querySelector('input')
    input!.value = 'script'
    input!.dispatchEvent(new Event('input'))
    const opts = el.shadowRoot?.querySelectorAll('.opt')
    expect(opts?.length).toBe(2)
    expect(opts?.[0]?.querySelector('mark')?.textContent?.toLowerCase()).toBe('script')

    let changed = ''
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value
    })
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(changed).toBe('JavaScript')
    expect(el.value).toBe('JavaScript')
    el.remove()
  })
})
