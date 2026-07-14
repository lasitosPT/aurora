import { beforeEach, describe, expect, it } from 'vitest'
import { isRtl } from './dir'
import '../components/slider'
import '../components/drawer'
import type { AuroraSlider } from '../components/slider'
import type { AuroraDrawer } from '../components/drawer'

describe('isRtl', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('is false with no dir anywhere', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(isRtl(el)).toBe(false)
  })

  it('finds the nearest ancestor dir, nearest wins', () => {
    document.body.innerHTML = `<div dir="rtl"><section><span id="a"></span></section><p dir="ltr"><span id="b"></span></p></div>`
    expect(isRtl(document.getElementById('a') as Element)).toBe(true)
    expect(isRtl(document.getElementById('b') as Element)).toBe(false)
  })

  it('crosses shadow boundaries via the host', () => {
    const wrap = document.createElement('div')
    wrap.setAttribute('dir', 'rtl')
    const host = document.createElement('div')
    wrap.appendChild(host)
    document.body.appendChild(wrap)
    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('span')
    shadow.appendChild(inner)
    expect(isRtl(inner)).toBe(true)
  })
})

describe('RTL behaviour', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('slider arrow keys follow the visual direction in RTL', () => {
    const wrap = document.createElement('div')
    wrap.setAttribute('dir', 'rtl')
    wrap.innerHTML = `<aurora-slider min="0" max="100" value="50"></aurora-slider>`
    document.body.appendChild(wrap)
    const slider = wrap.querySelector('aurora-slider') as AuroraSlider
    const track = slider.shadowRoot?.querySelector('.track') as HTMLElement
    track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(slider.value).toBe(51)
    track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(slider.value).toBe(50)
    track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(slider.value).toBe(51)
  })

  it('slider arrow keys keep LTR semantics without dir', () => {
    document.body.innerHTML = `<aurora-slider min="0" max="100" value="50"></aurora-slider>`
    const slider = document.querySelector('aurora-slider') as AuroraSlider
    const track = slider.shadowRoot?.querySelector('.track') as HTMLElement
    track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(slider.value).toBe(49)
  })

  it('drawer default side resolves to the inline-end edge', () => {
    const wrap = document.createElement('div')
    wrap.setAttribute('dir', 'rtl')
    wrap.innerHTML = `<aurora-drawer><p>hi</p></aurora-drawer>`
    document.body.appendChild(wrap)
    const drawer = wrap.querySelector('aurora-drawer') as AuroraDrawer
    drawer.show()
    const panel = drawer.shadowRoot?.querySelector('.panel') as HTMLElement
    expect(panel.style.right).toBe('auto')
    expect(panel.style.left).toBe('0px')
    drawer.hide()
  })

  it('drawer side="start" is left in LTR', () => {
    document.body.innerHTML = `<aurora-drawer side="start"><p>hi</p></aurora-drawer>`
    const drawer = document.querySelector('aurora-drawer') as AuroraDrawer
    drawer.show()
    const panel = drawer.shadowRoot?.querySelector('.panel') as HTMLElement
    expect(panel.style.left).toBe('0px')
    drawer.hide()
  })

  it('explicit side="right" stays physical even in RTL', () => {
    const wrap = document.createElement('div')
    wrap.setAttribute('dir', 'rtl')
    wrap.innerHTML = `<aurora-drawer side="right"><p>hi</p></aurora-drawer>`
    document.body.appendChild(wrap)
    const drawer = wrap.querySelector('aurora-drawer') as AuroraDrawer
    drawer.show()
    const panel = drawer.shadowRoot?.querySelector('.panel') as HTMLElement
    expect(panel.style.right).toBe('0px')
    drawer.hide()
  })
})
