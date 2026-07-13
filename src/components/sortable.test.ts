import { describe, expect, it } from 'vitest'
import './sortable'
import type { AuroraSortable } from './sortable'

function makeSortable(): AuroraSortable {
  const el = document.createElement('aurora-sortable') as AuroraSortable
  el.innerHTML = '<div id="a">A</div><div id="b">B</div><div id="c">C</div>'
  document.body.append(el)
  return el
}

describe('aurora-sortable', () => {
  it('assigns list semantics and focusability to children', () => {
    const el = makeSortable()
    expect(el.getAttribute('role')).toBe('list')
    const items = el.items()
    expect(items.length).toBe(3)
    expect(items[0]?.getAttribute('role')).toBe('listitem')
    expect(items[0]?.tabIndex).toBe(0)
    el.remove()
  })

  it('reorders with move() and emits aurora-reorder', () => {
    const el = makeSortable()
    let detail: { from: number; to: number } | null = null
    el.addEventListener('aurora-reorder', (e) => {
      detail = (e as CustomEvent<{ from: number; to: number }>).detail
    })
    el.move(0, 2)
    expect(el.items().map((i) => i.id)).toEqual(['b', 'c', 'a'])
    expect(detail).toEqual(expect.objectContaining({ from: 0, to: 2 }))
    el.move(2, 0)
    expect(el.items().map((i) => i.id)).toEqual(['a', 'b', 'c'])
    el.remove()
  })

  it('moves the focused item with Ctrl+arrows and clamps at the edges', () => {
    const el = makeSortable()
    const b = el.querySelector<HTMLElement>('#b')
    b?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }),
    )
    expect(el.items().map((i) => i.id)).toEqual(['a', 'c', 'b'])
    b?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }),
    )
    expect(el.items().map((i) => i.id)).toEqual(['a', 'c', 'b'])
    el.remove()
  })
})
