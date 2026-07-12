import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; font-size: 0.92rem; }
  ol { list-style: none; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; padding: 0; }
  li { display: flex; align-items: center; gap: 8px; }
  a { color: var(--aurora-muted, #9a98b3); text-decoration: none; border-radius: 6px; padding: 2px 4px; transition: color 0.15s ease; }
  a:hover { color: var(--aurora-accent, #6d5cff); }
  a:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .sep { color: var(--aurora-muted, #9a98b3); opacity: 0.5; }
  .current { color: var(--aurora-fg, #ececf2); font-weight: 600; padding: 2px 4px; }
`

export interface Crumb {
  label: string
  href?: string
}

/**
 * `<aurora-breadcrumb separator="/">` — a breadcrumb trail. Assign `items`
 * (`{ label, href? }[]`); the last item renders as the current page
 * (`aria-current="page"`). Emits `aurora-select` when a crumb without an href
 * is clicked.
 */
export class AuroraBreadcrumb extends AuroraElement {
  #items: Crumb[] = []

  get items(): Crumb[] {
    return this.#items
  }

  set items(v: Crumb[]) {
    this.#items = v ?? []
    this.render()
  }

  connectedCallback(): void {
    this.setAttribute('role', 'navigation')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Breadcrumb')
    this.render()
  }

  private render(): void {
    const sep = escapeHtml(this.getAttribute('separator') ?? '›')
    this.root.innerHTML =
      `<style>${STYLE}</style><ol>` +
      this.#items
        .map((c, i) => {
          const last = i === this.#items.length - 1
          const inner = last
            ? `<span class="current" aria-current="page">${escapeHtml(c.label)}</span>`
            : `<a href="${escapeHtml(c.href ?? '#')}" data-i="${i}">${escapeHtml(c.label)}</a>`
          return `<li>${inner}${last ? '' : `<span class="sep" aria-hidden="true">${sep}</span>`}</li>`
        })
        .join('') +
      '</ol>'
    this.root.querySelectorAll<HTMLAnchorElement>('a').forEach((a) => {
      a.addEventListener('click', (e) => {
        const crumb = this.#items[Number(a.dataset.i)]
        if (crumb && !crumb.href) {
          e.preventDefault()
          this.dispatchEvent(
            new CustomEvent('aurora-select', {
              detail: { label: crumb.label, index: Number(a.dataset.i) },
            }),
          )
        }
      })
    })
  }
}

register('aurora-breadcrumb', AuroraBreadcrumb)
