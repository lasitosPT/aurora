import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: contents; }
  .backdrop {
    position: fixed; inset: 0; background: rgba(6, 6, 12, 0.6); z-index: var(--aurora-modal-z, 80);
    display: none; backdrop-filter: blur(3px);
  }
  :host([open]) .backdrop { display: block; }
  .sheet {
    position: fixed; left: 50%; bottom: 0; transform: translateX(-50%);
    width: min(480px, calc(100vw - 24px)); z-index: calc(var(--aurora-modal-z, 80) + 1);
    display: none; flex-direction: column; gap: 5px; padding: 14px 14px 18px;
    background: var(--aurora-surface, #16161f); color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14)); border-bottom: none;
    border-radius: 18px 18px 0 0; box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.55);
  }
  :host([open]) .sheet { display: flex; }
  .grip { width: 40px; height: 4px; border-radius: 2px; background: var(--aurora-border, rgba(255,255,255,0.2)); margin: 0 auto 8px; }
  .title { text-align: center; font-size: 0.82rem; color: var(--aurora-muted, #9a98b3); padding-bottom: 6px; }
  .sheet button {
    all: unset; cursor: pointer; display: flex; align-items: center; gap: 12px;
    padding: 0.7rem 0.9rem; border-radius: 11px; font-size: 0.95rem;
  }
  .sheet button:hover, .sheet button:focus-visible { background: rgba(109, 92, 255, 0.14); }
  .sheet button.danger { color: var(--aurora-danger, #f43f5e); }
  .sheet button .ico { width: 1.3em; text-align: center; }
  .cancel { margin-top: 6px; justify-content: center; border: 1px solid var(--aurora-border, rgba(255,255,255,0.12)); }
`

/**
 * `<aurora-actionsheet>` — a bottom sheet of actions: `<option value icon>`
 * children (mark one `danger`), a grab handle, backdrop and Escape close, a
 * focus trap, and a slide-up entrance. `show()`/`hide()`; emits
 * `aurora-select` with the chosen value.
 */
export class AuroraActionsheet extends AuroraElement {
  private opener: HTMLElement | null = null

  connectedCallback(): void {
    const title = this.getAttribute('label') ?? ''
    const opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
      icon: o.getAttribute('icon') ?? '',
      danger: o.hasAttribute('danger'),
    }))
    this.root.innerHTML = `<style>${STYLE}</style><div class="backdrop" part="backdrop"></div>
      <div class="sheet" part="sheet" role="dialog" aria-modal="true"${title ? ` aria-label="${escapeHtml(title)}"` : ''}>
        <div class="grip" aria-hidden="true"></div>
        ${title ? `<div class="title">${escapeHtml(title)}</div>` : ''}
        ${opts
          .map(
            (o) =>
              `<button data-v="${escapeHtml(o.value)}" class="${o.danger ? 'danger' : ''}">${
                o.icon ? `<span class="ico">${escapeHtml(o.icon)}</span>` : ''
              }${escapeHtml(o.label)}</button>`,
          )
          .join('')}
        <button class="cancel">${escapeHtml(this.getAttribute('cancel-label') ?? 'Cancel')}</button>
      </div>`
    this.root.querySelector('.backdrop')?.addEventListener('click', () => this.hide())
    this.root.querySelector('.cancel')?.addEventListener('click', () => this.hide())
    this.root.querySelectorAll<HTMLButtonElement>('button[data-v]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.hide()
        this.dispatchEvent(
          new CustomEvent('aurora-select', { detail: { value: btn.dataset['v'] } }),
        )
      }),
    )
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) this.hide()
      else if (e.key === 'Tab' && this.hasAttribute('open')) this.trap(e)
    })
  }

  private trap(e: KeyboardEvent): void {
    const btns = Array.from(this.root.querySelectorAll<HTMLElement>('.sheet button'))
    const first = btns[0]
    const last = btns[btns.length - 1]
    if (!first || !last) return
    const active = this.root.activeElement
    if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    }
  }

  show(): void {
    this.opener = document.activeElement as HTMLElement | null
    this.setAttribute('open', '')
    const sheet = this.root.querySelector<HTMLElement>('.sheet')
    if (sheet) {
      sheet.querySelector<HTMLButtonElement>('button')?.focus()
      if (!prefersReducedMotion())
        gsap.fromTo(
          sheet,
          { y: 60, opacity: 0.4 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' },
        )
    }
    this.dispatchEvent(new CustomEvent('aurora-open'))
  }

  hide(): void {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.opener?.focus?.()
    this.dispatchEvent(new CustomEvent('aurora-close'))
  }
}

register('aurora-actionsheet', AuroraActionsheet)
