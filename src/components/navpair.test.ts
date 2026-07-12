import { describe, expect, it } from 'vitest'
import './breadcrumb'
import './chips'
import type { AuroraBreadcrumb } from './breadcrumb'
import type { AuroraChips } from './chips'

describe('aurora-breadcrumb', () => {
  it('registers, renders the trail with the last as current', () => {
    const el = document.createElement('aurora-breadcrumb') as AuroraBreadcrumb
    document.body.append(el)
    el.items = [{ label: 'Home', href: '/' }, { label: 'Library', href: '/lib' }, { label: 'Grid' }]
    expect(el.shadowRoot?.querySelectorAll('a').length).toBe(2)
    expect(el.shadowRoot?.querySelector('.current')?.textContent).toBe('Grid')
    expect(el.shadowRoot?.querySelector('.current')?.getAttribute('aria-current')).toBe('page')
    el.remove()
  })
})

describe('aurora-chips', () => {
  it('registers, selects multiple and removes', () => {
    const el = document.createElement('aurora-chips') as AuroraChips
    el.setAttribute('selectable', 'multiple')
    el.setAttribute('removable', '')
    el.innerHTML = '<option value="ts">TypeScript</option><option value="go">Go</option>'
    document.body.append(el)
    let values: string[] = []
    el.addEventListener('aurora-change', (e) => {
      values = (e as CustomEvent<{ values: string[] }>).detail.values
    })
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.chip')[1]?.click()
    expect(values).toEqual(['go'])
    expect(el.values).toEqual(['go'])

    let removed = ''
    el.addEventListener('aurora-remove', (e) => {
      removed = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelector<HTMLElement>('[data-v="ts"] [data-x]')?.click()
    expect(removed).toBe('ts')
    expect(el.shadowRoot?.querySelectorAll('.chip').length).toBe(1)
    el.remove()
  })
})
