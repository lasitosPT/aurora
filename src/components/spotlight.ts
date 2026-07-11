import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; position: relative; }
  .glow,
  .beam {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.35s ease;
    pointer-events: none;
  }
  .glow {
    background: radial-gradient(
      var(--aurora-spotlight-size, 340px) circle at var(--mx, 50%) var(--my, 50%),
      var(--aurora-spotlight-color, rgba(109, 92, 255, 0.09)),
      transparent 65%
    );
  }
  .beam {
    padding: 1px;
    background: radial-gradient(
      var(--aurora-spotlight-beam-size, 220px) circle at var(--mx, 50%) var(--my, 50%),
      var(--aurora-spotlight-beam, rgba(169, 155, 255, 0.85)),
      var(--aurora-spotlight-beam2, rgba(34, 211, 238, 0.25)) 55%,
      transparent 75%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
  :host(:hover) .glow,
  :host(:hover) .beam {
    opacity: 1;
  }
`

/**
 * `<aurora-spotlight>` — wraps content in a card whose interior glow and 1px
 * border beam follow the cursor (the treatment on auroralib.com's feature
 * grid). Style the host like any card — the layers inherit its border-radius.
 * Theme with `--aurora-spotlight-size` / `-color` / `-beam` / `-beam2`.
 */
export class AuroraSpotlight extends AuroraElement {
  private onMove: ((event: PointerEvent) => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="glow" part="glow"></div><div class="beam" part="beam"></div><slot></slot>`
    this.onMove = (event: PointerEvent): void => {
      const rect = this.getBoundingClientRect()
      this.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      this.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }
    this.addEventListener('pointermove', this.onMove, { passive: true })
  }

  disconnectedCallback(): void {
    if (this.onMove) this.removeEventListener('pointermove', this.onMove)
  }
}

register('aurora-spotlight', AuroraSpotlight)
