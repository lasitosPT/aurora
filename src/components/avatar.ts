import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; }
  .av {
    width: var(--aurora-avatar-size, 44px); height: var(--aurora-avatar-size, 44px);
    border-radius: 50%; overflow: hidden; display: grid; place-items: center;
    color: #fff; font-weight: 700; font-size: calc(var(--aurora-avatar-size, 44px) * 0.38);
    background: linear-gradient(135deg, hsl(var(--hue, 265) 70% 52%), hsl(calc(var(--hue, 265) + 40) 70% 42%));
    user-select: none;
  }
  :host([square]) .av { border-radius: 12px; }
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .dot {
    position: absolute; right: 0; bottom: 0; width: 27%; height: 27%; border-radius: 50%;
    border: 2px solid var(--aurora-bg, #0b0b12); box-sizing: border-box;
  }
  .dot.online { background: #34d399; }
  .dot.away { background: #fbbf24; }
  .dot.busy { background: #f43f5e; }
  .dot.offline { background: #6b7280; }
`

/**
 * `<aurora-avatar name="Ada Lovelace" src="…">` — an avatar with graceful
 * degradation: the image falls back to initials on a gradient derived
 * deterministically from the name. Optional `status` dot
 * (online/away/busy/offline), `square` shape, sized via
 * `--aurora-avatar-size`.
 */
export class AuroraAvatar extends AuroraElement {
  connectedCallback(): void {
    const name = this.getAttribute('name') ?? ''
    const src = this.getAttribute('src')
    const status = this.getAttribute('status')
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => (w[0] ?? '').toUpperCase())
      .join('')
    let hash = 0
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360
    this.root.innerHTML = `<style>${STYLE}</style><div class="av" part="avatar" style="--hue:${hash}">${
      src ? `<img src="${escapeHtml(src)}" alt="" />` : escapeHtml(initials)
    }</div>${status ? `<span class="dot ${escapeHtml(status)}" part="dot"></span>` : ''}`
    this.setAttribute('role', 'img')
    if (!this.hasAttribute('aria-label'))
      this.setAttribute('aria-label', status ? `${name} (${status})` : name)
    this.root.querySelector('img')?.addEventListener('error', () => {
      const av = this.root.querySelector('.av')
      if (av) av.innerHTML = escapeHtml(initials)
    })
  }
}

register('aurora-avatar', AuroraAvatar)
