import { describe, expect, it } from 'vitest'
import './videoplayer'
import type { AuroraVideoplayer } from './videoplayer'

describe('aurora-videoplayer', () => {
  it('renders chrome over the video and starts paused', () => {
    const el = document.createElement('aurora-videoplayer') as AuroraVideoplayer
    el.setAttribute('src', 'movie.mp4')
    el.setAttribute('poster', 'poster.jpg')
    document.body.append(el)
    const video = el.shadowRoot?.querySelector('video')
    expect(video?.getAttribute('src')).toBe('movie.mp4')
    expect(video?.getAttribute('poster')).toBe('poster.jpg')
    expect(el.hasAttribute('paused')).toBe(true)
    expect(el.shadowRoot?.querySelector('.seek')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('.pp')?.getAttribute('aria-label')).toBe('Play')
    el.remove()
  })

  it('toggles mute state and icon', () => {
    const el = document.createElement('aurora-videoplayer') as AuroraVideoplayer
    el.setAttribute('src', 'movie.mp4')
    document.body.append(el)
    const mute = el.shadowRoot?.querySelector<HTMLButtonElement>('.mute')
    mute?.click()
    expect(el.shadowRoot?.querySelector('video')?.muted).toBe(true)
    expect(mute?.textContent).toBe('🔇')
    mute?.click()
    expect(el.shadowRoot?.querySelector('video')?.muted).toBe(false)
    el.remove()
  })

  it('seeks by keyboard when a duration exists', () => {
    const el = document.createElement('aurora-videoplayer') as AuroraVideoplayer
    el.setAttribute('src', 'movie.mp4')
    document.body.append(el)
    const video = el.shadowRoot?.querySelector('video')
    if (video) {
      Object.defineProperty(video, 'duration', { value: 100, configurable: true })
      video.currentTime = 10
    }
    el.shadowRoot
      ?.querySelector('.seek')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(el.shadowRoot?.querySelector('video')?.currentTime).toBe(15)
    el.remove()
  })
})
