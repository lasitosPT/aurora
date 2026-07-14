import { describe, expect, it } from 'vitest'
import './filterbuilder'
import type { AuroraFilterbuilder } from './filterbuilder'

const FIELDS = [
  { field: 'name', label: 'Name' },
  { field: 'stars', label: 'Stars', type: 'number' as const },
]
const ROWS = [
  { name: 'pulse', stars: 412 },
  { name: 'aurora', stars: 951 },
  { name: 'volley', stars: 187 },
]

describe('aurora-filterbuilder', () => {
  it('builds rules and evaluates AND logic', () => {
    const el = document.createElement('aurora-filterbuilder') as AuroraFilterbuilder
    document.body.append(el)
    el.fields = FIELDS
    el.expression = {
      logic: 'and',
      rules: [
        { field: 'name', op: 'contains', value: 'a' },
        { field: 'stars', op: 'gt', value: '400' },
      ],
    }
    expect(el.apply(ROWS).map((r) => r.name)).toEqual(['aurora'])
    el.expression = { logic: 'or', rules: el.expression.rules }
    expect(el.apply(ROWS).map((r) => r.name)).toEqual(['pulse', 'aurora'])
    el.remove()
  })

  it('adds, edits, and removes rules through the UI, emitting expressions', () => {
    const el = document.createElement('aurora-filterbuilder') as AuroraFilterbuilder
    document.body.append(el)
    el.fields = FIELDS
    let expr = el.expression
    el.addEventListener('aurora-change', (e) => {
      expr = (e as CustomEvent<{ expression: typeof expr }>).detail.expression
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.add')?.click()
    expect(expr.rules.length).toBe(2)
    const input = el.shadowRoot?.querySelector<HTMLInputElement>('.rule[data-i="0"] input')
    if (input) {
      input.value = 'aur'
      input.dispatchEvent(new Event('input'))
    }
    expect(expr.rules[0]?.value).toBe('aur')
    el.shadowRoot?.querySelector<HTMLButtonElement>('.rule[data-i="1"] .remove')?.click()
    expect(expr.rules.length).toBe(1)
    el.remove()
  })

  it('swaps operator sets when the field type changes', () => {
    const el = document.createElement('aurora-filterbuilder') as AuroraFilterbuilder
    document.body.append(el)
    el.fields = FIELDS
    const fieldSel = el.shadowRoot?.querySelector<HTMLSelectElement>('.rule select[data-r="field"]')
    if (fieldSel) {
      fieldSel.value = 'stars'
      fieldSel.dispatchEvent(new Event('change'))
    }
    const opSel = el.shadowRoot?.querySelector<HTMLSelectElement>('.rule select[data-r="op"]')
    expect(opSel?.querySelectorAll('option').length).toBe(6)
    expect(el.expression.rules[0]?.op).toBe('eq')
    el.remove()
  })
})
