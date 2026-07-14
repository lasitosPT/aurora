import { describe, expect, it } from 'vitest'
import './imageeditor'
import type { AuroraImageeditor } from './imageeditor'

describe('aurora-imageeditor', () => {
  it('renders the toolbar and empty state', () => {
    const el = document.createElement('aurora-imageeditor') as AuroraImageeditor
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('.tools button').length).toBe(8)
    expect(el.shadowRoot?.querySelectorAll('input[data-f]').length).toBe(3)
    expect(el.shadowRoot?.querySelector('.empty')?.textContent).toContain('Open an image')
    expect(el.toDataUrl()).toBe('')
    el.remove()
  })

  it('tracks rotation, flips, and filter state through operations', () => {
    const el = document.createElement('aurora-imageeditor') as AuroraImageeditor
    document.body.append(el)
    let edits = el.edits
    el.addEventListener('aurora-change', (e) => {
      edits = (e as CustomEvent<{ edits: typeof edits }>).detail.edits
    })
    el.rotate(90)
    el.rotate(90)
    expect(edits.rotation).toBe(180)
    el.rotate(-90)
    expect(edits.rotation).toBe(90)
    el.flip('h')
    expect(edits.flipH).toBe(true)
    const range = el.shadowRoot?.querySelector<HTMLInputElement>('input[data-f="contrast"]')
    if (range) {
      range.value = '140'
      range.dispatchEvent(new Event('input'))
    }
    expect(edits.contrast).toBe(140)
    el.reset()
    expect(edits).toEqual({
      rotation: 0,
      flipH: false,
      flipV: false,
      brightness: 100,
      contrast: 100,
      saturate: 100,
    })
    expect(el.shadowRoot?.querySelector<HTMLInputElement>('input[data-f="contrast"]')?.value).toBe(
      '100',
    )
    el.remove()
  })
})

describe('imageeditor crop (v2.9)', () => {
  it('crop mode needs an image; overlay appears and cancel removes it', () => {
    const el = document.createElement('aurora-imageeditor') as AuroraImageeditor
    document.body.append(el)
    el.startCrop()
    expect(el.shadowRoot?.querySelector('.cropov')).toBeNull()
    // fake a loaded image so crop mode arms
    const priv = el as unknown as { img: HTMLImageElement }
    priv.img = document.createElement('img') as HTMLImageElement
    el.startCrop()
    const ov = el.shadowRoot?.querySelector('.cropov')
    expect(ov).not.toBeNull()
    expect(ov?.querySelector('[data-crop-apply]')).not.toBeNull()
    el.cancelCrop()
    expect(el.shadowRoot?.querySelector('.cropov')).toBeNull()
    el.remove()
  })

  it('marquee follows a pointer drag', () => {
    const el = document.createElement('aurora-imageeditor') as AuroraImageeditor
    document.body.append(el)
    const priv = el as unknown as { img: HTMLImageElement }
    priv.img = document.createElement('img') as HTMLImageElement
    el.startCrop()
    const ov = el.shadowRoot?.querySelector<HTMLElement>('.cropov')
    ov?.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 12, bubbles: true }))
    ov?.dispatchEvent(new PointerEvent('pointermove', { clientX: 70, clientY: 52, bubbles: true }))
    const marq = ov?.querySelector<HTMLElement>('.marq')
    expect(marq?.style.display).toBe('block')
    expect(marq?.style.width).toBe('60px')
    expect(marq?.style.height).toBe('40px')
    ov?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    el.remove()
  })
})
