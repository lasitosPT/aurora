import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; width: 100%; max-width: 420px; color: var(--aurora-fg, #ececf2); }
  .label {
    display: block; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); margin-bottom: 7px;
  }
  .field { position: relative; }
  textarea {
    all: unset; box-sizing: border-box; display: block; width: 100%;
    min-height: calc(var(--aurora-textarea-rows, 3) * 1.55em + 1.4rem);
    padding: 0.7rem 0.9rem; font: inherit; line-height: 1.55; white-space: pre-wrap;
    overflow-wrap: anywhere;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: 12px; resize: none; overflow: hidden;
    transition: border-color 0.15s ease;
  }
  :host([resizable]) textarea { resize: vertical; overflow: auto; }
  textarea:focus { border-color: var(--aurora-accent, #6d5cff); }
  textarea::placeholder { color: var(--aurora-muted, #9a98b3); opacity: 0.7; }
  .counter {
    position: absolute; right: 10px; bottom: 8px; font-size: 0.72rem;
    color: var(--aurora-muted, #9a98b3); font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .counter.over { color: var(--aurora-danger, #f43f5e); }
`

/**
 * `<aurora-textarea label="…" maxlength="280">` — a form-associated textarea
 * that auto-grows with its content (no scrollbar jumps), shows a live
 * character counter when `maxlength` is set, and re-emits `input`/`change`
 * across the shadow boundary. `resizable` restores the manual drag handle.
 */
export class AuroraTextarea extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private area: HTMLTextAreaElement | null = null

  constructor() {
    super()
    if ('attachInternals' in this) {
      try {
        this.internals = this.attachInternals()
      } catch {
        this.internals = null
      }
    }
  }

  get value(): string {
    return this.area?.value ?? ''
  }

  set value(v: string) {
    if (this.area) {
      this.area.value = v
      this.grow()
      this.sync()
    }
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    const max = this.getAttribute('maxlength')
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label" part="label">${escapeHtml(label)}</label>` : ''
    }<div class="field"><textarea part="textarea" placeholder="${escapeHtml(
      this.getAttribute('placeholder') ?? '',
    )}"${max ? ` maxlength="${escapeHtml(max)}"` : ''}${label ? ` aria-label="${escapeHtml(label)}"` : ''}></textarea>${
      max ? `<span class="counter" part="counter">0 / ${escapeHtml(max)}</span>` : ''
    }</div>`
    this.area = this.root.querySelector('textarea')
    if (this.getAttribute('value')) this.value = this.getAttribute('value') ?? ''
    this.area?.addEventListener('input', () => {
      this.grow()
      this.sync()
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    })
    this.area?.addEventListener('change', () =>
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true })),
    )
    this.grow()
    this.sync()
  }

  override focus(): void {
    this.area?.focus()
  }

  private grow(): void {
    const area = this.area
    if (!area) return
    area.style.height = 'auto'
    if (area.scrollHeight) area.style.height = `${area.scrollHeight + 2}px`
  }

  private sync(): void {
    const counter = this.root.querySelector('.counter')
    const max = Number(this.getAttribute('maxlength') ?? 0)
    if (counter && max) {
      counter.textContent = `${this.value.length} / ${max}`
      counter.classList.toggle('over', this.value.length >= max)
    }
    this.internals?.setFormValue(this.value)
  }
}

register('aurora-textarea', AuroraTextarea)
