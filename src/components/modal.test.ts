import { describe, expect, it } from 'vitest'
import './modal'
import type { AuroraModal } from './modal'

describe('aurora-modal', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-modal')).toBeTypeOf('function')
  })

  it('renders a dialog and toggles open state via show/hide', () => {
    const el = document.createElement('aurora-modal') as AuroraModal
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('[role="dialog"]')).not.toBeNull()

    el.show()
    expect(el.hasAttribute('open')).toBe(true)

    el.hide()
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})
