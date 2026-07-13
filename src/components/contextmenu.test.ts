import { describe, expect, it } from 'vitest'
import './contextmenu'
import type { AuroraContextmenu } from './contextmenu'

function makeMenu(): { zone: HTMLElement; menu: AuroraContextmenu } {
  const zone = document.createElement('div')
  zone.id = 'zone'
  document.body.append(zone)
  const menu = document.createElement('aurora-contextmenu') as AuroraContextmenu
  menu.setAttribute('for', 'zone')
  menu.innerHTML =
    '<option value="copy" icon="⧉">Copy</option><option value="rename">Rename</option><hr /><option value="delete" disabled>Delete</option>'
  document.body.append(menu)
  return { zone, menu }
}

describe('aurora-contextmenu', () => {
  it('opens at the right-click point and renders items with separators', () => {
    const { zone, menu } = makeMenu()
    zone.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 40, clientY: 60 }))
    const panel = menu.shadowRoot?.querySelector<HTMLElement>('.panel')
    expect(panel?.style.display).toBe('flex')
    expect(menu.shadowRoot?.querySelectorAll('button').length).toBe(3)
    expect(menu.shadowRoot?.querySelector('.sep')).not.toBeNull()
    expect(menu.shadowRoot?.querySelector('button[disabled]')?.textContent).toContain('Delete')
    zone.remove()
    menu.remove()
  })

  it('emits aurora-select with the value and context, then closes', () => {
    const { zone, menu } = makeMenu()
    let got: { value: string } | null = null
    menu.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail
    })
    zone.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }))
    menu.shadowRoot?.querySelector<HTMLButtonElement>('button[data-v="copy"]')?.click()
    expect(got).toEqual(expect.objectContaining({ value: 'copy' }))
    expect(menu.shadowRoot?.querySelector<HTMLElement>('.panel')?.style.display).toBe('none')
    zone.remove()
    menu.remove()
  })

  it('closes on Escape and outside pointerdown', () => {
    const { zone, menu } = makeMenu()
    menu.openAt(20, 20)
    menu.shadowRoot
      ?.querySelector('.panel')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(menu.shadowRoot?.querySelector<HTMLElement>('.panel')?.style.display).toBe('none')
    menu.openAt(20, 20)
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(menu.shadowRoot?.querySelector<HTMLElement>('.panel')?.style.display).toBe('none')
    zone.remove()
    menu.remove()
  })
})
