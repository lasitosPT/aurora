import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

/* Code 128 symbol patterns (ISO/IEC 15417 spec constants), values 0-105. */
const CODES = [
  '11011001100',
  '11001101100',
  '11001100110',
  '10010011000',
  '10010001100',
  '10001001100',
  '10011001000',
  '10011000100',
  '10001100100',
  '11001001000',
  '11001000100',
  '11000100100',
  '10110011100',
  '10011011100',
  '10011001110',
  '10111001100',
  '10011101100',
  '10011100110',
  '11001110010',
  '11001011100',
  '11001001110',
  '11011100100',
  '11001110100',
  '11101101110',
  '11101001100',
  '11100101100',
  '11100100110',
  '11101100100',
  '11100110100',
  '11100110010',
  '11011011000',
  '11011000110',
  '11000110110',
  '10100011000',
  '10001011000',
  '10001000110',
  '10110001000',
  '10001101000',
  '10001100010',
  '11010001000',
  '11000101000',
  '11000100010',
  '10110111000',
  '10110001110',
  '10001101110',
  '10111011000',
  '10111000110',
  '10001110110',
  '11101110110',
  '11010001110',
  '11000101110',
  '11011101000',
  '11011100010',
  '11011101110',
  '11101011000',
  '11101000110',
  '11100010110',
  '11101101000',
  '11101100010',
  '11100011010',
  '11101111010',
  '11001000010',
  '11110001010',
  '10100110000',
  '10100001100',
  '10010110000',
  '10010000110',
  '10000101100',
  '10000100110',
  '10110010000',
  '10110000100',
  '10011010000',
  '10011000010',
  '10000110100',
  '10000110010',
  '11000010010',
  '11001010000',
  '11110111010',
  '11000010100',
  '10001111010',
  '10100111100',
  '10010111100',
  '10010011110',
  '10111100100',
  '10011110100',
  '10011110010',
  '11110100100',
  '11110010100',
  '11110010010',
  '11011011110',
  '11011110110',
  '11110110110',
  '10101111000',
  '10100011110',
  '10001011110',
  '10111101000',
  '10111100010',
  '11110101000',
  '11110100010',
  '10111011110',
  '10111101110',
  '11101011110',
  '11110101110',
  '11010000100',
  '11010010000',
  '11010011100',
]
const STOP = '1100011101011'

/**
 * Encodes `text` as Code 128 modules. Pure even-length digit payloads use
 * code set C (digit pairs); everything else uses code set B (ASCII 32-126).
 * Returns the bit string, or null if a character is unencodable.
 */
export function encodeCode128(text: string): string | null {
  if (!text) return null
  const values: number[] = []
  if (/^\d+$/.test(text) && text.length % 2 === 0) {
    values.push(105)
    for (let i = 0; i < text.length; i += 2) values.push(Number(text.slice(i, i + 2)))
  } else {
    values.push(104)
    for (const ch of text) {
      const code = ch.charCodeAt(0)
      if (code < 32 || code > 126) return null
      values.push(code - 32)
    }
  }
  let checksum = values[0] ?? 0
  for (let i = 1; i < values.length; i++) checksum += (values[i] ?? 0) * i
  values.push(checksum % 103)
  return values.map((v) => CODES[v] ?? '').join('') + STOP
}

const STYLE = `
  :host { display: inline-block; color: var(--aurora-fg, #ececf2); }
  svg {
    display: block; width: 100%; height: auto; border-radius: 10px;
    background: var(--aurora-barcode-bg, #fff);
  }
  rect { fill: var(--aurora-barcode-fg, #16161f); }
  text { fill: var(--aurora-barcode-fg, #16161f); font-family: ui-monospace, monospace; }
  .err { font-size: 12px; color: var(--aurora-danger, #f43f5e); }
`

/**
 * `<aurora-barcode value="AURORA-0042">` — a Code 128 barcode rendered as
 * crisp SVG with a quiet zone and the value printed underneath (hide with
 * `hide-text`). The encoder is in-house and spec-verified; emits
 * `aurora-error` for unencodable input.
 */
export class AuroraBarcode extends AuroraElement {
  static readonly observedAttributes = ['value']
  private ready = false

  connectedCallback(): void {
    this.renderBars()
    this.ready = true
  }

  attributeChangedCallback(_n: string, oldValue: string | null, newValue: string | null): void {
    if (this.ready && oldValue !== newValue) this.renderBars()
  }

  private renderBars(): void {
    const value = this.getAttribute('value') ?? ''
    const bits = value ? encodeCode128(value) : null
    if (!bits) {
      this.root.innerHTML = `<style>${STYLE}</style><div class="err">Unencodable value</div>`
      this.dispatchEvent(new CustomEvent('aurora-error', { detail: { reason: 'charset' } }))
      return
    }
    const quiet = 10
    const showText = !this.hasAttribute('hide-text')
    const width = bits.length + quiet * 2
    const barH = 56
    const height = showText ? barH + 18 : barH + 12
    let rects = ''
    let run = 0
    for (let i = 0; i <= bits.length; i++) {
      if (bits[i] === '1') run++
      else if (run) {
        rects += `<rect x="${quiet + i - run}" y="6" width="${run}" height="${barH}"/>`
        run = 0
      }
    }
    this.root.innerHTML = `<style>${STYLE}</style><svg viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" aria-hidden="true">${rects}${
      showText
        ? `<text x="${width / 2}" y="${barH + 15}" text-anchor="middle" font-size="9">${escapeHtml(value)}</text>`
        : ''
    }</svg>`
    this.setAttribute('role', 'img')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', `Barcode: ${value}`)
  }
}

register('aurora-barcode', AuroraBarcode)
