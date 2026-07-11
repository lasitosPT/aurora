import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; }
  .shine {
    background: linear-gradient(
      110deg,
      var(--aurora-shine-color, #ecebf3) 42%,
      var(--aurora-shine-highlight, #ffffff) 50%,
      var(--aurora-shine-color, #ecebf3) 58%
    );
    background-size: 220% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: aurora-shine linear infinite;
  }
  @keyframes aurora-shine {
    from { background-position: 120% 0; }
    to { background-position: -120% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .shine { animation: none; }
  }
`

/**
 * `<aurora-shine>` — a soft highlight sweeps across its text on a loop.
 * Attribute: `speed` (seconds per sweep, default 3). Theme with
 * `--aurora-shine-color` / `--aurora-shine-highlight`.
 */
export class AuroraShine extends AuroraElement {
  connectedCallback(): void {
    const text = escapeHtml((this.textContent ?? '').trim())
    this.root.innerHTML = `<style>${STYLE}</style><span class="shine" part="text">${text}</span>`
    const shine = this.root.querySelector<HTMLElement>('.shine')
    if (shine) shine.style.animationDuration = `${Math.max(this.numberAttr('speed', 3), 0.3)}s`
  }
}

register('aurora-shine', AuroraShine)
