import { describe, expect, it } from 'vitest'
import './captcha'
import './speechbutton'
import type { AuroraCaptcha } from './captcha'
import type { AuroraSpeechbutton } from './speechbutton'

describe('aurora-captcha', () => {
  it('renders a challenge and verifies the correct code', () => {
    const el = document.createElement('aurora-captcha') as AuroraCaptcha
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('canvas')).not.toBeNull()
    const code = (el as unknown as { code: string }).code
    expect(code.length).toBe(5)
    let valid: boolean | null = null
    el.addEventListener('aurora-verify', (e) => {
      valid = (e as CustomEvent<{ valid: boolean }>).detail.valid
    })
    const input = el.shadowRoot?.querySelector('input')
    if (input) {
      input.value = code.toLowerCase()
      input.dispatchEvent(new Event('input'))
    }
    expect(valid).toBe(true)
    expect(el.verified).toBe(true)
    el.regenerate()
    expect(el.verified).toBe(false)
    el.remove()
  })

  it('rejects a wrong full-length answer', () => {
    const el = document.createElement('aurora-captcha') as AuroraCaptcha
    document.body.append(el)
    let valid: boolean | null = null
    el.addEventListener('aurora-verify', (e) => {
      valid = (e as CustomEvent<{ valid: boolean }>).detail.valid
    })
    const input = el.shadowRoot?.querySelector('input')
    if (input) {
      input.value = '#####'
      input.dispatchEvent(new Event('input'))
    }
    expect(valid).toBe(false)
    expect(el.verified).toBe(false)
    el.remove()
  })
})

describe('aurora-speechbutton', () => {
  it('renders disabled when the Web Speech API is unavailable', () => {
    const el = document.createElement('aurora-speechbutton') as AuroraSpeechbutton
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('button')?.disabled).toBe(true)
    el.remove()
  })

  it('streams transcripts into the target when a recognizer exists', () => {
    class FakeRec {
      lang = ''
      interimResults = false
      onresult: ((e: { results: { transcript: string }[][] }) => void) | null = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      start(): void {
        this.onresult?.({ results: [[{ transcript: 'hello aurora' }]] })
        this.onend?.()
      }
      stop(): void {}
    }
    ;(window as unknown as Record<string, unknown>)['SpeechRecognition'] = FakeRec
    const input = document.createElement('input')
    input.id = 'speechTarget'
    document.body.append(input)
    const el = document.createElement('aurora-speechbutton') as AuroraSpeechbutton
    el.setAttribute('for', 'speechTarget')
    document.body.append(el)
    const results: { transcript: string; final: boolean }[] = []
    el.addEventListener('aurora-result', (e) => {
      results.push((e as CustomEvent<{ transcript: string; final: boolean }>).detail)
    })
    el.shadowRoot?.querySelector('button')?.click()
    expect(input.value).toBe('hello aurora')
    expect(results.at(-1)).toEqual({ transcript: 'hello aurora', final: true })
    delete (window as unknown as Record<string, unknown>)['SpeechRecognition']
    input.remove()
    el.remove()
  })
})
