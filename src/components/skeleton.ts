import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; }
  .bone {
    position: relative;
    overflow: hidden;
    height: 100%;
    min-height: 1em;
    border-radius: var(--aurora-skeleton-radius, 8px);
    background: var(--aurora-skeleton-base, rgba(255, 255, 255, 0.07));
  }
  :host([circle]) .bone { border-radius: 50%; }
  .bone.line {
    height: 0.9em;
    min-height: 0;
    margin: 0.5em 0;
  }
  .bone.line:first-child { margin-top: 0; }
  .bone.line:last-child { width: 60%; margin-bottom: 0; }
  .bone::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      var(--aurora-skeleton-shine, rgba(255, 255, 255, 0.09)),
      transparent
    );
    animation: aurora-shimmer 1.6s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .bone::after { animation: none; }
  }
  @keyframes aurora-shimmer {
    100% { transform: translateX(100%); }
  }
`

/**
 * `<aurora-skeleton>` — a shimmering loading placeholder. Size the host for a
 * block, add `circle` for an avatar, or `lines="3"` for a paragraph (the last
 * line is short). Theme with `--aurora-skeleton-base/-shine/-radius`.
 */
export class AuroraSkeleton extends AuroraElement {
  connectedCallback(): void {
    const lines = this.numberAttr('lines', 0)
    const bones =
      lines > 0
        ? Array.from({ length: lines }, () => '<div class="bone line"></div>').join('')
        : '<div class="bone"></div>'
    this.root.innerHTML = `<style>${STYLE}</style>${bones}`
    this.setAttribute('aria-hidden', 'true')
  }
}

register('aurora-skeleton', AuroraSkeleton)
