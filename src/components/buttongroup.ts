import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; border: 1px solid var(--aurora-border, rgba(128,128,128,0.4));
    border-radius: var(--aurora-radius, 0.6rem); overflow: hidden; }
  button {
    all: unset; box-sizing: border-box; cursor: pointer; padding: 0.55rem 1.05rem; font: inherit;
    color: var(--aurora-muted, #9a98b3); transition: background 0.15s ease, color 0.15s ease;
    border-left: 1px solid var(--aurora-border, rgba(128,128,128,0.25));
  }
  button:first-of-type { border-left: none; }
  button:hover { color: var(--aurora-fg, #ececf2); }
  button[aria-pressed='true'] {
    background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 22%, transparent);
    color: var(--aurora-fg, #ececf2);
  }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px; }
`

/**
 * `<aurora-buttongroup value="week">` — a segmented control. Options come from
 * child `<option value>` elements; one segment is active at a time (pop on
 * change). Emits `aurora-change` with `{ value }`.
 */
export class AuroraButtongroup extends AuroraElement {
  private opts: { value: string; label: string }[] = []
  private current = ''

  get value(): string {
    return this.current
  }

  set value(v: string) {
    this.current = v
    this.paint()
  }

  connectedCallback(): void {
    this.opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
    }))
    this.current = this.getAttribute('value') ?? this.opts[0]?.value ?? ''
    this.setAttribute('role', 'group')
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      this.opts
        .map((o) => `<button data-v="${escapeHtml(o.value)}">${escapeHtml(o.label)}</button>`)
        .join('')
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.v === this.current) return
        this.current = b.dataset.v ?? ''
        this.paint()
        if (!prefersReducedMotion()) {
          gsap.fromTo(
            b,
            { scale: 1 },
            { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' },
          )
        }
        this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.current } }))
      }),
    )
    this.paint()
  }

  private paint(): void {
    this.root
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === this.current)))
  }
}

register('aurora-buttongroup', AuroraButtongroup)
