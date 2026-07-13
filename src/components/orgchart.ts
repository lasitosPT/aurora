import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import './avatar'

export interface OrgNode {
  name: string
  title?: string
  color?: string
  collapsed?: boolean
  children?: OrgNode[]
}

const STYLE = `
  :host { display: block; overflow-x: auto; color: var(--aurora-fg, #ececf2); padding: 6px 2px; }
  ul { display: flex; justify-content: center; padding: 0; margin: 0; list-style: none; }
  li { display: flex; flex-direction: column; align-items: center; padding: 26px 10px 0; position: relative; }
  /* connectors */
  li::before {
    content: ''; position: absolute; top: 0; left: 50%; width: 1.5px; height: 26px;
    background: var(--aurora-border, rgba(255, 255, 255, 0.18));
  }
  ul.root > li::before { display: none; }
  li::after {
    content: ''; position: absolute; top: 0; height: 1.5px;
    background: var(--aurora-border, rgba(255, 255, 255, 0.18));
    left: 0; right: 0;
  }
  li:first-child::after { left: 50%; }
  li:last-child::after { right: 50%; }
  li:only-child::after { display: none; }
  ul.root > li::after { display: none; }
  .card {
    display: flex; align-items: center; gap: 10px; padding: 9px 14px; cursor: pointer;
    background: var(--aurora-surface, #14141f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.13));
    border-radius: 12px; min-width: 132px; position: relative; z-index: 1;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .card:hover { border-color: var(--aurora-accent, #6d5cff); transform: translateY(-1px); }
  .card:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .card.selected { border-color: var(--aurora-accent, #6d5cff); background: rgba(109, 92, 255, 0.09); }
  .who { display: flex; flex-direction: column; }
  .who b { font-size: 0.86rem; }
  .who span { font-size: 0.72rem; color: var(--aurora-muted, #9a98b3); }
  .kids {
    all: unset; cursor: pointer; width: 18px; height: 18px; border-radius: 50%;
    display: grid; place-items: center; font-size: 0.6rem; flex: none;
    color: var(--aurora-muted, #9a98b3);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.2));
  }
  .kids:hover { color: var(--aurora-fg, #ececf2); border-color: var(--aurora-accent, #6d5cff); }
`

/**
 * `<aurora-orgchart>` — an organization chart. Assign nested `nodes`
 * (`{ name, title?, color?, collapsed?, children? }`); cards compose
 * `aurora-avatar` initials, CSS connectors draw the reporting lines, and
 * branches collapse from the count pill. Emits `aurora-select` with the
 * clicked person.
 */
export class AuroraOrgchart extends AuroraElement {
  #nodes: OrgNode[] = []
  private selected: string | null = null

  get nodes(): OrgNode[] {
    return this.#nodes
  }

  set nodes(v: OrgNode[]) {
    this.#nodes = v ?? []
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  private branch(nodes: OrgNode[], root = false): string {
    return `<ul class="${root ? 'root' : ''}">${nodes
      .map((n) => {
        const kids = n.children?.length ?? 0
        return `<li><div class="card${this.selected === n.name ? ' selected' : ''}" tabindex="0" role="button" data-n="${escapeHtml(n.name)}"><aurora-avatar name="${escapeHtml(n.name)}" style="--aurora-avatar-size:32px${n.color ? `;--aurora-timeline-dot:${n.color}` : ''}"></aurora-avatar><span class="who"><b>${escapeHtml(n.name)}</b>${
          n.title ? `<span>${escapeHtml(n.title)}</span>` : ''
        }</span>${
          kids
            ? `<button class="kids" data-k="${escapeHtml(n.name)}" aria-label="${n.collapsed ? 'Expand' : 'Collapse'} reports" aria-expanded="${!n.collapsed}">${n.collapsed ? `+${kids}` : '–'}</button>`
            : ''
        }</div>${kids && !n.collapsed ? this.branch(n.children ?? []) : ''}</li>`
      })
      .join('')}</ul>`
  }

  private findNode(nodes: OrgNode[], name: string): OrgNode | null {
    for (const n of nodes) {
      if (n.name === name) return n
      const hit = this.findNode(n.children ?? [], name)
      if (hit) return hit
    }
    return null
  }

  private render(): void {
    this.root.innerHTML = `<style>${STYLE}</style>${this.branch(this.#nodes, true)}`
    this.root.querySelectorAll<HTMLButtonElement>('.kids').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const node = this.findNode(this.#nodes, btn.dataset['k'] ?? '')
        if (!node) return
        node.collapsed = !node.collapsed
        this.render()
        this.dispatchEvent(
          new CustomEvent('aurora-toggle', {
            detail: { name: node.name, collapsed: node.collapsed },
          }),
        )
      }),
    )
    this.root.querySelectorAll<HTMLElement>('.card').forEach((card) => {
      const pick = (): void => {
        const node = this.findNode(this.#nodes, card.dataset['n'] ?? '')
        if (!node) return
        this.selected = node.name
        this.root
          .querySelectorAll('.card')
          .forEach((c) => c.classList.toggle('selected', c === card))
        this.dispatchEvent(new CustomEvent('aurora-select', { detail: { node } }))
      }
      card.addEventListener('click', pick)
      card.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') pick()
      })
    })
    if (!prefersReducedMotion()) {
      const cards = this.root.querySelectorAll('.card')
      if (cards.length)
        gsap.fromTo(
          cards,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.04,
            ease: 'power2.out',
            clearProps: 'all',
          },
        )
    }
  }
}

register('aurora-orgchart', AuroraOrgchart)
