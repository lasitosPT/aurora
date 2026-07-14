import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; align-items: center; gap: 5px; font-size: 0.88rem; color: var(--aurora-muted, #9a98b3); font-variant-numeric: tabular-nums; }
  button {
    all: unset; cursor: pointer; min-width: 30px; height: 30px; padding: 0 4px;
    display: inline-grid; place-items: center; border-radius: 8px; text-align: center;
    border: 1px solid transparent;
  }
  button:hover:not(:disabled) { border-color: var(--aurora-accent, #6d5cff); color: var(--aurora-fg, #ececf2); }
  button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  button[aria-current='page'] { background: var(--aurora-accent, #6d5cff); color: #fff; }
  button:disabled { opacity: 0.35; cursor: default; }
  .dots { padding: 0 3px; }
`

/**
 * `<aurora-pager total="240" page-size="20">` — standalone pagination with
 * windowed page numbers and ellipses. `page` is 1-based; emits `aurora-page`
 * with `{ page }`.
 */
export class AuroraPager extends AuroraElement {
  static readonly observedAttributes = ['page', 'total', 'page-size']
  private ready = false

  get page(): number {
    return Math.max(this.numberAttr('page', 1), 1)
  }

  set page(v: number) {
    this.setAttribute('page', String(v))
  }

  get pages(): number {
    return Math.max(
      Math.ceil(this.numberAttr('total', 0) / Math.max(this.numberAttr('page-size', 10), 1)),
      1,
    )
  }

  connectedCallback(): void {
    this.render()
    this.ready = true
  }

  attributeChangedCallback(): void {
    if (this.ready) this.render()
  }

  private window(): (number | '…')[] {
    const pages = this.pages
    const page = Math.min(this.page, pages)
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
    const out: (number | '…')[] = [1]
    if (page > 3) out.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p++) out.push(p)
    if (page < pages - 2) out.push('…')
    out.push(pages)
    return out
  }

  private render(): void {
    const page = Math.min(this.page, this.pages)
    this.setAttribute('role', 'navigation')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Pagination')
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      `<button data-p="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>` +
      this.window()
        .map((p) =>
          p === '…'
            ? '<span class="dots">…</span>'
            : `<button data-p="${p}" ${p === page ? 'aria-current="page"' : ''}>${p}</button>`,
        )
        .join('') +
      `<button data-p="${page + 1}" ${page >= this.pages ? 'disabled' : ''} aria-label="Next page">›</button>`
    this.root.querySelectorAll<HTMLButtonElement>('button[data-p]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const next = Number(btn.dataset['p'])
        if (next < 1 || next > this.pages || next === this.page) return
        this.page = next
        this.dispatchEvent(new CustomEvent('aurora-page', { detail: { page: next } }))
      }),
    )
  }
}

register('aurora-pager', AuroraPager)
