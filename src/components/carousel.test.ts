import { describe, expect, it } from 'vitest'
import './carousel'
import type { AuroraCarousel } from './carousel'

describe('aurora-carousel', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-carousel')).toBeTypeOf('function')
  })

  it('renders a track, is focusable and emits on goTo', () => {
    const el = document.createElement('aurora-carousel') as AuroraCarousel
    for (let i = 0; i < 3; i++) {
      const slide = document.createElement('div')
      slide.textContent = `Slide ${i}`
      el.append(slide)
    }
    document.body.append(el)

    expect(el.shadowRoot?.querySelector('.track')).not.toBeNull()
    expect(el.getAttribute('role')).toBe('region')
    expect(el.tabIndex).toBe(0)

    let changed = -1
    el.addEventListener('aurora-slide-change', (event) => {
      changed = (event as CustomEvent<{ index: number }>).detail.index
    })
    el.goTo(2, false)
    expect(changed).toBe(2)
    el.remove()
  })
})
