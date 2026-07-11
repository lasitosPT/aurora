import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const PANEL_STYLE = `:host { display: none; } :host([active]) { display: block; }`

/** `<aurora-tab-panel label="...">` — one tab's content; used inside `<aurora-tabs>`. */
export class AuroraTabPanel extends AuroraElement {
  connectedCallback(): void {
    this.root.innerHTML = `<style>${PANEL_STYLE}</style><slot></slot>`
    this.setAttribute('role', 'tabpanel')
  }
}

register('aurora-tab-panel', AuroraTabPanel)

const TABS_STYLE = `
  :host { display: block; }
  .tablist {
    position: relative;
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.25));
  }
  .tab {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    padding: 0.75rem 1rem;
    font: inherit;
    font-weight: 600;
    color: var(--aurora-muted, #888);
    transition: color 0.2s ease;
  }
  .tab[aria-selected='true'] { color: var(--aurora-fg, inherit); }
  .tab:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: -2px; }
  .indicator {
    position: absolute;
    bottom: -1px;
    left: 0;
    height: 2px;
    width: 0;
    background: var(--aurora-accent, #6d5cff);
  }
  .panels { padding-top: 1rem; }
`

/**
 * `<aurora-tabs active="0">` — wraps `<aurora-tab-panel>` children and renders a
 * tab bar with an animated active indicator. Emits `aurora-tab-change`.
 */
export class AuroraTabs extends AuroraElement {
  private panels: HTMLElement[] = []
  private tabs: HTMLElement[] = []
  private indicator: HTMLElement | null = null

  connectedCallback(): void {
    this.panels = Array.from(this.querySelectorAll<HTMLElement>(':scope > aurora-tab-panel'))
    const labels = this.panels.map((panel) => panel.getAttribute('label') ?? '')
    this.root.innerHTML = `<style>${TABS_STYLE}</style><div class="tablist" role="tablist" part="tablist">${labels
      .map(
        (label, i) =>
          `<button class="tab" role="tab" data-index="${i}">${escapeHtml(label)}</button>`,
      )
      .join(
        '',
      )}<span class="indicator" part="indicator"></span></div><div class="panels"><slot></slot></div>`

    this.tabs = Array.from(this.root.querySelectorAll<HTMLElement>('.tab'))
    this.indicator = this.root.querySelector('.indicator')
    this.tabs.forEach((tab, i) => tab.addEventListener('click', () => this.select(i)))
    this.select(this.numberAttr('active', 0))
  }

  select(index: number): void {
    if (index < 0 || index >= this.panels.length) return
    this.panels.forEach((panel, i) => {
      if (i === index) panel.setAttribute('active', '')
      else panel.removeAttribute('active')
    })
    this.tabs.forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)))
    this.moveIndicator(index)
    this.dispatchEvent(new CustomEvent('aurora-tab-change', { detail: { index } }))
  }

  private moveIndicator(index: number): void {
    const tab = this.tabs[index]
    if (!this.indicator || !tab) return
    const config = { x: tab.offsetLeft, width: tab.offsetWidth }
    if (prefersReducedMotion()) {
      gsap.set(this.indicator, config)
      return
    }
    gsap.to(this.indicator, { ...config, duration: 0.3, ease: 'power2.out' })
  }
}

register('aurora-tabs', AuroraTabs)
