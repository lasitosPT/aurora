import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { t } from '../core/i18n'
import './avatar'

export interface ChatMessage {
  text: string
  who: 'me' | 'them'
  name?: string
  time?: string
}

const STYLE = `
  :host {
    display: flex; flex-direction: column;
    height: var(--aurora-chat-height, 380px);
    color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; overflow: hidden;
    background: var(--aurora-surface, #14141f);
    font-size: 0.93rem;
  }
  .log { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .msg { display: flex; gap: 10px; align-items: flex-end; max-width: 82%; }
  .msg.me { align-self: flex-end; flex-direction: row-reverse; }
  .bubble {
    padding: 9px 14px; border-radius: 16px; line-height: 1.5;
    background: var(--aurora-field, rgba(255, 255, 255, 0.06));
    border-bottom-left-radius: 5px;
  }
  .msg.me .bubble {
    background: var(--aurora-accent, #6d5cff); color: #fff;
    border-bottom-left-radius: 16px; border-bottom-right-radius: 5px;
  }
  .meta { font-size: 0.72rem; color: var(--aurora-muted, #9a98b3); margin-top: 4px; }
  .msg.me .meta { text-align: end; }
  .typing { display: none; gap: 5px; padding: 12px 18px; align-items: center; }
  :host([typing]) .typing { display: flex; }
  .typing i {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--aurora-muted, #9a98b3); animation: bounce 1.2s infinite;
  }
  .typing i:nth-child(2) { animation-delay: 0.15s; }
  .typing i:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }
  .composer {
    display: flex; gap: 10px; padding: 12px;
    border-top: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
  }
  .composer input {
    all: unset; flex: 1; min-width: 0; padding: 0.55rem 0.9rem; border-radius: 11px;
    background: var(--aurora-field, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .composer input:focus { border-color: var(--aurora-accent, #6d5cff); }
  .send {
    all: unset; cursor: pointer; padding: 0.55rem 1.05rem; border-radius: 11px;
    background: var(--aurora-accent, #6d5cff); color: #fff; font-weight: 600;
  }
  .send:hover { background: var(--aurora-accent-hover, #5a49e0); }
  .send:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: 2px; }
`

/**
 * `<aurora-chat>` — a conversation view: bubbles for `me`/`them` with avatars
 * (composed `aurora-avatar` initials), names and times, a bouncing typing
 * indicator behind the `typing` attribute, auto-scroll, and a composer that
 * emits `aurora-send`. Feed history via `messages`; append live with
 * `add(msg)`.
 */
export class AuroraChat extends AuroraElement {
  #messages: ChatMessage[] = []

  get messages(): ChatMessage[] {
    return this.#messages
  }

  set messages(list: ChatMessage[]) {
    this.#messages = list
    this.renderLog()
  }

  connectedCallback(): void {
    const placeholder = this.getAttribute('placeholder') ?? t('chat.placeholder')
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="log" part="log" role="log" aria-live="polite"></div>
      <div class="typing" part="typing" aria-label="Typing"><i></i><i></i><i></i></div>
      <form class="composer" part="composer">
        <input part="input" placeholder="${escapeHtml(placeholder)}" aria-label="Message" />
        <button class="send" part="send" type="submit">${escapeHtml(this.getAttribute('send-label') ?? t('chat.send'))}</button>
      </form>`
    this.root.querySelector('form')?.addEventListener('submit', (e) => {
      e.preventDefault()
      const input = this.root.querySelector<HTMLInputElement>('input')
      const text = input?.value.trim()
      if (!text || !input) return
      input.value = ''
      this.add({ text, who: 'me' })
      this.dispatchEvent(new CustomEvent('aurora-send', { detail: { text } }))
    })
    this.renderLog()
  }

  add(msg: ChatMessage): void {
    this.#messages.push(msg)
    this.renderLog(true)
  }

  private renderLog(animateLast = false): void {
    const log = this.root.querySelector<HTMLElement>('.log')
    if (!log) return
    log.innerHTML = this.#messages
      .map((m) => {
        const meta = [m.name, m.time]
          .filter(Boolean)
          .map((s) => escapeHtml(s ?? ''))
          .join(' · ')
        return `<div class="msg ${m.who === 'me' ? 'me' : ''}">${
          m.who === 'them'
            ? `<aurora-avatar name="${escapeHtml(m.name ?? '?')}" style="--aurora-avatar-size:28px"></aurora-avatar>`
            : ''
        }<div><div class="bubble">${escapeHtml(m.text)}</div>${meta ? `<div class="meta">${meta}</div>` : ''}</div></div>`
      })
      .join('')
    log.scrollTop = log.scrollHeight
    if (animateLast && !prefersReducedMotion()) {
      const last = log.lastElementChild
      if (last)
        gsap.fromTo(
          last,
          { opacity: 0, y: 12, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'power3.out' },
        )
    }
  }
}

register('aurora-chat', AuroraChat)
