import { describe, expect, it } from 'vitest'
import './loader'
import './progressbar'
import type { AuroraLoader } from './loader'
import type { AuroraProgressbar } from './progressbar'

describe('aurora-loader', () => {
  it('renders each spinner type with status semantics', () => {
    for (const type of ['ring', 'dots', 'pulse']) {
      const el = document.createElement('aurora-loader') as AuroraLoader
      el.setAttribute('type', type)
      el.setAttribute('label', 'Loading data')
      document.body.append(el)
      expect(el.shadowRoot?.querySelector(`.${type}`)).not.toBeNull()
      expect(el.getAttribute('role')).toBe('status')
      expect(el.shadowRoot?.querySelector('.label')?.textContent).toBe('Loading data')
      el.remove()
    }
  })
})

describe('aurora-progressbar', () => {
  it('reports progress against max with ARIA and a readout', () => {
    const el = document.createElement('aurora-progressbar') as AuroraProgressbar
    el.setAttribute('value', '32')
    el.setAttribute('max', '64')
    el.setAttribute('label', 'Uploading')
    document.body.append(el)
    expect(el.getAttribute('role')).toBe('progressbar')
    expect(el.getAttribute('aria-valuemax')).toBe('64')
    expect(el.shadowRoot?.querySelector('.head span')?.textContent).toBe('Uploading')
    el.remove()
  })

  it('supports indeterminate mode without a readout', () => {
    const el = document.createElement('aurora-progressbar') as AuroraProgressbar
    el.setAttribute('indeterminate', '')
    el.setAttribute('label', 'Working')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.pct')).toBeNull()
    expect(el.shadowRoot?.querySelector('.fill')).not.toBeNull()
    el.remove()
  })
})
