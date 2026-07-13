import { describe, expect, it } from 'vitest'
import './tilelayout'
import type { AuroraTile, AuroraTilelayout } from './tilelayout'

describe('aurora-tilelayout', () => {
  it('lays out tiles on a column grid with spans applied', () => {
    const el = document.createElement('aurora-tilelayout') as AuroraTilelayout
    el.setAttribute('columns', '4')
    el.innerHTML = `
      <aurora-tile heading="Traffic" colspan="2">Chart here</aurora-tile>
      <aurora-tile heading="Errors">Sparkline</aurora-tile>
      <aurora-tile heading="Uptime" rowspan="2">Gauge</aurora-tile>
    `
    document.body.append(el)
    expect(el.style.getPropertyValue('--aurora-tile-cols')).toBe('4')
    const tiles = el.tiles()
    expect(tiles.length).toBe(3)
    expect(tiles[0]?.style.gridColumn).toBe('span 2')
    expect(tiles[2]?.style.gridRow).toBe('span 2')
    expect((tiles[0] as AuroraTile).shadowRoot?.querySelector('.head')?.textContent).toBe('Traffic')
    el.remove()
  })

  it('lifts a tile only when grabbed by its header', () => {
    const el = document.createElement('aurora-tilelayout') as AuroraTilelayout
    el.innerHTML =
      '<aurora-tile heading="A">body</aurora-tile><aurora-tile heading="B">body</aurora-tile>'
    document.body.append(el)
    const tile = el.tiles()[0] as AuroraTile
    const head = tile.shadowRoot?.querySelector('.head')
    head?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }))
    expect(tile.classList.contains('aurora-dragging')).toBe(true)
    let order: string[] = []
    el.addEventListener('aurora-reorder', (e) => {
      order = (e as CustomEvent<{ order: string[] }>).detail.order
    })
    el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    expect(tile.classList.contains('aurora-dragging')).toBe(false)
    expect(order).toEqual(['A', 'B'])
    const body = tile.shadowRoot?.querySelector('.body')
    body?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }))
    expect(tile.classList.contains('aurora-dragging')).toBe(false)
    el.remove()
  })
})
