import { describe, expect, it } from 'vitest'
import './multiselect'
import type { AuroraMultiselect } from './multiselect'

describe('aurora-multiselect', () => {
  it('registers, toggles values into chips and emits aurora-change', () => {
    const el = document.createElement('aurora-multiselect') as AuroraMultiselect
    el.innerHTML = '<option value="ts">TypeScript</option><option value="go">Go</option>'
    document.body.append(el)
    let values: string[] = []
    el.addEventListener('aurora-change', (e) => {
      values = (e as CustomEvent<{ values: string[] }>).detail.values
    })
    el.open()
    el.shadowRoot?.querySelectorAll<HTMLElement>('.opt')[1]?.click()
    expect(values).toEqual(['go'])
    expect(el.shadowRoot?.querySelectorAll('.chip').length).toBe(1)
    // remove via chip ✕
    el.shadowRoot?.querySelector<HTMLElement>('[data-x="go"]')?.click()
    expect(el.values).toEqual([])
    el.remove()
  })
})
