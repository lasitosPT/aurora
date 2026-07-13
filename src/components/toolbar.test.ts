import { describe, expect, it } from 'vitest'
import './toolbar'
import type { AuroraToolbar } from './toolbar'

describe('aurora-toolbar', () => {
  it('renders with toolbar semantics, separators, and an overflow slot', () => {
    const el = document.createElement('aurora-toolbar') as AuroraToolbar
    el.innerHTML = '<button>Bold</button><button>Italic</button><hr /><button>Link</button>'
    document.body.append(el)
    expect(el.getAttribute('role')).toBe('toolbar')
    expect(el.querySelectorAll('hr').length).toBe(1)
    expect(el.shadowRoot?.querySelector('slot[name="overflow"]')).not.toBeNull()
    expect(el.hasAttribute('overflowing')).toBe(false)
    el.remove()
  })

  it('roves focus with arrow keys across items', () => {
    const el = document.createElement('aurora-toolbar') as AuroraToolbar
    el.innerHTML = '<button id="b1">One</button><hr /><button id="b2">Two</button>'
    document.body.append(el)
    const b1 = el.querySelector<HTMLButtonElement>('#b1')
    b1?.focus()
    b1?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement?.id).toBe('b2')
    el.remove()
  })

  it('opens the overflow panel for slot-assigned items', () => {
    const el = document.createElement('aurora-toolbar') as AuroraToolbar
    el.innerHTML = '<button>Fits</button><button slot="overflow">Hidden</button>'
    el.setAttribute('overflowing', '')
    document.body.append(el)
    const more = el.shadowRoot?.querySelector<HTMLButtonElement>('.more')
    more?.click()
    expect(el.shadowRoot?.querySelector('.panel')?.classList.contains('open')).toBe(true)
    expect(more?.getAttribute('aria-expanded')).toBe('true')
    el.remove()
  })
})
