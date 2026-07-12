import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center;
    gap: 7px; padding: 0.38rem 0.9rem; font-size: 0.88em; border-radius: 999px;
    color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255,255,255,0.16));
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .chip:hover { border-color: var(--aurora-accent, #6d5cff); }
  .chip:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: 2px; }
  .chip[aria-pressed='true'] {
    background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 20%, transparent);
    border-color: var(--aurora-accent, #6d5cff);
  }
  .x { opacity: 0.6; }
  .x:hover { opacity: 1; }
`

/**
 * `<aurora-chips selectable="multiple">` — a chip list. Chips come from child
 * `<option value>` elements or the `options` property; `selectable`
 * (`single`|`multiple`) toggles selection with a pop, `removable` adds ✕
 * buttons. `values` getter. Emits `aurora-change` with `{ values }` and
 * `aurora-remove` with `{ value }`.
 */
export class AuroraChips extends AuroraElement {
  private opts: { value: string; label: string }[] = []
  private picked = new Set<string>()

  get options(): { value: string; label: string }[] {
    return this.opts
  }

  set options(v: { value: string; label: string }[]) {
    this.opts = v ?? []
    this.render()
  }

  get values(): string[] {
    return [...this.picked]
  }

  connectedCallback(): void {
    this.opts = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value') ?? o.textContent?.trim() ?? '',
      label: o.textContent?.trim() ?? '',
    }))
    this.render()
  }

  private render(): void {
    const selectable = this.getAttribute('selectable')
    const removable = this.hasAttribute('removable')
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      this.opts
        .map(
          (o) =>
            `<button class="chip" data-v="${escapeHtml(o.value)}"${selectable ? ` aria-pressed="${this.picked.has(o.value)}"` : ''}>${escapeHtml(o.label)}${removable ? `<span class="x" data-x aria-hidden="true">✕</span>` : ''}</button>`,
        )
        .join('')
    this.root.querySelectorAll<HTMLButtonElement>('.chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const value = chip.dataset.v ?? ''
        if ((e.target as HTMLElement).hasAttribute('data-x')) {
          this.opts = this.opts.filter((o) => o.value !== value)
          this.picked.delete(value)
          this.render()
          this.dispatchEvent(new CustomEvent('aurora-remove', { detail: { value } }))
          return
        }
        if (!selectable) return
        if (selectable === 'single') {
          this.picked.clear()
          this.picked.add(value)
        } else if (this.picked.has(value)) this.picked.delete(value)
        else this.picked.add(value)
        this.render()
        const el = this.root.querySelector(`[data-v="${value}"]`)
        if (el && !prefersReducedMotion()) {
          gsap.fromTo(
            el,
            { scale: 1 },
            { scale: 1.1, duration: 0.13, yoyo: true, repeat: 1, ease: 'power2.out' },
          )
        }
        this.dispatchEvent(new CustomEvent('aurora-change', { detail: { values: this.values } }))
      })
    })
  }
}

register('aurora-chips', AuroraChips)
