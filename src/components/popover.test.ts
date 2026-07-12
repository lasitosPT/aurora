import { describe, expect, it } from 'vitest'
import './popover'
import type { AuroraPopover } from './popover'

describe('aurora-popover', () => {
  it('registers, toggles from the trigger and closes on Escape', () => {
    const el = document.createElement('aurora-popover') as AuroraPopover
    el.innerHTML = '<button slot="trigger">Info</button><p>Details here.</p>'
    document.body.append(el)
    const trigger = el.querySelector('button')
    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog')

    trigger?.click()
    expect(el.hasAttribute('open')).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})
