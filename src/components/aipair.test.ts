import { describe, expect, it } from 'vitest'
import './promptbox'
import './smartpaste'
import './input'
import type { AuroraPromptbox } from './promptbox'
import type { AuroraSmartpaste } from './smartpaste'

describe('aurora-promptbox', () => {
  it('sends the prompt, shows busy shimmer, then reveals output', () => {
    const el = document.createElement('aurora-promptbox') as AuroraPromptbox
    el.innerHTML = '<option>Summarize this page</option>'
    document.body.append(el)
    let got = ''
    el.addEventListener('aurora-send', (e) => {
      got = (e as CustomEvent<{ prompt: string }>).detail.prompt
    })
    const area = el.shadowRoot?.querySelector('textarea')
    if (area) {
      area.value = 'Write a haiku'
      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }
    expect(got).toBe('Write a haiku')
    el.setAttribute('busy', '')
    expect(el.hasAttribute('has-output')).toBe(false)
    el.output = 'Components bloom bright'
    expect(el.hasAttribute('busy')).toBe(false)
    expect(el.hasAttribute('has-output')).toBe(true)
    expect(el.output).toBe('Components bloom bright')
    el.remove()
  })

  it('fills the composer from a suggestion chip and retries the last prompt', () => {
    const el = document.createElement('aurora-promptbox') as AuroraPromptbox
    el.innerHTML = '<option>Draft an email</option>'
    document.body.append(el)
    el.shadowRoot?.querySelector<HTMLButtonElement>('.chips button')?.click()
    expect(el.shadowRoot?.querySelector('textarea')?.value).toBe('Draft an email')
    const sends: boolean[] = []
    el.addEventListener('aurora-send', (e) => {
      sends.push(Boolean((e as CustomEvent<{ retry?: boolean }>).detail.retry))
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.send')?.click()
    el.output = 'Done'
    el.shadowRoot?.querySelector<HTMLButtonElement>('.retry-btn')?.click()
    expect(sends).toEqual([false, true])
    el.remove()
  })
})

describe('aurora-smartpaste', () => {
  it('distributes clipboard text into named fields by heuristics', () => {
    const wrap = document.createElement('div')
    wrap.id = 'target'
    wrap.innerHTML = `
      <aurora-input name="fullname" label="Name"></aurora-input>
      <aurora-input name="email" label="Email"></aurora-input>
      <aurora-input name="phone" label="Phone"></aurora-input>
    `
    document.body.append(wrap)
    const el = document.createElement('aurora-smartpaste') as AuroraSmartpaste
    el.setAttribute('for', 'target')
    document.body.append(el)
    let got: Record<string, unknown> = {}
    el.addEventListener('aurora-paste', (e) => {
      got = (e as CustomEvent<{ values: Record<string, unknown> }>).detail.values
    })
    el.paste('Pedro Lascasas Pinto\npedro@example.com\n+351 912 345 678')
    expect(got['email']).toBe('pedro@example.com')
    expect(got['fullname']).toBe('Pedro Lascasas Pinto')
    expect(String(got['phone'])).toContain('912')
    const email = wrap.querySelector('[name="email"]') as HTMLElement & { value: string }
    expect(email.value).toBe('pedro@example.com')
    wrap.remove()
    el.remove()
  })

  it('defers entirely to a custom map function', () => {
    const wrap = document.createElement('div')
    wrap.id = 't2'
    wrap.innerHTML = '<aurora-input name="ticket"></aurora-input>'
    document.body.append(wrap)
    const el = document.createElement('aurora-smartpaste') as AuroraSmartpaste
    el.setAttribute('for', 't2')
    document.body.append(el)
    el.map = (text) => ({ ticket: /#(\d+)/.exec(text)?.[1] ?? '' })
    const values = el.paste('See issue #4821 for details')
    expect(values['ticket']).toBe('4821')
    wrap.remove()
    el.remove()
  })
})
