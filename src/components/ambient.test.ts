import { describe, expect, it } from 'vitest'
import './drawer'
import './beam'
import './parallax'
import './shine'
import type { AuroraDrawer } from './drawer'

describe('aurora-drawer', () => {
  it('registers, opens/closes and restores focus to the opener', () => {
    expect(customElements.get('aurora-drawer')).toBeTypeOf('function')
    const opener = document.createElement('button')
    document.body.append(opener)
    const el = document.createElement('aurora-drawer') as AuroraDrawer
    el.innerHTML = '<button>Inside</button>'
    document.body.append(el)

    opener.focus()
    el.show()
    expect(el.hasAttribute('open')).toBe(true)
    expect(document.activeElement).not.toBe(opener)

    el.hide()
    expect(el.hasAttribute('open')).toBe(false)
    expect(document.activeElement).toBe(opener)
    el.remove()
    opener.remove()
  })
})

describe('aurora-beam', () => {
  it('registers and renders the travelling ring', () => {
    expect(customElements.get('aurora-beam')).toBeTypeOf('function')
    const el = document.createElement('aurora-beam')
    el.innerHTML = '<div>Card</div>'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.ring')).not.toBeNull()
    el.remove()
  })
})

describe('aurora-parallax', () => {
  it('registers and slots content', () => {
    expect(customElements.get('aurora-parallax')).toBeTypeOf('function')
    const el = document.createElement('aurora-parallax')
    el.innerHTML = '<div data-depth="0.6">Layer</div>'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    el.remove()
  })
})

describe('aurora-shine', () => {
  it('registers and renders its text in the shine span', () => {
    expect(customElements.get('aurora-shine')).toBeTypeOf('function')
    const el = document.createElement('aurora-shine')
    el.textContent = 'Shimmer'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.shine')?.textContent).toBe('Shimmer')
    el.remove()
  })
})
