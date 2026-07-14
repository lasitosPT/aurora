import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp } from '../core/motion'
import { register } from '../core/register'

type Seg = 'hh' | 'mm' | 'ss'

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
  .unit { font-size: 0.72rem; color: var(--aurora-muted, #9a98b3); margin-inline-start: 6px; }
`

/**
 * `<aurora-durationpicker>` — hh:mm:ss duration typing: digit segments with
 * auto-advance, arrow increments (minutes and seconds wrap at 60), and a
 * total in seconds via `seconds`. Hide seconds with `no-seconds`.
 * Form-associated (submits `HH:MM:SS`); emits `aurora-change`.
 */
export class AuroraDurationpicker extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private parts: Record<Seg, string> = { hh: '', mm: '', ss: '' }

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

  get seconds(): number | null {
    const { hh, mm, ss } = this.parts
    const withSecs = !this.hasAttribute('no-seconds')
    if (!hh && !mm && !ss) return null
    return Number(hh || 0) * 3600 + Number(mm || 0) * 60 + (withSecs ? Number(ss || 0) : 0)
  }

  get value(): string | null {
    const s = this.seconds
    if (s === null) return null
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  set value(v: string | null) {
    const m = /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/.exec(v ?? '')
    if (!m) return
    this.parts = { hh: m[1] ?? '', mm: m[2] ?? '', ss: m[3] ?? '' }
    this.sync()
  }

  connectedCallback(): void {
    const label = this.getAttribute('label') ?? ''
    const withSecs = !this.hasAttribute('no-seconds')
    this.root.innerHTML = `<style>${STYLE}</style>${
      label ? `<label class="label">${escapeHtml(label)}</label>` : ''
    }<div class="field" part="field" role="group" aria-label="${escapeHtml(label || 'Duration')}">
      <span class="seg" data-s="hh" tabindex="0" role="spinbutton" aria-label="Hours">hh</span><span class="sep">:</span>
      <span class="seg" data-s="mm" tabindex="0" role="spinbutton" aria-label="Minutes">mm</span>${
        withSecs
          ? '<span class="sep">:</span><span class="seg" data-s="ss" tabindex="0" role="spinbutton" aria-label="Seconds">ss</span>'
          : ''
      }<span class="unit">${withSecs ? 'h:m:s' : 'h:m'}</span>
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
    return seg === 'hh' ? { max: 999, len: 2 } : { max: 59, len: 2 }
  }

  private onKey(e: KeyboardEvent, seg: Seg, el: HTMLElement): void {
    const { max, len } = this.limits(seg)
    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      let next = (this.parts[seg] + e.key).slice(-len)
      if (Number(next) > max) next = e.key
      this.parts[seg] = next
      this.sync()
      if (next.length === len && seg !== 'ss') this.move(el, 1)
      this.commit()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (this.parts[seg]) this.parts[seg] = ''
      else this.move(el, -1)
      this.sync()
      this.commit()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const cur = Number(this.parts[seg] || 0)
      const delta = e.key === 'ArrowUp' ? 1 : -1
      const next = seg === 'hh' ? clamp(cur + delta, 0, max) : (cur + delta + 60) % 60
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
    if (v !== null)
      this.dispatchEvent(
        new CustomEvent('aurora-change', { detail: { value: v, seconds: this.seconds } }),
      )
  }

  private sync(): void {
    this.root.querySelectorAll<HTMLElement>('.seg').forEach((seg) => {
      const s = seg.dataset['s'] as Seg
      const filled = this.parts[s] !== ''
      seg.textContent = filled ? this.parts[s].padStart(2, '0') : s
      seg.classList.toggle('filled', filled)
      seg.setAttribute('aria-valuenow', this.parts[s] || '')
    })
  }
}

register('aurora-durationpicker', AuroraDurationpicker)
