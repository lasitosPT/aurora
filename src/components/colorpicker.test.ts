import { describe, expect, it } from 'vitest'
import './colorpicker'
import type { AuroraColorpicker } from './colorpicker'

describe('aurora-colorpicker', () => {
  it('registers, renders the picker surfaces and roundtrips hex values', () => {
    const el = document.createElement('aurora-colorpicker') as AuroraColorpicker
    el.setAttribute('value', '#ff0000')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.sv')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('.hue')).not.toBeNull()
    expect(el.value).toBe('#ff0000')
    expect(el.shadowRoot?.querySelector('.hue-handle')?.getAttribute('aria-valuenow')).toBe('0')
    el.value = '#00ff00'
    expect(el.value).toBe('#00ff00')
    expect(el.shadowRoot?.querySelector('.hue-handle')?.getAttribute('aria-valuenow')).toBe('120')
    el.remove()
  })

  it('applies swatch presets and emits aurora-change', () => {
    const el = document.createElement('aurora-colorpicker') as AuroraColorpicker
    el.setAttribute('swatches', '#6d5cff, #22d3ee, nope')
    document.body.append(el)
    const buttons = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.swatches button')
    expect(buttons?.length).toBe(2)
    let changed = ''
    el.addEventListener('aurora-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value
    })
    buttons?.[1]?.click()
    expect(changed).toBe('#22d3ee')
    expect(el.value).toBe('#22d3ee')
    el.remove()
  })

  it('commits typed hex from the field and ignores garbage', () => {
    const el = document.createElement('aurora-colorpicker') as AuroraColorpicker
    el.setAttribute('value', '#0000ff')
    document.body.append(el)
    const hex = el.shadowRoot?.querySelector<HTMLInputElement>('.hex')
    if (!hex) throw new Error('no hex field')
    hex.value = '#ffaa00'
    hex.dispatchEvent(new Event('change'))
    expect(el.value).toBe('#ffaa00')
    hex.value = 'garbage'
    hex.dispatchEvent(new Event('change'))
    expect(el.value).toBe('#ffaa00')
    expect(hex.value).toBe('#ffaa00')
    el.remove()
  })
})
