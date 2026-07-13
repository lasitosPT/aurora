import { describe, expect, it } from 'vitest'
import './barcode'
import { encodeCode128 } from './barcode'
import type { AuroraBarcode } from './barcode'

describe('encodeCode128', () => {
  it('matches the python-barcode reference bit for bit', () => {
    /* Reference bit strings generated with python-barcode (ISO/IEC 15417). */
    const refs: [string, string][] = [
      [
        'aurora',
        '11010010000100101100001001111001010010011110100011110101001001111010010110000110111011101100011101011',
      ],
      [
        'Ship-It_Fast!',
        '1101001000011011101000100110000101000011010010100111100100110111001100010001010011110100101001100001000110001010010110000101111001001001111010011001101100100111001101100011101011',
      ],
      [
        'AURORA lib',
        '1101001000010100011000110111011101100010111010001110110110001011101010001100011011001100110010100001000011010010010000110101100001001100011101011',
      ],
      [
        '12345678',
        '1101001110010110011100100010110001110001011011000010100100011101101100011101011',
      ],
      [
        '00997731',
        '1101001110011011001100101110111101111011101011011000110110001010001100011101011',
      ],
    ]
    for (const [payload, bits] of refs) {
      expect(encodeCode128(payload), payload).toBe(bits)
    }
  })

  it('rejects unencodable characters', () => {
    expect(encodeCode128('héllo')).toBeNull()
    expect(encodeCode128('')).toBeNull()
  })
})

describe('aurora-barcode', () => {
  it('renders bars and the printed value', () => {
    const el = document.createElement('aurora-barcode') as AuroraBarcode
    el.setAttribute('value', 'AURORA-0042')
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('rect').length).toBeGreaterThan(10)
    expect(el.shadowRoot?.querySelector('text')?.textContent).toBe('AURORA-0042')
    expect(el.getAttribute('role')).toBe('img')
    el.remove()
  })

  it('emits aurora-error on unencodable input', () => {
    const el = document.createElement('aurora-barcode') as AuroraBarcode
    el.setAttribute('value', 'ölwechsel')
    let reason = ''
    el.addEventListener('aurora-error', (e) => {
      reason = (e as CustomEvent<{ reason: string }>).detail.reason
    })
    document.body.append(el)
    expect(reason).toBe('charset')
    el.remove()
  })
})
