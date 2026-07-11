import { describe, expect, it } from 'vitest'
import './compare'
import './flip'
import './skeleton'
import './confetti'
import type { AuroraCompare } from './compare'
import type { AuroraFlip } from './flip'
import { AuroraConfetti } from './confetti'

describe('aurora-compare', () => {
  it('registers, renders both slots and reflects value into --pos', () => {
    expect(customElements.get('aurora-compare')).toBeTypeOf('function')
    const el = document.createElement('aurora-compare') as AuroraCompare
    el.setAttribute('value', '30')
    el.innerHTML = '<img slot="before" alt="" /><img slot="after" alt="" />'
    document.body.append(el)
    expect(el.style.getPropertyValue('--pos')).toBe('30%')
    expect(el.shadowRoot?.querySelector('.handle')?.getAttribute('aria-valuenow')).toBe('30')
    el.value = 200
    expect(el.value).toBe(100)
    el.remove()
  })
})

describe('aurora-flip', () => {
  it('registers and toggles via flip()', () => {
    expect(customElements.get('aurora-flip')).toBeTypeOf('function')
    const el = document.createElement('aurora-flip') as AuroraFlip
    el.setAttribute('trigger', 'manual')
    el.innerHTML = '<div slot="front">A</div><div slot="back">B</div>'
    document.body.append(el)
    let flipped = false
    el.addEventListener('aurora-flip', (event) => {
      flipped = (event as CustomEvent<{ flipped: boolean }>).detail.flipped
    })
    el.flip()
    expect(flipped).toBe(true)
    el.flip(false)
    expect(flipped).toBe(false)
    el.remove()
  })
})

describe('aurora-skeleton', () => {
  it('renders a block by default and N lines with lines=', () => {
    expect(customElements.get('aurora-skeleton')).toBeTypeOf('function')
    const block = document.createElement('aurora-skeleton')
    document.body.append(block)
    expect(block.shadowRoot?.querySelectorAll('.bone').length).toBe(1)

    const para = document.createElement('aurora-skeleton')
    para.setAttribute('lines', '3')
    document.body.append(para)
    expect(para.shadowRoot?.querySelectorAll('.bone.line').length).toBe(3)
    block.remove()
    para.remove()
  })
})

describe('aurora-confetti', () => {
  it('registers and burst() degrades gracefully without canvas 2D', () => {
    expect(customElements.get('aurora-confetti')).toBeTypeOf('function')
    expect(() => AuroraConfetti.burst({ count: 5 })).not.toThrow()
    document.querySelector('aurora-confetti')?.remove()
  })
})
