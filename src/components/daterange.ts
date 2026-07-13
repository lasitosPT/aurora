import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; min-width: 240px; }
  .trigger {
    all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center;
    justify-content: space-between; gap: 10px; width: 100%; padding: 0.6rem 0.9rem; font: inherit;
    color: var(--aurora-fg, inherit); font-variant-numeric: tabular-nums;
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease;
  }
  .trigger:hover, .trigger:focus-visible { border-color: var(--aurora-accent, #6d5cff); outline: none; }
  .trigger .ph { color: var(--aurora-muted, #9a98b3); }
  .pop {
    position: absolute; top: calc(100% + 6px); left: 0; display: none; padding: 14px; min-width: 264px;
    background: var(--aurora-surface, #16161f); border: 1px solid var(--aurora-border, rgba(255,255,255,0.14));
    border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.45); z-index: var(--aurora-menu-z, 60);
  }
  .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .head button { all: unset; cursor: pointer; padding: 3px 10px; border-radius: 7px;
    border: 1px solid var(--aurora-border, rgba(255,255,255,0.12)); }
  .head button:hover { border-color: var(--aurora-accent, #6d5cff); }
  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
  .dow { font-size: 0.72em; color: var(--aurora-muted, #9a98b3); padding: 4px 0; }
  .day { all: unset; cursor: pointer; padding: 6px 0; font-size: 0.9em; text-align: center; }
  .day:hover { background: rgba(109, 92, 255, 0.16); border-radius: 8px; }
  .day.other { color: var(--aurora-muted, #9a98b3); opacity: 0.4; }
  .day.in { background: rgba(109, 92, 255, 0.14); }
  .day.edge { background: var(--aurora-accent, #6d5cff); color: #fff; }
  .day.start { border-radius: 8px 0 0 8px; }
  .day.end { border-radius: 0 8px 8px 0; }
  .day.start.end { border-radius: 8px; }
  .hint { margin-top: 8px; font-size: 0.75rem; color: var(--aurora-muted, #9a98b3); }
`

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * `<aurora-daterange>` — a date-range picker: one popup month grid where the
 * first click sets the start, the second the end (auto-swapped if reversed),
 * with the span highlighted. `start`/`end` ISO attributes and properties;
 * form-associated (two FormData entries). Emits `aurora-change` with
 * `{ start, end }`.
 */
export class AuroraDaterange extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private cursor = new Date()
  private a: string | null = null
  private b: string | null = null
  private isOpen = false
  private onDocDown: ((e: Event) => void) | null = null

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get start(): string | null {
    return this.a
  }

  get end(): string | null {
    return this.b
  }

  connectedCallback(): void {
    const startAttr = this.getAttribute('start')
    const endAttr = this.getAttribute('end')
    if (startAttr && endAttr) {
      this.a = startAttr
      this.b = endAttr
    }
    if (startAttr) this.cursor = new Date(`${startAttr}T00:00`)
    this.root.innerHTML = `<style>${STYLE}</style><button class="trigger" part="trigger" aria-haspopup="dialog" aria-expanded="false"><span class="label ph">${escapeHtml(this.getAttribute('placeholder') ?? 'Pick a range')}</span><span aria-hidden="true">▾</span></button><div class="pop" part="pop" role="dialog"></div>`
    this.root.querySelector('.trigger')?.addEventListener('click', () => this.toggle())
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close()
    })
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.contains(e.target as Node) && e.target !== this) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
    this.sync()
    this.renderGrid()
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  private renderGrid(): void {
    const pop = this.root.querySelector('.pop')
    if (!pop) return
    const y = this.cursor.getFullYear()
    const m = this.cursor.getMonth()
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7
    const title = new Date(y, m, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })
    let cells = ''
    for (let i = 0; i < 42; i++) {
      const d = new Date(y, m, 1 - startDow + i)
      const iso = fmt(d)
      const inRange = this.a && this.b && iso > this.a && iso < this.b
      const isStart = iso === this.a
      const isEnd = iso === this.b
      cells += `<button class="day${d.getMonth() !== m ? ' other' : ''}${inRange ? ' in' : ''}${isStart || isEnd ? ' edge' : ''}${isStart ? ' start' : ''}${isEnd ? ' end' : ''}" data-iso="${iso}">${d.getDate()}</button>`
    }
    pop.innerHTML = `<div class="head"><button data-nav="-1" aria-label="Previous month">‹</button><span>${title}</span><button data-nav="1" aria-label="Next month">›</button></div><div class="grid">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => `<span class="dow">${d}</span>`).join('')}${cells}</div><div class="hint">${!this.a || (this.a && this.b) ? 'Pick a start date' : 'Pick an end date'}</div>`
    pop.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.cursor = new Date(y, m + Number(btn.dataset.nav), 1)
        this.renderGrid()
      }),
    )
    pop
      .querySelectorAll<HTMLButtonElement>('.day')
      .forEach((day) => day.addEventListener('click', () => this.pick(day.dataset.iso ?? '')))
  }

  private pick(iso: string): void {
    if (!this.a || (this.a && this.b)) {
      this.a = iso
      this.b = null
    } else {
      this.b = iso
      if (this.b < this.a) [this.a, this.b] = [this.b, this.a]
      this.close()
      this.dispatchEvent(
        new CustomEvent('aurora-change', { detail: { start: this.a, end: this.b } }),
      )
    }
    this.sync()
    this.renderGrid()
  }

  private sync(): void {
    const label = this.root.querySelector('.label')
    if (label && this.a) {
      label.classList.remove('ph')
      label.textContent = this.b ? `${this.a} → ${this.b}` : `${this.a} → …`
    }
    const name = this.getAttribute('name')
    if (this.internals && name && this.a && this.b) {
      const fd = new FormData()
      fd.append(`${name}-start`, this.a)
      fd.append(`${name}-end`, this.b)
      this.internals.setFormValue(fd)
    }
  }

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.root.querySelector('.trigger')?.setAttribute('aria-expanded', 'true')
    const pop = this.root.querySelector<HTMLElement>('.pop')
    if (pop) {
      pop.style.display = 'block'
      if (!prefersReducedMotion())
        gsap.fromTo(
          pop,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' },
        )
    }
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.root.querySelector('.trigger')?.setAttribute('aria-expanded', 'false')
    const pop = this.root.querySelector<HTMLElement>('.pop')
    if (pop) pop.style.display = 'none'
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }
}

register('aurora-daterange', AuroraDaterange)
