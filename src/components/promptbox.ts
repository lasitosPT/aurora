import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: block; width: 100%; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .out { padding: 16px 18px; line-height: 1.6; font-size: 0.93rem; display: none; }
  :host([has-output]) .out { display: block; }
  .out-actions { display: none; gap: 8px; padding: 0 18px 12px; }
  :host([has-output]) .out-actions { display: flex; }
  .out-actions button {
    all: unset; cursor: pointer; font-size: 0.76rem; padding: 4px 11px; border-radius: 8px;
    color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  .out-actions button:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  .out-actions button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .busy { display: none; flex-direction: column; gap: 9px; padding: 16px 18px; }
  :host([busy]) .busy { display: flex; }
  :host([busy]) .out, :host([busy]) .out-actions { display: none; }
  .busy i {
    height: 12px; border-radius: 6px;
    background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%);
    background-size: 200% 100%; animation: shimmer 1.3s infinite;
  }
  .busy i:nth-child(2) { width: 82%; }
  .busy i:nth-child(3) { width: 56%; }
  @keyframes shimmer { to { background-position: -200% 0; } }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; padding: 14px 14px 0; }
  .chips button {
    all: unset; cursor: pointer; font-size: 0.8rem; padding: 6px 13px; border-radius: 99px;
    color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .chips button:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
  .chips button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .composer { display: flex; gap: 10px; padding: 14px; align-items: flex-end; }
  textarea {
    all: unset; flex: 1; min-width: 0; min-height: 1.5em; max-height: 130px; overflow-y: auto;
    padding: 0.6rem 0.9rem; font: inherit; line-height: 1.5; white-space: pre-wrap;
    background: var(--aurora-field, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12)); border-radius: 12px;
  }
  textarea:focus { border-color: var(--aurora-accent, #6d5cff); }
  .send {
    all: unset; cursor: pointer; width: 40px; height: 40px; flex: none;
    display: grid; place-items: center; border-radius: 11px; font-size: 1rem;
    background: var(--aurora-accent, #6d5cff); color: #fff;
  }
  .send:hover { background: var(--aurora-accent-hover, #5a49e0); }
  .send:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: 2px; }
  .send:disabled { opacity: 0.4; cursor: default; }
`

/**
 * `<aurora-promptbox>` — an AI prompt surface with no backend opinion:
 * suggestion chips from `<option>` children, an auto-growing composer,
 * shimmer lines while `busy`, and an output view with Copy and Retry.
 * Wire `aurora-send` to your model, flip `busy` on, then set `output`.
 */
export class AuroraPromptbox extends AuroraElement {
  private lastPrompt = ''

  get output(): string {
    return this.root.querySelector('.out')?.textContent ?? ''
  }

  set output(text: string) {
    this.removeAttribute('busy')
    const out = this.root.querySelector<HTMLElement>('.out')
    if (!out) return
    out.textContent = text
    this.toggleAttribute('has-output', text.trim() !== '')
    if (text.trim() && !prefersReducedMotion())
      gsap.fromTo(
        out,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      )
  }

  connectedCallback(): void {
    const chips = Array.from(this.querySelectorAll('option')).map(
      (o) => o.textContent?.trim() ?? '',
    )
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="out" part="output" aria-live="polite"></div>
      <div class="out-actions"><button class="copy-btn">⧉ Copy</button><button class="retry-btn">↻ Retry</button></div>
      <div class="busy" aria-label="Generating" role="status"><i></i><i></i><i></i></div>
      ${chips.length ? `<div class="chips" part="chips">${chips.map((c) => `<button data-c="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div>` : ''}
      <div class="composer" part="composer">
        <textarea part="input" rows="1" placeholder="${escapeHtml(this.getAttribute('placeholder') ?? 'Ask anything…')}" aria-label="Prompt"></textarea>
        <button class="send" part="send" aria-label="Send">➤</button>
      </div>`
    const area = this.root.querySelector<HTMLTextAreaElement>('textarea')
    const send = (): void => {
      const prompt = area?.value.trim()
      if (!prompt || this.hasAttribute('busy')) return
      this.lastPrompt = prompt
      if (area) area.value = ''
      this.dispatchEvent(new CustomEvent('aurora-send', { detail: { prompt } }))
    }
    this.root.querySelector('.send')?.addEventListener('click', send)
    area?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        send()
      }
    })
    area?.addEventListener('input', () => {
      area.style.height = 'auto'
      if (area.scrollHeight) area.style.height = `${Math.min(area.scrollHeight, 130)}px`
    })
    this.root.querySelectorAll<HTMLButtonElement>('.chips button').forEach((chip) =>
      chip.addEventListener('click', () => {
        if (area) {
          area.value = chip.dataset['c'] ?? ''
          area.focus()
        }
      }),
    )
    this.root.querySelector('.copy-btn')?.addEventListener('click', () => {
      void navigator.clipboard?.writeText?.(this.output)
      this.dispatchEvent(new CustomEvent('aurora-copy', { detail: { output: this.output } }))
    })
    this.root.querySelector('.retry-btn')?.addEventListener('click', () => {
      if (this.lastPrompt)
        this.dispatchEvent(
          new CustomEvent('aurora-send', { detail: { prompt: this.lastPrompt, retry: true } }),
        )
    })
  }
}

register('aurora-promptbox', AuroraPromptbox)
