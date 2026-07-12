import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: flex; align-items: flex-start; }
  .step { display: flex; flex-direction: column; align-items: center; gap: 7px; flex: 1; min-width: 0; position: relative; }
  .dot {
    all: unset; box-sizing: border-box; width: 30px; height: 30px; border-radius: 50%;
    display: grid; place-items: center; font-size: 0.8rem; font-weight: 600; cursor: default;
    border: 1px solid var(--aurora-border, rgba(255,255,255,0.2));
    color: var(--aurora-muted, #9a98b3); background: var(--aurora-surface, #16161f);
    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease; z-index: 1;
  }
  :host([linear='false']) .dot, .step.done .dot { cursor: pointer; }
  .step.done .dot { background: var(--aurora-accent, #6d5cff); border-color: var(--aurora-accent, #6d5cff); color: #fff; }
  .step.current .dot { border-color: var(--aurora-accent, #6d5cff); color: var(--aurora-fg, #ececf2); box-shadow: 0 0 0 4px rgba(109, 92, 255, 0.18); }
  .dot:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: 2px; }
  .label { font-size: 0.8rem; color: var(--aurora-muted, #9a98b3); text-align: center; }
  .step.current .label { color: var(--aurora-fg, #ececf2); }
  .bar {
    position: absolute; top: 15px; left: calc(50% + 15px); right: calc(-50% + 15px); height: 2px;
    background: var(--aurora-border, rgba(255,255,255,0.12));
  }
  .step:last-child .bar { display: none; }
  .bar i { display: block; height: 100%; width: 0; background: var(--aurora-accent, #6d5cff); }
  .step.done .bar i { width: 100%; }
`

/**
 * `<aurora-stepper value="1">` — multi-step progress. Assign `steps`
 * (string[]) or use child `<option>`s; the connector fills as steps complete.
 * `next()` / `prev()` / `value`; completed dots are clickable to jump back
 * (`linear="false"` allows jumping anywhere). Emits `aurora-change`.
 */
export class AuroraStepper extends AuroraElement {
  #steps: string[] = []
  private current = 0

  get steps(): string[] {
    return this.#steps
  }

  set steps(v: string[]) {
    this.#steps = v ?? []
    this.render()
  }

  get value(): number {
    return this.current
  }

  set value(v: number) {
    this.go(v, false)
  }

  connectedCallback(): void {
    this.#steps = Array.from(this.querySelectorAll('option')).map(
      (o) => o.textContent?.trim() ?? '',
    )
    this.current = this.numberAttr('value', 0)
    this.render()
  }

  next(): void {
    this.go(this.current + 1, true)
  }

  prev(): void {
    this.go(this.current - 1, true)
  }

  private go(v: number, emit: boolean): void {
    const next = Math.max(0, Math.min(v, this.#steps.length - 1))
    const changed = next !== this.current
    this.current = next
    this.render()
    if (!prefersReducedMotion() && changed) {
      const dot = this.root.querySelectorAll('.dot')[next]
      if (dot)
        gsap.fromTo(
          dot,
          { scale: 1 },
          { scale: 1.18, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' },
        )
    }
    if (emit && changed) {
      this.dispatchEvent(
        new CustomEvent('aurora-change', { detail: { value: next, label: this.#steps[next] } }),
      )
    }
  }

  private render(): void {
    const free = this.getAttribute('linear') === 'false'
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      this.#steps
        .map((label, i) => {
          const state = i < this.current ? 'done' : i === this.current ? 'current' : ''
          return `<div class="step ${state}" aria-current="${i === this.current ? 'step' : 'false'}"><button class="dot" data-i="${i}" aria-label="Step ${i + 1}: ${escapeHtml(label)}">${i < this.current ? '✓' : i + 1}</button><span class="label">${escapeHtml(label)}</span><span class="bar" aria-hidden="true"><i></i></span></div>`
        })
        .join('')
    this.root.querySelectorAll<HTMLButtonElement>('.dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const i = Number(dot.dataset.i)
        if (free || i < this.current) this.go(i, true)
      })
    })
  }
}

register('aurora-stepper', AuroraStepper)
