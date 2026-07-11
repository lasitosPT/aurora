import { describe, expect, it } from 'vitest'
import './rating'
import type { AuroraRating } from './rating'

describe('aurora-rating', () => {
  it('registers, renders max stars and rates by click', () => {
    const el = document.createElement('aurora-rating') as AuroraRating
    el.setAttribute('max', '5')
    el.setAttribute('value', '2')
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('button').length).toBe(5)
    expect(el.shadowRoot?.querySelectorAll('button.on').length).toBe(2)

    let changed = 0
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: number }>).detail.value
    })
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button')[3]?.click()
    expect(changed).toBe(4)
    expect(el.value).toBe(4)
    expect(el.shadowRoot?.querySelectorAll('button.on').length).toBe(4)
    el.remove()
  })
})
