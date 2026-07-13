import { describe, expect, it } from 'vitest'
import './wizard'
import type { AuroraWizard } from './wizard'

function makeWizard(): AuroraWizard {
  const el = document.createElement('aurora-wizard') as AuroraWizard
  el.innerHTML = `
    <aurora-wizard-step label="Account"><input name="email" /></aurora-wizard-step>
    <aurora-wizard-step label="Profile"><input name="handle" /></aurora-wizard-step>
    <aurora-wizard-step label="Review">Looks good.</aurora-wizard-step>
  `
  document.body.append(el)
  return el
}

describe('aurora-wizard', () => {
  it('shows only the active step and feeds the stepper labels', () => {
    const el = makeWizard()
    const steps = el.querySelectorAll('aurora-wizard-step')
    expect(steps[0]?.hasAttribute('active')).toBe(true)
    expect(steps[1]?.hasAttribute('active')).toBe(false)
    const stepper = el.shadowRoot?.querySelector('aurora-stepper') as
      (HTMLElement & { steps: string[] }) | null
    expect(stepper?.steps).toEqual(['Account', 'Profile', 'Review'])
    expect(el.shadowRoot?.querySelector<HTMLElement>('.back')?.style.visibility).toBe('hidden')
    el.remove()
  })

  it('advances with next(), emits aurora-change, and honors a cancelable gate', () => {
    const el = makeWizard()
    let changed = -1
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ index: number }>).detail.index
    })
    el.next()
    expect(el.index).toBe(1)
    expect(changed).toBe(1)
    el.addEventListener('aurora-next', (e) => e.preventDefault(), { once: true })
    el.next()
    expect(el.index).toBe(1)
    el.next()
    expect(el.index).toBe(2)
    el.remove()
  })

  it('shows Finish on the last step and emits aurora-finish', () => {
    const el = makeWizard()
    el.goTo(2)
    expect(el.shadowRoot?.querySelector('.next')?.textContent).toBe('Finish')
    let finished = false
    el.addEventListener('aurora-finish', () => {
      finished = true
    })
    el.next()
    expect(finished).toBe(true)
    expect(el.hasAttribute('done')).toBe(true)
    el.remove()
  })

  it('goes back and syncs the stepper', () => {
    const el = makeWizard()
    el.goTo(2)
    el.prev()
    expect(el.index).toBe(1)
    const stepper = el.shadowRoot?.querySelector('aurora-stepper') as
      (HTMLElement & { value: number }) | null
    expect(stepper?.value).toBe(1)
    el.remove()
  })
})
