import { describe, expect, it } from 'vitest'
import './spotlight'

describe('aurora-spotlight', () => {
  it('is registered and renders its layers around a slot', () => {
    expect(customElements.get('aurora-spotlight')).toBeTypeOf('function')
    const el = document.createElement('aurora-spotlight')
    el.innerHTML = '<p>Content</p>'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.glow')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('.beam')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    el.remove()
  })

  it('tracks the pointer into CSS variables', () => {
    const el = document.createElement('aurora-spotlight')
    document.body.append(el)
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 24 }))
    expect(el.style.getPropertyValue('--mx')).toContain('px')
    expect(el.style.getPropertyValue('--my')).toContain('px')
    el.remove()
  })
})

describe('aurora-dock and aurora-ripple', () => {
  it('are registered', async () => {
    await import('./dock')
    await import('./ripple')
    expect(customElements.get('aurora-dock')).toBeTypeOf('function')
    expect(customElements.get('aurora-ripple')).toBeTypeOf('function')
  })

  it('ripple renders an overlay and spawns a dot on pointerdown', async () => {
    await import('./ripple')
    const el = document.createElement('aurora-ripple')
    el.innerHTML = '<button>Press</button>'
    document.body.append(el)
    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10, clientY: 10 }))
    expect(el.shadowRoot?.querySelectorAll('.dot').length).toBe(1)
    el.remove()
  })
})
