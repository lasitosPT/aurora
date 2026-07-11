import { describe, expect, it } from 'vitest'
import './tabs'
import type { AuroraTabs } from './tabs'

function buildTabs(): AuroraTabs {
  const tabs = document.createElement('aurora-tabs') as AuroraTabs
  const rows: Array<[string, string]> = [
    ['One', 'first'],
    ['Two', 'second'],
  ]
  for (const [label, body] of rows) {
    const panel = document.createElement('aurora-tab-panel')
    panel.setAttribute('label', label)
    panel.textContent = body
    tabs.append(panel)
  }
  document.body.append(tabs)
  return tabs
}

describe('aurora-tabs', () => {
  it('registers both elements', () => {
    expect(customElements.get('aurora-tabs')).toBeTypeOf('function')
    expect(customElements.get('aurora-tab-panel')).toBeTypeOf('function')
  })

  it('renders one tab per panel and activates the first by default', () => {
    const tabs = buildTabs()
    const panels = tabs.querySelectorAll('aurora-tab-panel')
    const tabButtons = tabs.shadowRoot?.querySelectorAll('.tab')
    expect(tabButtons?.length).toBe(2)
    expect(panels[0]?.hasAttribute('active')).toBe(true)
    expect(panels[1]?.hasAttribute('active')).toBe(false)
    tabs.remove()
  })

  it('activates a panel on select', () => {
    const tabs = buildTabs()
    const panels = tabs.querySelectorAll('aurora-tab-panel')
    tabs.select(1)
    expect(panels[0]?.hasAttribute('active')).toBe(false)
    expect(panels[1]?.hasAttribute('active')).toBe(true)
    tabs.remove()
  })

  it('moves selection with arrow keys and keeps a roving tabindex', () => {
    const tabs = buildTabs()
    const tablist = tabs.shadowRoot?.querySelector('.tablist')
    const buttons = tabs.shadowRoot?.querySelectorAll<HTMLElement>('.tab')

    expect(buttons?.[0]?.tabIndex).toBe(0)
    expect(buttons?.[1]?.tabIndex).toBe(-1)

    tablist?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(buttons?.[1]?.getAttribute('aria-selected')).toBe('true')
    expect(buttons?.[1]?.tabIndex).toBe(0)
    expect(buttons?.[0]?.tabIndex).toBe(-1)

    tablist?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(buttons?.[0]?.getAttribute('aria-selected')).toBe('true')
    tabs.remove()
  })
})
