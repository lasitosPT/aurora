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
