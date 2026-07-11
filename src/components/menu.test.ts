import { describe, expect, it } from 'vitest'
import './menu'
import type { AuroraMenu } from './menu'

function buildMenu(): AuroraMenu {
  const menu = document.createElement('aurora-menu') as AuroraMenu
  menu.setAttribute('label', 'Options')
  menu.innerHTML =
    '<button data-value="edit">Edit</button><button data-value="delete">Delete</button>'
  document.body.append(menu)
  return menu
}

describe('aurora-menu', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-menu')).toBeTypeOf('function')
  })

  it('opens and closes from the trigger with aria state', () => {
    const menu = buildMenu()
    const trigger = menu.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')

    trigger?.click()
    expect(menu.hasAttribute('open')).toBe(true)
    expect(trigger?.getAttribute('aria-expanded')).toBe('true')
    expect(menu.querySelector('button')?.getAttribute('role')).toBe('menuitem')

    trigger?.click()
    expect(menu.hasAttribute('open')).toBe(false)
    menu.remove()
  })

  it('emits aurora-select with the item value and closes', () => {
    const menu = buildMenu()
    menu.open()
    let selected = ''
    menu.addEventListener('aurora-select', (event) => {
      selected = (event as CustomEvent<{ value: string }>).detail.value
    })
    menu.querySelectorAll('button')[1]?.click()
    expect(selected).toBe('delete')
    expect(menu.hasAttribute('open')).toBe(false)
    menu.remove()
  })
})
