import { describe, expect, it } from 'vitest'
import './buttongroup'
import './splitbutton'
import type { AuroraButtongroup } from './buttongroup'
import type { AuroraSplitbutton } from './splitbutton'

describe('aurora-buttongroup', () => {
  it('registers, selects segments and emits aurora-change', () => {
    const el = document.createElement('aurora-buttongroup') as AuroraButtongroup
    el.innerHTML =
      '<option value="day">Day</option><option value="week">Week</option><option value="month">Month</option>'
    document.body.append(el)
    expect(el.value).toBe('day')
    let changed = ''
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button')[1]?.click()
    expect(changed).toBe('week')
    expect(el.shadowRoot?.querySelector('[data-v="week"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    )
    el.remove()
  })
})

describe('aurora-splitbutton', () => {
  it('registers, fires the main action and selects from the menu', () => {
    const el = document.createElement('aurora-splitbutton') as AuroraSplitbutton
    el.setAttribute('label', 'Deploy')
    el.innerHTML =
      '<option value="staging">Deploy to staging</option><option value="rollback">Rollback</option>'
    document.body.append(el)
    let clicked = ''
    let selected = ''
    el.addEventListener('aurora-click', (e) => {
      clicked = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.addEventListener('aurora-select', (e) => {
      selected = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.main')?.click()
    expect(clicked).toBe('Deploy')
    el.open()
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.panel button')[1]?.click()
    expect(selected).toBe('rollback')
    el.remove()
  })
})
