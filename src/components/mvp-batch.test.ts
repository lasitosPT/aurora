import { describe, expect, it } from 'vitest'
import './multiviewcalendar'
import './responsivepanel'
import './pager'
import type { AuroraMultiviewcalendar } from './multiviewcalendar'
import type { AuroraPager } from './pager'
import type { AuroraResponsivepanel } from './responsivepanel'

describe('aurora-multiviewcalendar', () => {
  it('renders consecutive months under shared navigation', () => {
    const el = document.createElement('aurora-multiviewcalendar') as AuroraMultiviewcalendar
    el.setAttribute('value', '2026-07-14')
    document.body.append(el)
    const cals = el.shadowRoot?.querySelectorAll('aurora-calendar')
    expect(cals?.length).toBe(2)
    const titles = Array.from(cals ?? []).map(
      (c) => c.shadowRoot?.querySelector('.title')?.textContent,
    )
    expect(titles).toEqual(['July 2026', 'August 2026'])
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-nav="1"]')?.click()
    expect(cals?.[0]?.shadowRoot?.querySelector('.title')?.textContent).toBe('August 2026')
    el.remove()
  })

  it('propagates a pick from any view as its own change event', () => {
    const el = document.createElement('aurora-multiviewcalendar') as AuroraMultiviewcalendar
    document.body.append(el)
    let got = ''
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    const cal = el.shadowRoot?.querySelector('aurora-calendar')
    cal?.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: '2026-07-20' } }))
    expect(got).toBe('2026-07-20')
    expect(el.value).toBe('2026-07-20')
    el.remove()
  })
})

describe('aurora-pager', () => {
  it('windows page numbers with ellipses and emits page changes', () => {
    const el = document.createElement('aurora-pager') as AuroraPager
    el.setAttribute('total', '240')
    el.setAttribute('page-size', '10')
    el.setAttribute('page', '12')
    document.body.append(el)
    expect(el.pages).toBe(24)
    const labels = Array.from(el.shadowRoot?.querySelectorAll('button[data-p]') ?? []).map(
      (b) => b.textContent,
    )
    expect(labels).toEqual(['‹', '1', '11', '12', '13', '24', '›'])
    let got = 0
    el.addEventListener('aurora-page', (e) => {
      got = (e as CustomEvent<{ page: number }>).detail.page
    })
    el.shadowRoot?.querySelector<HTMLButtonElement>('button[data-p="13"]')?.click()
    expect(got).toBe(13)
    expect(el.page).toBe(13)
    el.remove()
  })
})

describe('aurora-responsivepanel', () => {
  it('renders inline content and toggles open state', () => {
    const el = document.createElement('aurora-responsivepanel') as AuroraResponsivepanel
    el.innerHTML = '<nav>links</nav>'
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.panel slot')).not.toBeNull()
    el.setAttribute('narrow', '')
    let opened = false
    el.addEventListener('aurora-open', () => {
      opened = true
    })
    el.show()
    expect(opened).toBe(true)
    expect(el.hasAttribute('open')).toBe(true)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(el.hasAttribute('open')).toBe(false)
    el.remove()
  })
})
