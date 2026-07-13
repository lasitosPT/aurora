import { describe, expect, it } from 'vitest'
import './fab'
import './actionsheet'
import type { AuroraActionsheet } from './actionsheet'
import type { AuroraFab } from './fab'

describe('aurora-fab', () => {
  it('acts as a plain button without options', () => {
    const el = document.createElement('aurora-fab') as AuroraFab
    document.body.append(el)
    let clicked = false
    el.addEventListener('aurora-click', () => {
      clicked = true
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.main')?.click()
    expect(clicked).toBe(true)
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })

  it('speed-dials with options and emits the chosen action', () => {
    const el = document.createElement('aurora-fab') as AuroraFab
    el.innerHTML =
      '<option value="new" icon="✎">New note</option><option value="upload" icon="⇪">Upload</option>'
    document.body.append(el)
    el.shadowRoot?.querySelector<HTMLButtonElement>('.main')?.click()
    expect(el.hasAttribute('open')).toBe(true)
    expect(el.shadowRoot?.querySelectorAll('.act').length).toBe(2)
    let got = ''
    el.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.act[data-v="upload"]')?.click()
    expect(got).toBe('upload')
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})

describe('aurora-actionsheet', () => {
  it('shows, selects, and hides with events', () => {
    const el = document.createElement('aurora-actionsheet') as AuroraActionsheet
    el.setAttribute('label', 'Share')
    el.innerHTML =
      '<option value="copy" icon="⧉">Copy link</option><option value="delete" danger>Delete</option>'
    document.body.append(el)
    let selected = ''
    let closed = false
    el.addEventListener('aurora-select', (e) => {
      selected = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.addEventListener('aurora-close', () => {
      closed = true
    })
    el.show()
    expect(el.hasAttribute('open')).toBe(true)
    expect(el.shadowRoot?.querySelector('button.danger')?.textContent).toContain('Delete')
    el.shadowRoot?.querySelector<HTMLButtonElement>('button[data-v="copy"]')?.click()
    expect(selected).toBe('copy')
    expect(closed).toBe(true)
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })

  it('closes from the cancel button and Escape', () => {
    const el = document.createElement('aurora-actionsheet') as AuroraActionsheet
    el.innerHTML = '<option value="a">A</option>'
    document.body.append(el)
    el.show()
    el.shadowRoot?.querySelector<HTMLButtonElement>('.cancel')?.click()
    expect(el.hasAttribute('open')).toBe(false)
    el.show()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})
