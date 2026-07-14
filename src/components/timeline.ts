import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const ITEM_STYLE = `
  :host { display: block; position: relative; padding: 0 0 34px 34px; }
  .dot {
    position: absolute; inset-inline-start: 0; top: 3px; width: 15px; height: 15px; border-radius: 50%;
    background: var(--aurora-timeline-dot, var(--aurora-accent, #6d5cff));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--aurora-timeline-dot, var(--aurora-accent, #6d5cff)) 22%, transparent);
  }
  .date {
    font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); font-variant-numeric: tabular-nums;
  }
  .card {
    margin-top: 6px; padding: 14px 18px; border-radius: 13px;
    background: var(--aurora-surface, rgba(255, 255, 255, 0.035));
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
  }
  h4 { margin: 0 0 4px; font-size: 1rem; color: var(--aurora-fg, #ececf2); }
  .body { color: var(--aurora-muted, #9a98b3); font-size: 0.92rem; line-height: 1.55; }
  :host(:last-child) { padding-bottom: 4px; }
`

/**
 * `<aurora-timeline-item date="…" heading="…">` — one milestone; body content
 * is slotted. `color` tints the dot.
 */
export class AuroraTimelineItem extends AuroraElement {
  connectedCallback(): void {
    const date = this.getAttribute('date') ?? ''
    const heading = this.getAttribute('heading') ?? ''
    const color = this.getAttribute('color')
    if (color) this.style.setProperty('--aurora-timeline-dot', color)
    this.root.innerHTML = `<style>${ITEM_STYLE}</style><span class="dot" part="dot"></span><div class="wrap">${
      date ? `<div class="date" part="date">${escapeHtml(date)}</div>` : ''
    }<div class="card" part="card">${
      heading ? `<h4 part="heading">${escapeHtml(heading)}</h4>` : ''
    }<div class="body"><slot></slot></div></div></div>`
  }
}

register('aurora-timeline-item', AuroraTimelineItem)

const STYLE = `
  :host { display: block; position: relative; padding-inline-start: 7px; }
  .line {
    position: absolute; inset-inline-start: 7px; top: 6px; bottom: 6px; width: 1.5px;
    background: linear-gradient(
      to bottom,
      var(--aurora-accent, #6d5cff),
      var(--aurora-border, rgba(255, 255, 255, 0.12)) 60%
    );
    transform-origin: top;
  }
  ::slotted(aurora-timeline-item) { position: relative; }
`

/**
 * `<aurora-timeline>` — a vertical milestone timeline. Wraps
 * `<aurora-timeline-item>` children with a gradient spine; the line draws and
 * items slide in as they scroll into view.
 */
export class AuroraTimeline extends AuroraElement {
  private cleanups: (() => void)[] = []

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="line" part="line"></div><slot></slot>`
    this.setAttribute('role', 'list')
    const items = Array.from(this.querySelectorAll<HTMLElement>(':scope > aurora-timeline-item'))
    items.forEach((item) => item.setAttribute('role', 'listitem'))
    if (prefersReducedMotion()) return
    const line = this.root.querySelector('.line')
    if (line)
      this.cleanups.push(
        whenVisible(this, () => {
          gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: 'power2.out' })
        }),
      )
    for (const item of items) {
      const inner = item.shadowRoot?.querySelector('.wrap')
      const dot = item.shadowRoot?.querySelector('.dot')
      if (!inner) continue
      this.cleanups.push(
        whenVisible(item, () => {
          gsap.fromTo(
            inner,
            { opacity: 0, x: 22 },
            { opacity: 1, x: 0, duration: 0.65, ease: 'power3.out' },
          )
          if (dot)
            gsap.fromTo(
              dot,
              { scale: 0 },
              { scale: 1, duration: 0.45, ease: 'back.out(2.5)', delay: 0.1 },
            )
        }),
      )
    }
  }

  disconnectedCallback(): void {
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []
  }
}

register('aurora-timeline', AuroraTimeline)
