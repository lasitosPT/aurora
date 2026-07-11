import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: inline-block; position: relative; min-width: 150px; }
  .trigger {
    all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center;
    justify-content: space-between; gap: 10px; width: 100%; padding: 0.6rem 0.9rem; font: inherit;
    color: var(--aurora-fg, inherit);
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4));
    border-radius: var(--aurora-radius, 0.6rem); transition: border-color 0.2s ease;
  }
  .trigger:hover, .trigger:focus-visible { border-color: var(--aurora-accent, #6d5cff); outline: none; }
  .trigger .ph { color: var(--aurora-muted, #9a98b3); }
  .trigger svg { flex: none; stroke: var(--aurora-muted, #9a98b3); fill: none; }
  .pop {
    position: absolute; top: calc(100% + 6px); left: 0; display: none; gap: 4px; padding: 6px;
    z-index: var(--aurora-menu-z, 60); background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.14));
    border-radius: 11px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  }
  .col { max-height: 210px; overflow: auto; display: flex; flex-direction: column; gap: 2px; }
  .col button {
    all: unset; cursor: pointer; padding: 0.32rem 0.9rem; border-radius: 7px;
    font-variant-numeric: tabular-nums; text-align: center;
  }
  .col button:hover { background: rgba(109, 92, 255, 0.14); }
  .col button[aria-selected='true'] { background: var(--aurora-accent, #6d5cff); color: #fff; }
`

/**
 * `<aurora-timepicker>` — an "HH:MM" time input with hour and minute columns in
 * a popup. `value` ("14:30"), `step` (minute increment, default 5),
 * `placeholder`; form-associated. Emits `aurora-change` with `{ value }`.
 */
export class AuroraTimepicker extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private h: number | null = null
  private m: number | null = null
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

  get value(): string | null {
    return this.h === null || this.m === null
      ? null
      : `${String(this.h).padStart(2, '0')}:${String(this.m).padStart(2, '0')}`
  }

  set value(v: string | null) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(v ?? '')
    if (match) {
      this.h = Number(match[1])
      this.m = Number(match[2])
      if (this.value) this.internals?.setFormValue(this.value)
    }
    this.renderPop()
    this.renderLabel()
  }

  connectedCallback(): void {
    const ph = escapeHtml(this.getAttribute('placeholder') ?? 'Pick a time')
    this.root.innerHTML = `<style>${STYLE}</style><button class="trigger" part="trigger" aria-haspopup="listbox" aria-expanded="false"><span class="label ph">${ph}</span><svg width="14" height="14" viewBox="0 0 16 16" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/></svg></button><div class="pop" part="pop"><div class="col" data-col="h"></div><div class="col" data-col="m"></div></div>`
    const initial = this.getAttribute('value')
    if (initial) this.value = initial
    else this.renderPop()

    this.root.querySelector('.trigger')?.addEventListener('click', () => this.toggle())
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
        this.root.querySelector<HTMLElement>('.trigger')?.focus()
      }
    })
    this.onDocDown = (e: Event): void => {
      if (this.isOpen && !this.contains(e.target as Node) && e.target !== this) this.close()
    }
    document.addEventListener('pointerdown', this.onDocDown)
  }

  disconnectedCallback(): void {
    if (this.onDocDown) document.removeEventListener('pointerdown', this.onDocDown)
  }

  private renderPop(): void {
    const step = Math.max(this.numberAttr('step', 5), 1)
    const hcol = this.root.querySelector('[data-col="h"]')
    const mcol = this.root.querySelector('[data-col="m"]')
    if (!hcol || !mcol) return
    hcol.innerHTML = Array.from(
      { length: 24 },
      (_, i) =>
        `<button data-h="${i}" aria-selected="${i === this.h}">${String(i).padStart(2, '0')}</button>`,
    ).join('')
    const mins: number[] = []
    for (let i = 0; i < 60; i += step) mins.push(i)
    mcol.innerHTML = mins
      .map(
        (i) =>
          `<button data-m="${i}" aria-selected="${i === this.m}">${String(i).padStart(2, '0')}</button>`,
      )
      .join('')
    hcol
      .querySelectorAll<HTMLElement>('[data-h]')
      .forEach((b) =>
        b.addEventListener('click', () => this.pick(Number(b.dataset.h), this.m ?? 0)),
      )
    mcol
      .querySelectorAll<HTMLElement>('[data-m]')
      .forEach((b) =>
        b.addEventListener('click', () => this.pick(this.h ?? 0, Number(b.dataset.m))),
      )
  }

  private pick(h: number, m: number): void {
    this.h = h
    this.m = m
    if (this.value) this.internals?.setFormValue(this.value)
    this.renderPop()
    this.renderLabel()
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.value } }))
  }

  private renderLabel(): void {
    const label = this.root.querySelector('.label')
    if (label && this.value) {
      label.classList.remove('ph')
      label.textContent = this.value
    }
  }

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.root.querySelector('.trigger')?.setAttribute('aria-expanded', 'true')
    const pop = this.root.querySelector<HTMLElement>('.pop')
    if (pop) {
      pop.style.display = 'flex'
      if (!prefersReducedMotion())
        gsap.fromTo(
          pop,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' },
        )
      pop.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
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

register('aurora-timepicker', AuroraTimepicker)
