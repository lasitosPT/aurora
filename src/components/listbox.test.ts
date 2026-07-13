import { describe, expect, it } from 'vitest'
import './listbox'
import type { AuroraListbox } from './listbox'

describe('aurora-listbox', () => {
  it('renders options, selects, and reorders with the toolbar', () => {
    const el = document.createElement('aurora-listbox') as AuroraListbox
    el.innerHTML = '<option>Alpha</option><option>Beta</option><option>Gamma</option>'
    document.body.append(el)
    expect(el.items).toEqual(['Alpha', 'Beta', 'Gamma'])
    let changed: string[] = []
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ items: string[] }>).detail.items
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.item[data-v="Beta"]')?.click()
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-act="up"]')?.click()
    expect(changed).toEqual(['Beta', 'Alpha', 'Gamma'])
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-act="remove"]')?.click()
    expect(el.items).toEqual(['Alpha', 'Gamma'])
    el.remove()
  })

  it('transfers items to a connected listbox', () => {
    const a = document.createElement('aurora-listbox') as AuroraListbox
    a.id = 'boxA'
    a.setAttribute('connect', 'boxB')
    a.innerHTML = '<option>One</option><option>Two</option>'
    const b = document.createElement('aurora-listbox') as AuroraListbox
    b.id = 'boxB'
    document.body.append(a, b)
    let transferred: { item: string } | null = null
    a.addEventListener('aurora-transfer', (e) => {
      transferred = (e as CustomEvent<{ item: string }>).detail
    })
    a.shadowRoot?.querySelector<HTMLButtonElement>('.item[data-v="Two"]')?.click()
    a.shadowRoot?.querySelector<HTMLButtonElement>('[data-act="send"]')?.click()
    expect(a.items).toEqual(['One'])
    expect(b.items).toEqual(['Two'])
    expect(transferred).toEqual(expect.objectContaining({ item: 'Two' }))
    a.remove()
    b.remove()
  })

  it('disables the toolbar without a selection', () => {
    const el = document.createElement('aurora-listbox') as AuroraListbox
    el.innerHTML = '<option>Solo</option>'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector<HTMLButtonElement>('[data-act="up"]')?.disabled).toBe(true)
    el.shadowRoot?.querySelector<HTMLButtonElement>('.item')?.click()
    expect(el.shadowRoot?.querySelector<HTMLButtonElement>('[data-act="up"]')?.disabled).toBe(false)
    el.remove()
  })
})
