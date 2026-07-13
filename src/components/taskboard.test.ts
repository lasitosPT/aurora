import { describe, expect, it } from 'vitest'
import './taskboard'
import type { AuroraTaskboard } from './taskboard'

function make(): AuroraTaskboard {
  const el = document.createElement('aurora-taskboard') as AuroraTaskboard
  document.body.append(el)
  el.columns = [
    {
      id: 'todo',
      title: 'To do',
      cards: [
        { id: 'a', title: 'Design API' },
        { id: 'b', title: 'Write tests' },
      ],
    },
    { id: 'doing', title: 'In progress', cards: [{ id: 'c', title: 'Ship grid' }] },
    { id: 'done', title: 'Done', cards: [] },
  ]
  return el
}

describe('aurora-taskboard', () => {
  it('renders columns with counts and empty states', () => {
    const el = make()
    expect(el.shadowRoot?.querySelectorAll('.col').length).toBe(3)
    expect(el.shadowRoot?.querySelector('.col[data-col="todo"] .count')?.textContent).toBe('2')
    expect(el.shadowRoot?.querySelector('.col[data-col="done"] .empty')).not.toBeNull()
    el.remove()
  })

  it('moves cards across columns via move() and emits aurora-move', () => {
    const el = make()
    let got: { from: string; to: string; index: number } | null = null
    el.addEventListener('aurora-move', (e) => {
      got = (e as CustomEvent<{ from: string; to: string; index: number }>).detail
    })
    el.move('a', 'doing', 0)
    expect(got).toEqual(expect.objectContaining({ from: 'todo', to: 'doing', index: 0 }))
    expect(el.columns[1]?.cards.map((c) => c.id)).toEqual(['a', 'c'])
    expect(el.shadowRoot?.querySelector('.col[data-col="todo"] .count')?.textContent).toBe('1')
    el.remove()
  })

  it('moves the focused card with Ctrl+arrows', () => {
    const el = make()
    const card = el.shadowRoot?.querySelector<HTMLElement>('.card[data-id="c"]')
    card?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }),
    )
    expect(el.columns[2]?.cards.map((c) => c.id)).toEqual(['c'])
    el.remove()
  })
})
