import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

type Zone = 'top' | 'left' | 'center' | 'right' | 'bottom'
const ZONES: Zone[] = ['top', 'left', 'center', 'right', 'bottom']

const PANE_STYLE = `
  :host {
    display: flex; flex-direction: column; min-width: 0; min-height: 0; flex: 1;
    background: var(--aurora-surface, #14141f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 12px; overflow: hidden;
  }
  .head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 8px 12px; cursor: grab; user-select: none; font-size: 0.85rem; font-weight: 600;
    color: var(--aurora-fg, #ececf2);
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
  }
  .head:active { cursor: grabbing; }
  .fold {
    all: unset; cursor: pointer; width: 20px; height: 20px; display: grid; place-items: center;
    border-radius: 6px; color: var(--aurora-muted, #9a98b3); font-size: 0.7rem;
  }
  .fold:hover { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.07); }
  .fold:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .body { flex: 1; padding: 12px; overflow: auto; color: var(--aurora-muted, #9a98b3); font-size: 0.88rem; }
  :host([collapsed]) .body { display: none; }
  :host([collapsed]) { flex: 0 0 auto; }
  :host(.aurora-dragging) { opacity: 0.85; z-index: 5; box-shadow: 0 16px 44px rgba(0, 0, 0, 0.5); position: relative; }
`

/** `<aurora-dockpane heading="…" zone="left">` — one dockable pane. */
export class AuroraDockpane extends AuroraElement {
  connectedCallback(): void {
    const heading = this.getAttribute('heading') ?? 'Pane'
    this.root.innerHTML = `<style>${PANE_STYLE}</style><div class="head" part="head"><span>${escapeHtml(heading)}</span><button class="fold" aria-label="Collapse" aria-expanded="true">▾</button></div><div class="body" part="body"><slot></slot></div>`
    this.syncSlot()
    this.root.querySelector('.fold')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const collapsed = this.toggleAttribute('collapsed')
      const fold = this.root.querySelector('.fold')
      if (fold) {
        fold.textContent = collapsed ? '▸' : '▾'
        fold.setAttribute('aria-expanded', String(!collapsed))
      }
    })
    this.root.querySelector('.head')?.addEventListener('pointerdown', (e) => {
      const ev = e as PointerEvent
      if ((ev.target as HTMLElement).closest('.fold')) return
      this.dispatchEvent(
        new CustomEvent('aurora-pane-grab', {
          bubbles: true,
          detail: { x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId },
        }),
      )
    })
  }

  get zone(): Zone {
    const z = this.getAttribute('zone')
    return (ZONES as string[]).includes(z ?? '') ? (z as Zone) : 'center'
  }

  set zone(z: Zone) {
    this.setAttribute('zone', z)
    this.syncSlot()
  }

  syncSlot(): void {
    this.setAttribute('slot', this.zone)
  }
}

register('aurora-dockpane', AuroraDockpane)

const STYLE = `
  :host {
    display: grid; gap: 10px; min-height: 320px;
    grid-template-columns: var(--aurora-dock-side, 220px) 1fr var(--aurora-dock-side, 220px);
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 'top top top' 'left center right' 'bottom bottom bottom';
  }
  .zone { display: flex; gap: 10px; min-width: 0; min-height: 0; border-radius: 12px; }
  .zone[data-z='top'] { grid-area: top; }
  .zone[data-z='left'] { grid-area: left; flex-direction: column; }
  .zone[data-z='center'] { grid-area: center; flex-direction: column; }
  .zone[data-z='right'] { grid-area: right; flex-direction: column; }
  .zone[data-z='bottom'] { grid-area: bottom; }
  :host([dragging]) .zone {
    outline: 1.5px dashed var(--aurora-border, rgba(255, 255, 255, 0.25));
    outline-offset: -1.5px; min-height: 46px;
  }
  .zone.target {
    outline-color: var(--aurora-accent, #6d5cff);
    background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 8%, transparent);
  }
`

/**
 * `<aurora-dockmanager>` — dockable panes in five zones (top, left, center,
 * right, bottom). Drag a pane by its header: zones outline, the hovered one
 * highlights, and dropping re-docks by slot reassignment (listeners survive).
 * Panes collapse from their headers. Emits `aurora-dock` with
 * `{ heading, zone }`.
 */
export class AuroraDockmanager extends AuroraElement {
  private dragPane: AuroraDockpane | null = null

  connectedCallback(): void {
    this.root.innerHTML =
      `<style>${STYLE}</style>` +
      ZONES.map((z) => `<div class="zone" data-z="${z}"><slot name="${z}"></slot></div>`).join('')
    this.querySelectorAll<AuroraDockpane>('aurora-dockpane').forEach((p) => p.syncSlot?.())
    this.addEventListener('aurora-pane-grab', (e) => {
      const pane = e.target as AuroraDockpane | null
      if (!pane) return
      this.dragPane = pane
      this.setAttribute('dragging', '')
      this.setPointerCapture?.((e as CustomEvent<{ pointerId: number }>).detail.pointerId)
      pane.classList.add('aurora-dragging')
    })
    this.addEventListener('pointermove', (e) => {
      if (!this.dragPane) return
      const zone = this.zoneAt(e.clientX, e.clientY)
      this.root.querySelectorAll('.zone').forEach((el) => {
        el.classList.toggle('target', el === zone)
      })
    })
    const drop = (e: PointerEvent): void => {
      const pane = this.dragPane
      if (!pane) return
      this.dragPane = null
      this.removeAttribute('dragging')
      pane.classList.remove('aurora-dragging')
      const zoneEl = this.zoneAt(e.clientX, e.clientY)
      this.root.querySelectorAll('.zone').forEach((el) => el.classList.remove('target'))
      const z = zoneEl?.getAttribute('data-z') as Zone | null
      if (z && z !== pane.zone) {
        pane.zone = z
        this.dispatchEvent(
          new CustomEvent('aurora-dock', {
            detail: { heading: pane.getAttribute('heading'), zone: z },
          }),
        )
      }
    }
    this.addEventListener('pointerup', drop)
    this.addEventListener('pointercancel', drop)
  }

  private zoneAt(x: number, y: number): HTMLElement | null {
    for (const zone of Array.from(this.root.querySelectorAll<HTMLElement>('.zone'))) {
      const r = zone.getBoundingClientRect()
      if (r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zone
    }
    return null
  }
}

register('aurora-dockmanager', AuroraDockmanager)
