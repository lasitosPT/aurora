import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-flex; flex-direction: column; align-items: center; gap: 10px; color: var(--aurora-fg, #ececf2); }
  .spin { width: var(--aurora-loader-size, 34px); height: var(--aurora-loader-size, 34px); position: relative; }
  .ring {
    width: 100%; height: 100%; border-radius: 50%;
    border: 3px solid color-mix(in srgb, var(--aurora-accent, #6d5cff) 20%, transparent);
    border-top-color: var(--aurora-accent, #6d5cff);
    animation: rot 0.9s linear infinite;
  }
  .dots { display: flex; gap: 6px; align-items: center; height: 100%; }
  .dots i {
    width: calc(var(--aurora-loader-size, 34px) * 0.22);
    height: calc(var(--aurora-loader-size, 34px) * 0.22);
    border-radius: 50%; background: var(--aurora-accent, #6d5cff);
    animation: pulse 1.1s ease-in-out infinite;
  }
  .dots i:nth-child(2) { animation-delay: 0.15s; }
  .dots i:nth-child(3) { animation-delay: 0.3s; }
  .pulse {
    width: 100%; height: 100%; border-radius: 50%;
    background: var(--aurora-accent, #6d5cff);
    animation: throb 1.1s ease-in-out infinite;
  }
  .label { font-size: 0.82rem; color: var(--aurora-muted, #9a98b3); }
  @keyframes rot { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { transform: scale(0.6); opacity: 0.4; } 50% { transform: scale(1); opacity: 1; } }
  @keyframes throb { 0%, 100% { transform: scale(0.65); opacity: 0.45; } 50% { transform: scale(1); opacity: 0.9; } }
  @media (prefers-reduced-motion: reduce) {
    .ring, .dots i, .pulse { animation-duration: 2.4s; }
  }
`

/**
 * `<aurora-loader type="ring|dots|pulse">` — an indeterminate spinner with an
 * optional `label`, sized via `--aurora-loader-size`, `role="status"`.
 */
export class AuroraLoader extends AuroraElement {
  connectedCallback(): void {
    const type = this.getAttribute('type') ?? 'ring'
    const label = this.getAttribute('label') ?? ''
    const body =
      type === 'dots'
        ? '<div class="dots"><i></i><i></i><i></i></div>'
        : type === 'pulse'
          ? '<div class="pulse"></div>'
          : '<div class="ring"></div>'
    this.root.innerHTML = `<style>${STYLE}</style><div class="spin" part="spinner">${body}</div>${
      label ? `<span class="label" part="label">${escapeHtml(label)}</span>` : ''
    }`
    this.setAttribute('role', 'status')
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', label || 'Loading')
  }
}

register('aurora-loader', AuroraLoader)
