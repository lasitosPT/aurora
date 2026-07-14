import { describe, expect, it } from 'vitest'
import './window'
import type { AuroraWindow } from './window'

describe('aurora-window', () => {
  it('registers, opens/closes and restores focus', () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    const el = document.createElement('aurora-window') as AuroraWindow
    el.setAttribute('title', 'Inspector')
    el.innerHTML = '<button>Inside</button>'
    document.body.append(el)

    expect(el.shadowRoot?.querySelector('.bar')?.textContent).toContain('Inspector')
    opener.focus()
    el.show()
    expect(el.hasAttribute('open')).toBe(true)
    expect(el.shadowRoot?.querySelector<HTMLElement>('.win')?.style.display).toBe('flex')

    el.hide()
    expect(el.hasAttribute('open')).toBe(false)
    expect(document.activeElement).toBe(opener)
    el.remove()
    opener.remove()
  })

  it('closes from the ✕ button', () => {
    const el = document.createElement('aurora-window') as AuroraWindow
    document.body.append(el)
    el.show()
    el.shadowRoot?.querySelector<HTMLButtonElement>('.x')?.click()
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})

describe('window depth (v1.2)', () => {
  it('maximizes, restores, and minimizes from the title bar buttons', () => {
    const el = document.createElement('aurora-window') as AuroraWindow
    el.setAttribute('title', 'Depth')
    el.innerHTML = '<p>body</p>'
    document.body.append(el)
    el.show()
    const win = el.shadowRoot?.querySelector('.win')
    const events: string[] = []
    for (const type of ['aurora-maximize', 'aurora-minimize', 'aurora-restore'])
      el.addEventListener(type, () => events.push(type))
    el.shadowRoot?.querySelector<HTMLButtonElement>('.maxi')?.click()
    expect(win?.classList.contains('maxed')).toBe(true)
    el.shadowRoot?.querySelector<HTMLButtonElement>('.maxi')?.click()
    expect(win?.classList.contains('maxed')).toBe(false)
    el.shadowRoot?.querySelector<HTMLButtonElement>('.mini')?.click()
    expect(win?.classList.contains('minned')).toBe(true)
    expect(events).toEqual(['aurora-maximize', 'aurora-restore', 'aurora-minimize'])
    el.hide()
    el.remove()
  })

  it('renders a modal backdrop that closes on click', () => {
    const el = document.createElement('aurora-window') as AuroraWindow
    el.setAttribute('modal', '')
    document.body.append(el)
    el.show()
    expect(el.shadowRoot?.querySelector('.backdrop')).not.toBeNull()
    el.shadowRoot?.querySelector<HTMLElement>('.backdrop')?.click()
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })

  it('exposes an actions slot and a resize grip', () => {
    const el = document.createElement('aurora-window') as AuroraWindow
    el.innerHTML = '<button slot="actions" id="pin">📌</button><p>content</p>'
    document.body.append(el)
    el.show()
    expect(el.shadowRoot?.querySelector('slot[name="actions"]')).not.toBeNull()
    expect(el.querySelector('#pin')?.getAttribute('slot')).toBe('actions')
    expect(el.shadowRoot?.querySelector('.grip')).not.toBeNull()
    el.hide()
    el.remove()
  })
})
