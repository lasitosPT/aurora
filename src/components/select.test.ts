import { describe, expect, it } from 'vitest'
import './select'
import type { AuroraSelect } from './select'

function build(): AuroraSelect {
  const el = document.createElement('aurora-select') as AuroraSelect
  el.setAttribute('placeholder', 'Pick a language')
  el.innerHTML =
    '<option value="ts">TypeScript</option><option value="go">Go</option><option value="rs">Rust</option>'
  document.body.append(el)
  return el
}

describe('aurora-select', () => {
  it('registers, reads child options and shows the placeholder', () => {
    expect(customElements.get('aurora-select')).toBeTypeOf('function')
    const el = build()
    expect(el.options.length).toBe(3)
    expect(el.shadowRoot?.querySelector('.label')?.textContent).toBe('Pick a language')
    el.remove()
  })

  it('opens, selects by click, reflects value and emits aurora-change', () => {
    const el = build()
    let changed = ''
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value
    })
    el.open()
    expect(el.hasAttribute('open')).toBe(true)
    el.shadowRoot?.querySelectorAll<HTMLElement>('.opt')[1]?.click()
    expect(changed).toBe('go')
    expect(el.value).toBe('go')
    expect(el.shadowRoot?.querySelector('.label')?.textContent).toBe('Go')
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })

  it('navigates with keyboard: open, arrows, type-ahead, Enter', () => {
    const el = build()
    const trigger = el.shadowRoot?.querySelector('.trigger')
    const key = (k: string) => trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: k }))
    key('ArrowDown') // opens
    key('ArrowDown') // active -> go (from ts)
    key('r') // type-ahead -> Rust
    key('Enter')
    expect(el.value).toBe('rs')
    el.remove()
  })
})
