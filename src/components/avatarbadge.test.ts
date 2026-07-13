import { describe, expect, it } from 'vitest'
import './avatar'
import './badge'
import type { AuroraAvatar } from './avatar'
import type { AuroraBadge } from './badge'

describe('aurora-avatar', () => {
  it('renders initials with a deterministic hue when no src is given', () => {
    const el = document.createElement('aurora-avatar') as AuroraAvatar
    el.setAttribute('name', 'Ada Lovelace')
    el.setAttribute('status', 'online')
    document.body.append(el)
    const av = el.shadowRoot?.querySelector<HTMLElement>('.av')
    expect(av?.textContent).toBe('AL')
    const hue = av?.style.getPropertyValue('--hue')
    expect(el.shadowRoot?.querySelector('.dot.online')).not.toBeNull()
    expect(el.getAttribute('aria-label')).toBe('Ada Lovelace (online)')
    el.remove()
    const twin = document.createElement('aurora-avatar') as AuroraAvatar
    twin.setAttribute('name', 'Ada Lovelace')
    document.body.append(twin)
    expect(
      twin.shadowRoot?.querySelector<HTMLElement>('.av')?.style.getPropertyValue('--hue'),
    ).toBe(hue)
    twin.remove()
  })

  it('renders the image when src is present', () => {
    const el = document.createElement('aurora-avatar') as AuroraAvatar
    el.setAttribute('name', 'Grace Hopper')
    el.setAttribute('src', 'https://example.com/x.png')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('img')).not.toBeNull()
    el.remove()
  })
})

describe('aurora-badge', () => {
  it('caps at max, hides zero, and updates on value change', () => {
    const el = document.createElement('aurora-badge') as AuroraBadge
    el.setAttribute('value', '120')
    el.innerHTML = '<button>Inbox</button>'
    document.body.append(el)
    const tag = (): HTMLElement | null | undefined => el.shadowRoot?.querySelector('.tag')
    expect(tag()?.textContent).toBe('99+')
    expect(tag()?.classList.contains('overlay')).toBe(true)
    el.setAttribute('value', '7')
    expect(tag()?.textContent).toBe('7')
    el.setAttribute('value', '0')
    expect(tag()?.hasAttribute('hidden')).toBe(true)
    el.remove()
  })

  it('renders dot mode and standalone pills', () => {
    const dot = document.createElement('aurora-badge') as AuroraBadge
    dot.setAttribute('dot', '')
    dot.setAttribute('tone', 'danger')
    dot.innerHTML = '<span>Chat</span>'
    document.body.append(dot)
    expect(dot.shadowRoot?.querySelector('.tag.dot')).not.toBeNull()
    dot.remove()
    const pill = document.createElement('aurora-badge') as AuroraBadge
    pill.setAttribute('value', 'NEW')
    document.body.append(pill)
    expect(pill.shadowRoot?.querySelector('.tag')?.classList.contains('overlay')).toBe(false)
    expect(pill.shadowRoot?.querySelector('.tag')?.textContent).toBe('NEW')
    pill.remove()
  })
})
