import { describe, expect, it } from 'vitest'
import './splitter'
import type { AuroraSplitter } from './splitter'

describe('aurora-splitter', () => {
  it('registers, applies position and clamps to min', () => {
    const el = document.createElement('aurora-splitter') as AuroraSplitter
    el.setAttribute('position', '30')
    el.setAttribute('min', '20')
    el.innerHTML = '<div slot="a">Left</div><div slot="b">Right</div>'
    document.body.append(el)
    expect(el.position).toBe(30)
    expect(el.style.getPropertyValue('--pos')).toBe('30%')
    el.position = 5
    expect(el.position).toBe(20)
    el.position = 99
    expect(el.position).toBe(80)
    el.remove()
  })

  it('nudges with arrow keys and emits aurora-resize', () => {
    const el = document.createElement('aurora-splitter') as AuroraSplitter
    document.body.append(el)
    let pos = -1
    el.addEventListener('aurora-resize', (e) => {
      pos = (e as CustomEvent<{ position: number }>).detail.position
    })
    const divider = el.shadowRoot?.querySelector('.divider')
    divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(pos).toBe(52)
    el.remove()
  })
})
