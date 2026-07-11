import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; }
  button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    line-height: 1;
    padding: 0.75em 1.25em;
    border-radius: var(--aurora-radius, 0.6rem);
    transition: transform 0.15s ease, background-color 0.15s ease, opacity 0.15s ease;
    user-select: none;
  }
  button:focus-visible {
    outline: 2px solid var(--aurora-ring, var(--aurora-accent, #6d5cff));
    outline-offset: 2px;
  }
  button:active { transform: translateY(1px) scale(0.98); }

  button[data-variant='primary'] {
    background: var(--aurora-accent, #6d5cff);
    color: var(--aurora-on-accent, #fff);
  }
  button[data-variant='primary']:hover { background: var(--aurora-accent-hover, #5a49e0); }

  button[data-variant='ghost'] {
    background: transparent;
    color: var(--aurora-fg, currentColor);
    box-shadow: inset 0 0 0 1px var(--aurora-border, rgba(128, 128, 128, 0.35));
  }
  button[data-variant='ghost']:hover {
    background: var(--aurora-surface-hover, rgba(128, 128, 128, 0.12));
  }

  :host([disabled]) button { opacity: 0.5; pointer-events: none; }
`

/**
 * `<aurora-button>` — a themeable button.
 *
 * Attributes: `variant` = `primary` | `ghost`, `disabled`.
 */
export class AuroraButton extends AuroraElement {
  static readonly observedAttributes = ['variant']

  connectedCallback(): void {
    this.render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render()
  }

  private render(): void {
    const variant = this.getAttribute('variant') === 'ghost' ? 'ghost' : 'primary'
    this.root.innerHTML = `<style>${STYLE}</style><button part="button" data-variant="${variant}"><slot></slot></button>`
  }
}

register('aurora-button', AuroraButton)
