import { describe, expect, it } from 'vitest'
import './qrcode'
import { encodeQr } from './qrcode'
import type { AuroraQrcode } from './qrcode'

/* Version 2-M symbol for 'https://auroralib.com' at mask 3, generated with the
   reference python-qrcode implementation — locks the whole encoder pipeline. */
const REF = [
  '1111111011000100001111111',
  '1000001011110100001000001',
  '1011101000010101101011101',
  '1011101011010111001011101',
  '1011101001100011101011101',
  '1000001001000000001000001',
  '1111111010101010101111111',
  '0000000011011000000000000',
  '1011011100100011101001011',
  '1010100101001100110100010',
  '1011111100011100000110000',
  '0101000110001110010101100',
  '1011111110111110011010111',
  '0100000101111111101110001',
  '0101001010110110000010110',
  '1000110001110011000110001',
  '0000011001101010111111111',
  '0000000011000000100010101',
  '1111111010000110101010111',
  '1000001011110111100010000',
  '1011101000000110111111010',
  '1011101011100001111011111',
  '1011101011000010011010110',
  '1000001001111111011010100',
  '1111111010110000010111111',
]

describe('encodeQr', () => {
  it('reproduces the reference symbol bit for bit', () => {
    const m = encodeQr('https://auroralib.com', 'M', 3)
    expect((m ?? []).map((r) => r.map((v) => (v ? '1' : '0')).join(''))).toEqual(REF)
  })

  it('scales the version with payload size and nulls on overflow', () => {
    expect(encodeQr('hello')?.length).toBe(21)
    expect(encodeQr('a'.repeat(100))?.length).toBe(41)
    expect(encodeQr('a'.repeat(300), 'H')).toBeNull()
  })

  it('draws finder and timing patterns', () => {
    const m = encodeQr('aurora') ?? []
    expect(m[0]?.slice(0, 7).every(Boolean)).toBe(true)
    expect(m[1]?.slice(1, 6).some(Boolean)).toBe(false)
    expect(m[6]?.[8]).not.toBe(m[6]?.[9])
  })
})

describe('aurora-qrcode', () => {
  it('renders an svg with a quiet zone and re-renders on value change', () => {
    const el = document.createElement('aurora-qrcode') as AuroraQrcode
    el.setAttribute('value', 'hello')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 29 29')
    expect(el.getAttribute('role')).toBe('img')
    el.setAttribute('value', 'a'.repeat(100))
    expect(el.shadowRoot?.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 49 49')
    el.remove()
  })

  it('emits aurora-error when the payload exceeds capacity', () => {
    const el = document.createElement('aurora-qrcode') as AuroraQrcode
    el.setAttribute('value', 'a'.repeat(300))
    el.setAttribute('level', 'H')
    let reason = ''
    el.addEventListener('aurora-error', (e) => {
      reason = (e as CustomEvent<{ reason: string }>).detail.reason
    })
    document.body.append(el)
    expect(reason).toBe('capacity')
    expect(el.shadowRoot?.querySelector('svg')).toBeNull()
    el.remove()
  })
})
