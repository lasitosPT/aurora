import { describe, expect, it } from 'vitest'
import './chat'
import type { AuroraChat } from './chat'

describe('aurora-chat', () => {
  it('renders history with sided bubbles, avatars, and meta', () => {
    const el = document.createElement('aurora-chat') as AuroraChat
    document.body.append(el)
    el.messages = [
      { text: 'Hey! Have you tried aurora?', who: 'them', name: 'Ada', time: '09:12' },
      { text: 'Installing it right now.', who: 'me', time: '09:13' },
    ]
    const msgs = el.shadowRoot?.querySelectorAll('.msg')
    expect(msgs?.length).toBe(2)
    expect(msgs?.[0]?.querySelector('aurora-avatar')).not.toBeNull()
    expect(msgs?.[1]?.classList.contains('me')).toBe(true)
    expect(msgs?.[0]?.querySelector('.meta')?.textContent).toBe('Ada · 09:12')
    el.remove()
  })

  it('sends from the composer: echoes locally, clears, and emits aurora-send', () => {
    const el = document.createElement('aurora-chat') as AuroraChat
    document.body.append(el)
    let sent = ''
    el.addEventListener('aurora-send', (e) => {
      sent = (e as CustomEvent<{ text: string }>).detail.text
    })
    const input = el.shadowRoot?.querySelector<HTMLInputElement>('input')
    if (!input) throw new Error('no input')
    input.value = '  ship it  '
    el.shadowRoot?.querySelector('form')?.dispatchEvent(new Event('submit'))
    expect(sent).toBe('ship it')
    expect(input.value).toBe('')
    expect(el.messages.length).toBe(1)
    expect(el.shadowRoot?.querySelector('.msg.me .bubble')?.textContent).toBe('ship it')
    el.remove()
  })

  it('shows the typing indicator only with the typing attribute', () => {
    const el = document.createElement('aurora-chat') as AuroraChat
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.typing')).not.toBeNull()
    el.setAttribute('typing', '')
    expect(el.hasAttribute('typing')).toBe(true)
    el.remove()
  })
})
