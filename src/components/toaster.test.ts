import { describe, expect, it } from 'vitest'
import './toaster'
import { AuroraToaster } from './toaster'

describe('aurora-toaster', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-toaster')).toBeTypeOf('function')
  })

  it('shows and dismisses toasts', async () => {
    const el = document.createElement('aurora-toaster') as AuroraToaster
    document.body.append(el)

    const toast = el.show('Saved!', { variant: 'success', duration: 0, title: 'Done' })
    expect(el.shadowRoot?.querySelectorAll('.toast').length).toBe(1)
    expect(toast.classList.contains('success')).toBe(true)
    expect(toast.textContent).toContain('Saved!')
    expect(toast.querySelector('.title')?.textContent).toBe('Done')
    expect(toast.querySelector('.badge svg')).not.toBeNull()

    el.dismiss(toast)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(el.shadowRoot?.querySelectorAll('.toast').length).toBe(0)
    el.remove()
  })

  it('creates a shared toaster via the static helper', () => {
    const toast = AuroraToaster.show('Hello', { duration: 0 })
    expect(toast.isConnected).toBe(true)
    expect(document.querySelector('aurora-toaster')).not.toBeNull()
    document.querySelector('aurora-toaster')?.remove()
  })
})
