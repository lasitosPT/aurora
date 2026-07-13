import { describe, expect, it } from 'vitest'
import './bottomnav'
import type { AuroraBottomnav } from './bottomnav'

describe('aurora-bottomnav', () => {
  function make(): AuroraBottomnav {
    const el = document.createElement('aurora-bottomnav') as AuroraBottomnav
    el.innerHTML =
      '<option value="home" icon="⌂">Home</option><option value="search" icon="⌕">Search</option><option value="me" icon="☺">Profile</option>'
    document.body.append(el)
    return el
  }

  it('selects the first item by default with tablist semantics', () => {
    const el = make()
    expect(el.getAttribute('role')).toBe('tablist')
    expect(el.value).toBe('home')
    expect(el.shadowRoot?.querySelector('[data-v="home"]')?.getAttribute('aria-selected')).toBe(
      'true',
    )
    el.remove()
  })

  it('switches on click and arrows, emitting aurora-change', () => {
    const el = make()
    let got = ''
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-v="search"]')?.click()
    expect(got).toBe('search')
    el.shadowRoot
      ?.querySelector<HTMLButtonElement>('[data-v="search"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(el.value).toBe('me')
    el.remove()
  })
})
