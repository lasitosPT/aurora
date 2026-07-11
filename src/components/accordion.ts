import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; border-bottom: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.25)); }
  .header {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    cursor: pointer;
    padding: 1rem 0;
    font: inherit;
    font-weight: 600;
  }
  .header:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .icon { transition: transform 0.3s ease; font-weight: 400; }
  :host([open]) .icon { transform: rotate(45deg); }
  .content { overflow: hidden; height: 0; }
  .inner { padding-bottom: 1rem; }
`

/**
 * `<aurora-accordion label="...">` — a collapsible panel with animated height.
 * Stack several for an accordion group. Toggle with the header, or `show()` / `hide()`.
 */
export class AuroraAccordion extends AuroraElement {
  private content: HTMLElement | null = null
  private inner: HTMLElement | null = null

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    const open = this.hasAttribute('open')
    this.root.innerHTML = `<style>${STYLE}</style><button class="header" part="header" aria-expanded="${open}"><span><slot name="header">${escapeHtml(label)}</slot></span><span class="icon" aria-hidden="true">+</span></button><div class="content" part="content"><div class="inner"><slot></slot></div></div>`
    this.content = this.root.querySelector('.content')
    this.inner = this.root.querySelector('.inner')
    this.root.querySelector('.header')?.addEventListener('click', this.toggle)
    if (open && this.content) this.content.style.height = 'auto'
  }

  private readonly toggle = (): void => {
    if (this.hasAttribute('open')) this.hide()
    else this.show()
  }

  show(): void {
    this.setAttribute('open', '')
    this.setExpanded(true)
    this.animateHeight(true)
  }

  hide(): void {
    this.removeAttribute('open')
    this.setExpanded(false)
    this.animateHeight(false)
  }

  private setExpanded(open: boolean): void {
    this.root.querySelector('.header')?.setAttribute('aria-expanded', String(open))
  }

  private animateHeight(open: boolean): void {
    if (!this.content || !this.inner) return
    if (prefersReducedMotion()) {
      this.content.style.height = open ? 'auto' : '0'
      return
    }
    gsap.killTweensOf(this.content)
    if (open) {
      gsap.fromTo(
        this.content,
        { height: 0 },
        {
          height: this.inner.offsetHeight,
          duration: 0.35,
          ease: 'power2.out',
          onComplete: () => {
            if (this.content) this.content.style.height = 'auto'
          },
        },
      )
    } else {
      gsap.fromTo(
        this.content,
        { height: this.content.offsetHeight },
        { height: 0, duration: 0.3, ease: 'power2.in' },
      )
    }
  }
}

register('aurora-accordion', AuroraAccordion)
