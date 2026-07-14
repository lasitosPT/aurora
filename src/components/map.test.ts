import { describe, expect, it } from 'vitest'
import './map'
import type { AuroraMap, GeoJson } from './map'

const GEO: GeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'North' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 10],
            [10, 10],
            [10, 20],
            [0, 20],
            [0, 10],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'South' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      },
    },
  ],
}

function make(): AuroraMap {
  const el = document.createElement('aurora-map') as AuroraMap
  document.body.append(el)
  el.geo = GEO
  el.data = { North: 80, South: 20 }
  return el
}

describe('aurora-map', () => {
  it('projects features into region paths with a value legend', () => {
    const el = make()
    const regions = el.shadowRoot?.querySelectorAll('path.region')
    expect(regions?.length).toBe(2)
    expect(regions?.[0]?.getAttribute('aria-label')).toBe('North')
    expect(el.shadowRoot?.querySelector('.legend')?.textContent).toContain('20')
    expect(el.shadowRoot?.querySelector('.legend')?.textContent).toContain('80')
    const d = regions?.[0]?.getAttribute('d') ?? ''
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    el.remove()
  })

  it('shades regions by value along the scale', () => {
    const el = make()
    const north = el.shadowRoot?.querySelector('path.region[data-n="North"]')
    const south = el.shadowRoot?.querySelector('path.region[data-n="South"]')
    expect(north?.getAttribute('fill')).toContain('92%')
    expect(south?.getAttribute('fill')).toContain('14%')
    el.remove()
  })

  it('selects regions and emits name and value', () => {
    const el = make()
    let got: { name: string; value: number } | null = null
    el.addEventListener('aurora-select', (e) => {
      got = (e as CustomEvent<{ name: string; value: number }>).detail
    })
    el.shadowRoot
      ?.querySelector<SVGPathElement>('path.region[data-n="North"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(got).toEqual({ name: 'North', value: 80 })
    el.remove()
  })
})
