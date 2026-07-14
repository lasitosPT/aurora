import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

interface RecognitionLike {
  lang: string
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

const STYLE = `
  :host { display: inline-block; }
  button {
    all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center;
    gap: 8px; padding: 0.55rem 1.05rem; font: inherit; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem);
  }
  button:hover:not(:disabled) { border-color: var(--aurora-accent, #6d5cff); }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  button:disabled { opacity: 0.45; cursor: default; }
  :host([listening]) button { border-color: var(--aurora-danger, #f43f5e); color: var(--aurora-danger, #f43f5e); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  :host([listening]) .dot { animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity: 0.3; } }
`

/**
 * `<aurora-speechbutton for="inputId">` — press to talk. Uses the Web Speech
 * API where available (disabled with a tooltip elsewhere), streams interim
 * transcripts into the target input, and emits `aurora-result` with the
 * final text. `lang` sets the recognition locale.
 */
export class AuroraSpeechbutton extends AuroraElement {
  private recognition: RecognitionLike | null = null

  connectedCallback(): void {
    const label = escapeHtml(this.getAttribute('label') ?? 'Speak')
    const w = window as unknown as Record<string, unknown>
    const Ctor = (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as
      (new () => RecognitionLike) | undefined
    const supported = typeof Ctor === 'function'
    this.root.innerHTML = `<style>${STYLE}</style><button part="button" ${supported ? '' : 'disabled title="Speech recognition is not available in this browser"'} aria-pressed="false"><span class="dot" aria-hidden="true"></span>${label}</button>`
    if (!supported) return
    this.root.querySelector('button')?.addEventListener('click', () => {
      if (this.hasAttribute('listening')) this.stop()
      else this.start(Ctor)
    })
  }

  private target(): (HTMLElement & { value?: string }) | null {
    const id = this.getAttribute('for')
    return id ? (document.getElementById(id) as HTMLElement & { value?: string }) : null
  }

  private start(Ctor: new () => RecognitionLike): void {
    const rec = new Ctor()
    this.recognition = rec
    rec.lang = this.getAttribute('lang') ?? 'en-US'
    rec.interimResults = true
    this.setAttribute('listening', '')
    this.root.querySelector('button')?.setAttribute('aria-pressed', 'true')
    rec.onresult = (e): void => {
      const transcript = Array.from(
        { length: e.results.length },
        (_, i) => e.results[i]?.[0]?.transcript ?? '',
      ).join('')
      const field = this.target()
      if (field) {
        field.value = transcript
        field.dispatchEvent(new Event('input', { bubbles: true }))
      }
      this.dispatchEvent(new CustomEvent('aurora-result', { detail: { transcript, final: false } }))
    }
    rec.onend = (): void => {
      this.stopUi()
      const field = this.target()
      this.dispatchEvent(
        new CustomEvent('aurora-result', {
          detail: { transcript: field?.value ?? '', final: true },
        }),
      )
    }
    rec.onerror = (): void => this.stopUi()
    rec.start()
  }

  stop(): void {
    this.recognition?.stop()
    this.stopUi()
  }

  private stopUi(): void {
    this.removeAttribute('listening')
    this.root.querySelector('button')?.setAttribute('aria-pressed', 'false')
  }
}

register('aurora-speechbutton', AuroraSpeechbutton)
