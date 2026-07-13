import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: flex; justify-content: space-around; align-items: stretch;
    background: color-mix(in srgb, var(--aurora-surface, #14141f) 92%, transparent);
    backdrop-filter: blur(12px);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; padding: 6px; color: var(--aurora-muted, #9a98b3);
  }
  button {
    all: unset; cursor: pointer; flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 3px; padding: 7px 4px; border-radius: 11px;
    font-size: 0.68rem; letter-spacing: 0.02em; position: relative;
    transition: color 0.15s ease;
  }
  button .ico { font-size: 1.15rem; line-height: 1; }
  button:hover { color: var(--aurora-fg, #ececf2); }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  button[aria-selected='true'] {
    color: var(--aurora-fg, #ececf2);
    background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 16%, transparent);
  }
  button[aria-selected='true'] .ico { color: var(--aurora-accent, #6d5cff); }
`

/**
 * `<aurora-bottomnav value="home">` — a bottom navigation bar from
 * `<option value icon>` children: one active item, icon pop on switch,
 * arrow-key movement. Emits `aurora-change` with `{ value }`.
 */
export class AuroraBottomnav extends AuroraElement {
  private current = ''

  get value(): string {
    return this.current
  }

  set value(v: string) {
    this.current = v
    this.sync()
  }

  connectedCallback(): void {
    const opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
      icon: o.getAttribute('icon') ?? '•',
    }))
    this.current = this.getAttribute('value') ?? opts[0]?.value ?? ''
    this.setAttribute('role', 'tablist')
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      opts
        .map(
          (o) =>
            `<button role="tab" data-v="${escapeHtml(o.value)}" aria-selected="false"><span class="ico" aria-hidden="true">${escapeHtml(o.icon)}</span>${escapeHtml(o.label)}</button>`,
        )
        .join('')
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
      btn.addEventListener('click', () => this.pick(btn.dataset['v'] ?? ''))
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const btns = Array.from(this.root.querySelectorAll<HTMLButtonElement>('button'))
        const idx = btns.indexOf(btn)
        const next = btns[(idx + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length]
        next?.focus()
        this.pick(next?.dataset['v'] ?? '')
      })
    })
    this.sync()
  }

  private pick(v: string): void {
    if (!v || v === this.current) return
    this.current = v
    this.sync()
    const ico = this.root.querySelector(`button[data-v="${CSS.escape(v)}"] .ico`)
    if (ico && !prefersReducedMotion())
      gsap.fromTo(
        ico,
        { scale: 0.7, y: 3 },
        { scale: 1, y: 0, duration: 0.3, ease: 'back.out(2.6)' },
      )
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: v } }))
  }

  private sync(): void {
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
      const on = btn.dataset['v'] === this.current
      btn.setAttribute('aria-selected', String(on))
      btn.tabIndex = on ? 0 : -1
    })
  }
}

register('aurora-bottomnav', AuroraBottomnav)
