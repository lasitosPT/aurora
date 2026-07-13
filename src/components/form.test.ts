import { describe, expect, it } from 'vitest'
import './form'
import './input'
import './checkbox'
import type { AuroraForm } from './form'

function make(): AuroraForm {
  const el = document.createElement('aurora-form') as AuroraForm
  el.innerHTML = `
    <aurora-input name="email" label="Email"></aurora-input>
    <aurora-input name="handle" label="Handle" required></aurora-input>
    <aurora-checkbox name="terms" label="Accept"></aurora-checkbox>
    <button data-submit>Send</button>
  `
  document.body.append(el)
  el.rules = {
    email: [{ type: 'email', message: 'Bad email' }, { type: 'required' }],
    handle: [{ type: 'min', value: 3, message: 'Too short' }],
    terms: [{ type: 'required', message: 'You must accept' }],
  }
  return el
}

function setInput(el: AuroraForm, name: string, v: string): void {
  const field = el.querySelector(`[name="${name}"]`) as HTMLElement & { value: string }
  field.value = v
}

describe('aurora-form', () => {
  it('blocks submit with errors, injects messages, and emits aurora-invalid', () => {
    const el = make()
    let invalid: Record<string, string> | null = null
    let submitted = false
    el.addEventListener('aurora-invalid', (e) => {
      invalid = (e as CustomEvent<{ errors: Record<string, string> }>).detail.errors
    })
    el.addEventListener('aurora-submit', () => {
      submitted = true
    })
    el.querySelector<HTMLButtonElement>('[data-submit]')?.click()
    expect(submitted).toBe(false)
    expect(invalid).toEqual({
      email: 'This field is required',
      handle: 'This field is required',
      terms: 'You must accept',
    })
    expect(el.querySelectorAll('.aurora-form-error').length).toBe(3)
    expect(el.querySelector('[name="email"]')?.hasAttribute('aria-invalid')).toBe(true)
    el.remove()
  })

  it('applies email/min rules and submits clean data', () => {
    const el = make()
    let data: Record<string, unknown> | null = null
    el.addEventListener('aurora-submit', (e) => {
      data = (e as CustomEvent<{ data: Record<string, unknown> }>).detail.data
    })
    setInput(el, 'email', 'not-an-email')
    setInput(el, 'handle', 'ab')
    el.submit()
    expect(el.querySelector('[name="email"]')?.nextElementSibling?.textContent).toBe('Bad email')
    expect(el.querySelector('[name="handle"]')?.nextElementSibling?.textContent).toBe('Too short')
    setInput(el, 'email', 'dev@aurora.com')
    setInput(el, 'handle', 'lasitos')
    ;(el.querySelector('[name="terms"]') as HTMLElement & { toggle: () => void }).toggle()
    el.submit()
    expect(data).toEqual({
      email: 'dev@aurora.com',
      handle: 'lasitos',
      terms: true,
    })
    expect(el.querySelectorAll('.aurora-form-error').length).toBe(0)
    el.remove()
  })

  it('re-validates touched fields as they change', () => {
    const el = make()
    el.submit()
    expect(el.querySelector('[name="handle"]')?.nextElementSibling?.textContent).toBe(
      'This field is required',
    )
    setInput(el, 'handle', 'lasitos')
    el.querySelector('[name="handle"]')?.dispatchEvent(new Event('input', { bubbles: true }))
    expect(
      el
        .querySelector('[name="handle"]')
        ?.nextElementSibling?.classList.contains('aurora-form-error') ?? false,
    ).toBe(false)
    el.remove()
  })
})
