import { describe, expect, it } from 'vitest'
import './upload'
import type { AuroraUpload } from './upload'

describe('aurora-upload', () => {
  it('registers, adds files, lists them and removes', () => {
    const el = document.createElement('aurora-upload') as AuroraUpload
    el.setAttribute('multiple', '')
    document.body.append(el)
    el.addFiles([new File(['abc'], 'a.txt'), new File(['defg'], 'b.txt')])
    expect(el.files.length).toBe(2)
    expect(el.shadowRoot?.querySelectorAll('li').length).toBe(2)
    expect(el.shadowRoot?.querySelector('li')?.textContent).toContain('a.txt')

    el.shadowRoot?.querySelector<HTMLButtonElement>('.rm')?.click()
    expect(el.files.length).toBe(1)
    el.remove()
  })

  it('rejects files over max-size with aurora-error', () => {
    const el = document.createElement('aurora-upload') as AuroraUpload
    el.setAttribute('max-size', '2')
    document.body.append(el)
    let reason = ''
    el.addEventListener('aurora-error', (e) => {
      reason = (e as CustomEvent<{ reason: string }>).detail.reason
    })
    el.addFiles([new File(['toolarge'], 'big.bin')])
    expect(reason).toBe('max-size')
    expect(el.files.length).toBe(0)
    el.remove()
  })
})
