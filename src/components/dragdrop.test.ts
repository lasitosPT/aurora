import { describe, expect, it } from 'vitest'
import './dragdrop'
import type { AuroraDraggable, AuroraDropzone } from './dragdrop'

describe('aurora-draggable + aurora-dropzone', () => {
  it('starts a drag, delivers to a zone via receive, and ends', () => {
    const drag = document.createElement('aurora-draggable') as AuroraDraggable
    drag.setAttribute('data', 'card-7')
    drag.textContent = 'Drag me'
    const zone = document.createElement('aurora-dropzone') as AuroraDropzone
    document.body.append(drag, zone)
    const events: string[] = []
    drag.addEventListener('aurora-dragstart', () => events.push('start'))
    drag.addEventListener('aurora-dragend', (e) =>
      events.push(`end:${(e as CustomEvent<{ dropped: boolean }>).detail.dropped}`),
    )
    let received = ''
    zone.addEventListener('aurora-drop', (e) => {
      received = (e as CustomEvent<{ data: string }>).detail.data
    })
    drag.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
    expect(drag.classList.contains('aurora-dragging')).toBe(true)
    const ok = zone.receive('card-7', drag)
    expect(ok).toBe(true)
    expect(received).toBe('card-7')
    drag.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 10, clientY: 10 }))
    expect(events[0]).toBe('start')
    expect(events[1]).toContain('end')
    drag.remove()
    zone.remove()
  })

  it('respects accept/type matching in hit tests', () => {
    const drag = document.createElement('aurora-draggable') as AuroraDraggable
    drag.setAttribute('type', 'file')
    const zone = document.createElement('aurora-dropzone') as AuroraDropzone
    zone.setAttribute('accept', 'card')
    document.body.append(drag, zone)
    drag.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(zone.hits(0, 0)).toBe(false)
    drag.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    drag.remove()
    zone.remove()
  })
})
