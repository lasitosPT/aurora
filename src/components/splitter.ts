import { AuroraElement } from '../core/base'
import { clamp } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: flex; overflow: hidden; }
  :host([vertical]) { flex-direction: column; }
  .pane { overflow: auto; min-width: 0; min-height: 0; }
  .a { flex: 0 0 var(--pos, 50%); }
  .b { flex: 1; }
  .divider {
    flex: none; background: var(--aurora-border, rgba(255, 255, 255, 0.1));
    transition: background 0.15s ease; z-index: 1; touch-action: none;
  }
  :host(:not([vertical])) .divider { width: 5px; cursor: col-resize; }
  :host([vertical]) .divider { height: 5px; cursor: row-resize; }
  .divider:hover, .divider.is-active { background: var(--aurora-accent, #6d5cff); }
  .divider:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: -2px; }
`

/**
 * `<aurora-splitter position="40">` — two resizable panes (`slot="a"` /
 * `slot="b"`) split by a draggable divider, horizontal by default or
 * `vertical`. Arrow keys nudge the divider by 2%; `min` (%) bounds both sides.
 * Emits `aurora-resize` with `{ position }`.
 */
export class AuroraSplitter extends AuroraElement {
  private pos = 50

  get position(): number {
    return this.pos
  }

  set position(v: number) {
    this.set(v, false)
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><div class="pane a" part="pane-a"><slot name="a"></slot></div><div class="divider" part="divider" role="separator" tabindex="0" aria-orientation="${this.hasAttribute('vertical') ? 'horizontal' : 'vertical'}" aria-label="Resize panes"></div><div class="pane b" part="pane-b"><slot name="b"></slot></div>`
    this.set(this.numberAttr('position', 50), false)

    const divider = this.root.querySelector<HTMLElement>('.divider')
    divider?.addEventListener('pointerdown', (e) => {
      divider.classList.add('is-active')
      divider.setPointerCapture(e.pointerId)
      const onMove = (move: PointerEvent): void => {
        const rect = this.getBoundingClientRect()
        const vertical = this.hasAttribute('vertical')
        const frac = vertical
          ? (move.clientY - rect.top) / rect.height
          : (move.clientX - rect.left) / rect.width
        this.set(frac * 100, true)
      }
      const onUp = (): void => {
        divider.classList.remove('is-active')
        divider.removeEventListener('pointermove', onMove)
        divider.removeEventListener('pointerup', onUp)
      }
      divider.addEventListener('pointermove', onMove)
      divider.addEventListener('pointerup', onUp)
    })
    divider?.addEventListener('keydown', (e) => {
      const back = this.hasAttribute('vertical') ? 'ArrowUp' : 'ArrowLeft'
      const fwd = this.hasAttribute('vertical') ? 'ArrowDown' : 'ArrowRight'
      if (e.key === back) this.set(this.pos - 2, true)
      else if (e.key === fwd) this.set(this.pos + 2, true)
      else return
      e.preventDefault()
    })
  }

  private set(v: number, emit: boolean): void {
    const min = this.numberAttr('min', 15)
    const next = clamp(v, min, 100 - min)
    const changed = next !== this.pos
    this.pos = next
    this.style.setProperty('--pos', `${next}%`)
    this.root.querySelector('.divider')?.setAttribute('aria-valuenow', String(Math.round(next)))
    if (emit && changed) {
      this.dispatchEvent(new CustomEvent('aurora-resize', { detail: { position: next } }))
    }
  }
}

register('aurora-splitter', AuroraSplitter)
