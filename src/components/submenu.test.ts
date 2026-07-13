import { describe, expect, it } from 'vitest'
import './menu'
import type { AuroraMenu } from './menu'
import type { AuroraSubmenu } from './submenu'

function make(): AuroraMenu {
  const el = document.createElement('aurora-menu') as AuroraMenu
  el.setAttribute('label', 'File')
  el.innerHTML = `
    <button data-value="new">New</button>
    <aurora-submenu label="Export">
      <button data-value="pdf">As PDF</button>
      <button data-value="csv">As CSV</button>
    </aurora-submenu>
    <button data-value="quit">Quit</button>
  `
  document.body.append(el)
  return el
}

describe('aurora-submenu', () => {
  it('opens a flyout and bubbles selections to the parent menu', () => {
    const menu = make()
    menu.open()
    const sub = menu.querySelector('aurora-submenu') as AuroraSubmenu
    sub.open()
    expect(sub.hasAttribute('open')).toBe(true)
    let got = ''
    menu.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    sub.querySelector<HTMLButtonElement>('button[data-value="csv"]')?.click()
    expect(got).toBe('csv')
    expect(sub.hasAttribute('open')).toBe(false)
    menu.remove()
  })

  it('closes back with ArrowLeft keeping the parent menu open', () => {
    const menu = make()
    menu.open()
    const sub = menu.querySelector('aurora-submenu') as AuroraSubmenu
    sub.open()
    sub.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(sub.hasAttribute('open')).toBe(false)
    expect(menu.hasAttribute('open')).toBe(true)
    menu.remove()
  })

  it('top-level roving includes the submenu trigger', () => {
    const menu = make()
    menu.open()
    const items = menu.querySelectorAll(':scope > button, :scope > aurora-submenu')
    expect(items.length).toBe(3)
    expect(items[1]?.tagName.toLowerCase()).toBe('aurora-submenu')
    menu.remove()
  })
})
