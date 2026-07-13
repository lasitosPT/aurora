import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp } from '../core/motion'
import { register } from '../core/register'

type Seg = 'dd' | 'mm' | 'yyyy'

const STYLE = `
  :host { display: inline-block; color: var(--aurora-fg, #ececf2); }
  .label {
    display: block; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--aurora-muted, #9a98b3); margin-bottom: 7px;
  }
  .field {
    display: inline-flex; align-items: center; gap: 2px; padding: 0.55rem 0.8rem;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 11px;
    font-variant-numeric: tabular-nums; transition: border-color 0.15s ease;
  }
  :host(:focus-within) .field { border-color: var(--aurora-accent, #6d5cff); }
  .seg {
    all: unset; cursor: text; padding: 1px 4px; border-radius: 5px; min-width: 2ch;
    text-align: center; color: var(--aurora-muted, #9a98b3);
  }
  .seg.filled { color: var(--aurora-fg, #ececf2); }
  .seg:focus { background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 30%, transparent); color: #fff; }
  .sep { opacity: 0.4; }
`

/**
 * `<aurora-dateinput>` — segmented date typing: dd / mm / yyyy cells that
 * accept digits with auto-advance, arrow up/down to increment, left/right to
 * move, and Backspace to clear. `value` is ISO; form-associated; emits
 * `aurora-change` once the date is complete and valid.
 */
export class AuroraDateinput extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private parts: Record<Seg, string> = { dd: '', mm: '', yyyy: '' }

  constructor() {
    super()
    if ('attachInternals' in this) {
      try {
        this.internals = this.attachInternals()
      } catch {
        this.internals = null
      }
    }
  }

  get value(): string | null {
    const { dd, mm, yyyy } = this.parts
    if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return null
    const iso = `${yyyy}-${mm}-${dd}`
    const d = new Date(`${iso}T00:00`)
    return Number.isNaN(d.getTime()) || d.getDate() !== Number(dd) ? null : iso
  }

  set value(iso: string | null) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
    if (!m) return
    this.parts = { yyyy: m[1] ?? '', mm: m[2] ?? '', dd: m[3] ?? '' }
    this.sync()
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label">${escapeHtml(label)}</label>` : ''
    }<div class="field" part="field" role="group" aria-label="${escapeHtml(label || 'Date')}">
      <span class="seg" data-s="dd" tabindex="0" role="spinbutton" aria-label="Day">dd</span><span class="sep">/</span>
      <span class="seg" data-s="mm" tabindex="0" role="spinbutton" aria-label="Month">mm</span><span class="sep">/</span>
      <span class="seg" data-s="yyyy" tabindex="0" role="spinbutton" aria-label="Year">yyyy</span>
    </div>`
    const initial = this.getAttribute('value')
    if (initial) this.value = initial
    this.root
      .querySelectorAll<HTMLElement>('.seg')
      .forEach((seg) =>
        seg.addEventListener('keydown', (e) => this.onKey(e, seg.dataset['s'] as Seg, seg)),
      )
    this.sync()
  }

  private limits(seg: Seg): { max: number; len: number } {
    return seg === 'dd'
      ? { max: 31, len: 2 }
      : seg === 'mm'
        ? { max: 12, len: 2 }
        : { max: 9999, len: 4 }
  }

  private onKey(e: KeyboardEvent, seg: Seg, el: HTMLElement): void {
    const { max, len } = this.limits(seg)
    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      let next = (this.parts[seg] + e.key).slice(-len)
      if (Number(next) > max) next = e.key.padStart(len === 4 ? 1 : 1, '')
      this.parts[seg] = next
      this.sync()
      if (next.length === len || (len === 2 && Number(next) > Math.floor(max / 10)))
        this.move(el, 1)
      this.commit()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (this.parts[seg]) this.parts[seg] = ''
      else this.move(el, -1)
      this.sync()
      this.commit()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const cur = Number(this.parts[seg] || (seg === 'yyyy' ? new Date().getFullYear() : 0))
      const min = seg === 'yyyy' ? 1 : 1
      const next = clamp(cur + (e.key === 'ArrowUp' ? 1 : -1), min, max)
      this.parts[seg] = String(next).padStart(len, '0')
      this.sync()
      this.commit()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.move(el, 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.move(el, -1)
    }
  }

  private move(from: HTMLElement, dir: number): void {
    const segs = Array.from(this.root.querySelectorAll<HTMLElement>('.seg'))
    const idx = segs.indexOf(from)
    segs[idx + dir]?.focus()
  }

  private commit(): void {
    const v = this.value
    this.internals?.setFormValue(v)
    if (v) this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: v } }))
  }

  private sync(): void {
    this.root.querySelectorAll<HTMLElement>('.seg').forEach((seg) => {
      const s = seg.dataset['s'] as Seg
      const filled = this.parts[s] !== ''
      seg.textContent = filled ? this.parts[s].padStart(this.limits(s).len, '0') : s
      seg.classList.toggle('filled', filled)
      seg.setAttribute('aria-valuenow', this.parts[s] || '')
    })
  }
}

register('aurora-dateinput', AuroraDateinput)
