import { describe, expect, it } from 'vitest'
import './orgchart'
import type { AuroraOrgchart } from './orgchart'

const ORG = [
  {
    name: 'Ada Lovelace',
    title: 'CEO',
    children: [
      {
        name: 'Grace Hopper',
        title: 'CTO',
        children: [{ name: 'Alan Turing', title: 'Research' }],
      },
      { name: 'Margaret Hamilton', title: 'VP Eng' },
    ],
  },
]

describe('aurora-orgchart', () => {
  it('renders the hierarchy with avatars and connector lists', () => {
    const el = document.createElement('aurora-orgchart') as AuroraOrgchart
    document.body.append(el)
    el.nodes = ORG
    expect(el.shadowRoot?.querySelectorAll('.card').length).toBe(4)
    expect(el.shadowRoot?.querySelectorAll('aurora-avatar').length).toBe(4)
    expect(el.shadowRoot?.querySelector('.card .who b')?.textContent).toBe('Ada Lovelace')
    el.remove()
  })

  it('collapses branches from the count pill and emits toggle', () => {
    const el = document.createElement('aurora-orgchart') as AuroraOrgchart
    document.body.append(el)
    el.nodes = JSON.parse(JSON.stringify(ORG))
    let toggled: { collapsed: boolean } | null = null
    el.addEventListener('aurora-toggle', (e) => {
      toggled = (e as CustomEvent<{ collapsed: boolean }>).detail
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('.kids[data-k="Grace Hopper"]')?.click()
    expect(toggled).toEqual(expect.objectContaining({ collapsed: true }))
    expect(el.shadowRoot?.querySelectorAll('.card').length).toBe(3)
    expect(el.shadowRoot?.querySelector('.kids[data-k="Grace Hopper"]')?.textContent).toBe('+1')
    el.remove()
  })

  it('selects a person and highlights the card', () => {
    const el = document.createElement('aurora-orgchart') as AuroraOrgchart
    document.body.append(el)
    el.nodes = ORG
    let got = ''
    el.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ node: { name: string } }>).detail.node.name
    })
    el.shadowRoot?.querySelector<HTMLElement>('.card[data-n="Margaret Hamilton"]')?.click()
    expect(got).toBe('Margaret Hamilton')
    expect(
      el.shadowRoot
        ?.querySelector('.card[data-n="Margaret Hamilton"]')
        ?.classList.contains('selected'),
    ).toBe(true)
    el.remove()
  })
})
