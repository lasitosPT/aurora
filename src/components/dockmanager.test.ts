import { describe, expect, it } from 'vitest'
import './dockmanager'
import type { AuroraDockmanager, AuroraDockpane } from './dockmanager'

function make(): AuroraDockmanager {
  const el = document.createElement('aurora-dockmanager') as AuroraDockmanager
  el.innerHTML = `
    <aurora-dockpane heading="Explorer" zone="left">files</aurora-dockpane>
    <aurora-dockpane heading="Editor" zone="center">code</aurora-dockpane>
    <aurora-dockpane heading="Terminal" zone="bottom">shell</aurora-dockpane>
  `
  document.body.append(el)
  return el
}

describe('aurora-dockmanager', () => {
  it('distributes panes into zone slots', () => {
    const el = make()
    const panes = el.querySelectorAll<AuroraDockpane>('aurora-dockpane')
    expect(panes[0]?.getAttribute('slot')).toBe('left')
    expect(panes[1]?.getAttribute('slot')).toBe('center')
    expect(panes[2]?.getAttribute('slot')).toBe('bottom')
    expect(el.shadowRoot?.querySelectorAll('.zone').length).toBe(5)
    el.remove()
  })

  it('re-docks a pane by zone assignment and emits aurora-dock', () => {
    const el = make()
    let docked: { heading: string; zone: string } | null = null
    el.addEventListener('aurora-dock', (e) => {
      docked = (e as CustomEvent<{ heading: string; zone: string }>).detail
    })
    const pane = el.querySelector<AuroraDockpane>('aurora-dockpane[heading="Explorer"]')
    if (!pane) throw new Error('no pane')
    pane.zone = 'right'
    expect(pane.getAttribute('slot')).toBe('right')
    // pointer path: grab then drop over a zone rect (zero rects in happy-dom → use event directly)
    pane.dispatchEvent(
      new CustomEvent('aurora-pane-grab', {
        bubbles: true,
        detail: { x: 0, y: 0, pointerId: 1 },
      }),
    )
    expect(el.hasAttribute('dragging')).toBe(true)
    expect(pane.classList.contains('aurora-dragging')).toBe(true)
    el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    expect(el.hasAttribute('dragging')).toBe(false)
    expect(docked).toBeNull()
    el.remove()
  })

  it('collapses panes from the header button', () => {
    const el = make()
    const pane = el.querySelector<AuroraDockpane>('aurora-dockpane[heading="Terminal"]')
    const fold = pane?.shadowRoot?.querySelector<HTMLButtonElement>('.fold')
    fold?.click()
    expect(pane?.hasAttribute('collapsed')).toBe(true)
    expect(fold?.textContent).toBe('▸')
    fold?.click()
    expect(pane?.hasAttribute('collapsed')).toBe(false)
    el.remove()
  })
})
