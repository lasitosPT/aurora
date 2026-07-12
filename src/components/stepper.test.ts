import { describe, expect, it } from 'vitest'
import './stepper'
import type { AuroraStepper } from './stepper'

describe('aurora-stepper', () => {
  it('registers, advances and marks done steps', () => {
    const el = document.createElement('aurora-stepper') as AuroraStepper
    document.body.append(el)
    el.steps = ['Account', 'Billing', 'Review']
    let changed = -1
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: number }>).detail.value
    })
    el.next()
    expect(el.value).toBe(1)
    expect(changed).toBe(1)
    expect(el.shadowRoot?.querySelectorAll('.step.done').length).toBe(1)
    expect(el.shadowRoot?.querySelector('.step.done .dot')?.textContent).toBe('✓')
    el.next()
    el.next() // clamped
    expect(el.value).toBe(2)
    el.remove()
  })

  it('lets completed dots jump back', () => {
    const el = document.createElement('aurora-stepper') as AuroraStepper
    document.body.append(el)
    el.steps = ['A', 'B', 'C']
    el.value = 2
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.dot')[0]?.click()
    expect(el.value).toBe(0)
    el.remove()
  })
})
