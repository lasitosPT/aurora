import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; }
  .main {
    all: unset; cursor: pointer; width: 54px; height: 54px; border-radius: 50%;
    display: grid; place-items: center; font-size: 1.35rem; color: #fff;
    background: var(--aurora-accent, #6d5cff);
    box-shadow: 0 10px 30px color-mix(in srgb, var(--aurora-accent, #6d5cff) 45%, transparent);
    transition: transform 0.25s ease, background 0.15s ease;
  }
  .main:hover { background: var(--aurora-accent-hover, #5a49e0); }
  .main:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: 3px; }
  :host([open]) .main { transform: rotate(45deg); }
  .dial {
    position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column-reverse; gap: 10px; align-items: center;
  }
  .act {
    all: unset; cursor: pointer; width: 42px; height: 42px; border-radius: 50%;
    display: none; place-items: center; font-size: 1.05rem;
    background: var(--aurora-surface, #1d1d2b); color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4); position: relative;
  }
  :host([open]) .act { display: grid; }
  .act:hover { border-color: var(--aurora-accent, #6d5cff); }
  .act:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .act::after {
    content: attr(data-label); position: absolute; right: calc(100% + 10px); top: 50%;
    transform: translateY(-50%); white-space: nowrap; font-size: 0.78rem;
    background: var(--aurora-surface, #16161f); padding: 4px 10px; border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    opacity: 0; pointer-events: none; transition: opacity 0.15s ease;
  }
  .act:hover::after, .act:focus-visible::after { opacity: 1; }
`

/**
 * `<aurora-fab icon="+">` — a floating action button. With `<option>`
 * children it becomes a speed dial: the + rotates to ×, actions spring out
 * with labels, and picking one emits `aurora-select`. Without children a
 * click emits `aurora-click`.
 */
export class AuroraFab extends AuroraElement {
  connectedCallback(): void {
    const icon = this.getAttribute('icon') ?? '+'
    const opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
      icon: o.getAttribute('icon') ?? '•',
    }))
    this.root.innerHTML = `<style>${STYLE}</style><div class="dial" part="dial">${opts
      .map(
        (o) =>
          `<button class="act" data-v="${escapeHtml(o.value)}" data-label="${escapeHtml(o.label)}" aria-label="${escapeHtml(o.label)}">${escapeHtml(o.icon)}</button>`,
      )
      .join('')}</div><button class="main" part="button" aria-label="${escapeHtml(
      this.getAttribute('label') ?? 'Actions',
    )}"${opts.length ? ' aria-haspopup="menu" aria-expanded="false"' : ''}>${escapeHtml(icon)}</button>`
    const main = this.root.querySelector<HTMLButtonElement>('.main')
    main?.addEventListener('click', () => {
      if (!opts.length) {
        this.dispatchEvent(new CustomEvent('aurora-click'))
        return
      }
      if (this.hasAttribute('open')) this.close()
      else this.open()
    })
    this.root.querySelectorAll<HTMLButtonElement>('.act').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.close()
        this.dispatchEvent(
          new CustomEvent('aurora-select', { detail: { value: btn.dataset['v'] } }),
        )
      }),
    )
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) this.close()
    })
  }

  open(): void {
    this.setAttribute('open', '')
    this.root.querySelector('.main')?.setAttribute('aria-expanded', 'true')
    if (!prefersReducedMotion()) {
      const acts = this.root.querySelectorAll('.act')
      if (acts.length)
        gsap.fromTo(
          acts,
          { opacity: 0, y: 14, scale: 0.6 },
          { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.05, ease: 'back.out(2)' },
        )
    }
  }

  close(): void {
    this.removeAttribute('open')
    this.root.querySelector('.main')?.setAttribute('aria-expanded', 'false')
  }
}

register('aurora-fab', AuroraFab)
