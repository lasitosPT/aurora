import { describe, expect, it } from 'vitest'
import './signature'
import type { AuroraSignature } from './signature'

describe('aurora-signature', () => {
  it('renders the pad with hint and stays empty-valued until inked', () => {
    const el = document.createElement('aurora-signature') as AuroraSignature
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.hint')?.textContent).toBe('Sign here')
    expect(el.value).toBe('')
    expect(el.hasAttribute('signed')).toBe(false)
    el.remove()
  })

  it('accepts programmatic strokes, reflects signed, and serializes SVG', () => {
    const el = document.createElement('aurora-signature') as AuroraSignature
    document.body.append(el)
    let changes = 0
    el.addEventListener('aurora-change', () => {
      changes++
    })
    el.addStroke([
      [40, 90],
      [80, 60],
      [120, 100],
      [180, 70],
    ])
    expect(el.hasAttribute('signed')).toBe(true)
    expect(el.shadowRoot?.querySelectorAll('path').length).toBe(1)
    expect(el.value.startsWith('data:image/svg+xml;utf8,')).toBe(true)
    expect(el.toSvg()).toContain('Q80 60')
    expect(changes).toBe(1)
    el.remove()
  })

  it('undoes the last stroke and clears everything', () => {
    const el = document.createElement('aurora-signature') as AuroraSignature
    document.body.append(el)
    el.addStroke([
      [10, 10],
      [30, 30],
    ])
    el.addStroke([
      [50, 50],
      [70, 70],
    ])
    expect(el.strokes.length).toBe(2)
    el.undo()
    expect(el.strokes.length).toBe(1)
    el.clear()
    expect(el.strokes.length).toBe(0)
    expect(el.hasAttribute('signed')).toBe(false)
    expect(el.value).toBe('')
    el.remove()
  })
})
