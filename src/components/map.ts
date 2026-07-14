import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

interface GeoFeature {
  type: 'Feature'
  properties?: Record<string, unknown>
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

export interface GeoJson {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

const STYLE = `
  :host {
    display: block; position: relative; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; background: var(--aurora-surface, #0f0f18); overflow: hidden;
  }
  svg { display: block; width: 100%; height: var(--aurora-map-height, 320px); }
  path.region {
    stroke: var(--aurora-surface, #0f0f18); stroke-width: 1; cursor: pointer;
    transition: filter 0.15s ease;
  }
  path.region:hover { filter: brightness(1.35); }
  path.region.selected { stroke: #fff; stroke-width: 1.6; }
  .tip {
    position: absolute; pointer-events: none; display: none; padding: 6px 11px;
    font-size: 0.8rem; background: var(--aurora-surface, #16161f);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.16));
    border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); white-space: nowrap; z-index: 2;
  }
  .legend {
    position: absolute; left: 12px; bottom: 10px; display: flex; align-items: center; gap: 7px;
    font-size: 0.7rem; color: var(--aurora-muted, #9a98b3);
  }
  .scale { width: 90px; height: 8px; border-radius: 4px; }
`

/**
 * `<aurora-map>` — an SVG choropleth with no tile servers: assign `geo`
 * (a GeoJSON FeatureCollection of polygons) and `data`
 * (`{ regionName: value }`); regions project onto the canvas, fill along an
 * accent color scale, tooltip with name and value on hover, and emit
 * `aurora-select` on click. `name-key` picks the feature property used as
 * the region name (default `name`).
 */
export class AuroraMap extends AuroraElement {
  #geo: GeoJson | null = null
  #data: Record<string, number> = {}
  private selected: string | null = null

  get geo(): GeoJson | null {
    return this.#geo
  }

  set geo(v: GeoJson | null) {
    this.#geo = v
    this.render()
  }

  get data(): Record<string, number> {
    return this.#data
  }

  set data(v: Record<string, number>) {
    this.#data = v ?? {}
    this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  private nameOf(f: GeoFeature): string {
    const key = this.getAttribute('name-key') ?? 'name'
    return String(f.properties?.[key] ?? '')
  }

  private rings(f: GeoFeature): number[][][] {
    if (f.geometry.type === 'Polygon') return f.geometry.coordinates as number[][][]
    return (f.geometry.coordinates as number[][][][]).flat()
  }

  private render(): void {
    if (!this.#geo?.features.length) {
      this.root.innerHTML = `<style>${STYLE}</style><svg viewBox="0 0 800 400"></svg><div class="tip"></div>`
      return
    }
    // fit: equirectangular projection scaled to the bounding box
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const f of this.#geo.features)
      for (const ring of this.rings(f))
        for (const [lon = 0, lat = 0] of ring) {
          minX = Math.min(minX, lon)
          maxX = Math.max(maxX, lon)
          minY = Math.min(minY, lat)
          maxY = Math.max(maxY, lat)
        }
    const W = 800
    const H = 400
    const pad = 24
    const sx = (W - pad * 2) / (maxX - minX || 1)
    const sy = (H - pad * 2) / (maxY - minY || 1)
    const s = Math.min(sx, sy)
    const ox = pad + (W - pad * 2 - (maxX - minX) * s) / 2
    const oy = pad + (H - pad * 2 - (maxY - minY) * s) / 2
    const px = (lon: number): number => ox + (lon - minX) * s
    const py = (lat: number): number => oy + (maxY - lat) * s

    const values = Object.values(this.#data)
    const lo = values.length ? Math.min(...values) : 0
    const hi = values.length ? Math.max(...values) : 1
    const shade = (name: string): string => {
      const v = this.#data[name]
      if (v === undefined) return 'rgba(255,255,255,0.06)'
      const t = hi === lo ? 1 : (v - lo) / (hi - lo)
      return `color-mix(in srgb, var(--aurora-accent, #6d5cff) ${Math.round(14 + t * 78)}%, #14141f)`
    }

    const paths = this.#geo.features
      .map((f) => {
        const name = this.nameOf(f)
        const d = this.rings(f)
          .map(
            (ring) =>
              `M${ring.map(([lon = 0, lat = 0]) => `${px(lon).toFixed(1)} ${py(lat).toFixed(1)}`).join('L')}Z`,
          )
          .join('')
        return `<path class="region${name === this.selected ? ' selected' : ''}" data-n="${escapeHtml(name)}" d="${d}" fill="${shade(name)}" tabindex="0" role="button" aria-label="${escapeHtml(name)}"/>`
      })
      .join('')
    this.root.innerHTML = `<style>${STYLE}</style>
      <svg viewBox="0 0 ${W} ${H}" part="canvas" role="img" aria-label="${escapeHtml(this.getAttribute('label') ?? 'Map')}">${paths}</svg>
      <div class="tip"></div>
      ${values.length ? `<div class="legend"><span>${lo}</span><span class="scale" style="background: linear-gradient(to right, color-mix(in srgb, var(--aurora-accent, #6d5cff) 14%, #14141f), color-mix(in srgb, var(--aurora-accent, #6d5cff) 92%, #14141f))"></span><span>${hi}</span></div>` : ''}`
    this.wire()
  }

  private wire(): void {
    const tip = this.root.querySelector<HTMLElement>('.tip')
    this.root.querySelectorAll<SVGPathElement>('path.region').forEach((path) => {
      const name = path.dataset['n'] ?? ''
      path.addEventListener('pointermove', (e) => {
        if (!tip) return
        const host = this.getBoundingClientRect()
        const value = this.#data[name]
        tip.innerHTML = `<strong>${escapeHtml(name)}</strong>${value !== undefined ? `: ${value}` : ''}`
        tip.style.display = 'block'
        tip.style.left = `${e.clientX - host.left + 14}px`
        tip.style.top = `${e.clientY - host.top - 8}px`
      })
      path.addEventListener('pointerleave', () => {
        if (tip) tip.style.display = 'none'
      })
      const pick = (): void => {
        this.selected = name
        this.root
          .querySelectorAll('path.region')
          .forEach((p) => p.classList.toggle('selected', p === path))
        this.dispatchEvent(
          new CustomEvent('aurora-select', {
            detail: { name, value: this.#data[name] ?? null },
          }),
        )
      }
      path.addEventListener('click', pick)
      path.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') pick()
      })
    })
  }
}

register('aurora-map', AuroraMap)
