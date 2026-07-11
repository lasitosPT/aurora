import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from 'three'
import { AuroraElement } from '../core/base'
import { clamp, prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; position: relative; }
  canvas { display: block; width: 100%; height: 100%; }
`

/**
 * `<aurora-particles>` — a drifting GPU particle field with additive glow and a
 * gentle pointer parallax, colored along a two-tone gradient. Attributes:
 * `count` (default 1800), `color`, `color2`, `size`, `speed`.
 *
 * Import from `aurora/three` so the Three.js dependency is only pulled when used.
 */
export class AuroraParticles extends AuroraElement {
  private renderer: WebGLRenderer | null = null
  private frame = 0
  private observer: ResizeObserver | null = null
  private onPointer: ((event: PointerEvent) => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><canvas></canvas>`
    const canvas = this.root.querySelector('canvas')
    if (!canvas) return

    // Bail out gracefully where WebGL is unavailable (e.g. a test environment).
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return

    const width = this.clientWidth || 300
    const height = this.clientHeight || 300

    const scene = new Scene()
    const camera = new PerspectiveCamera(55, width / height, 0.1, 50)
    camera.position.z = 4

    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    this.renderer = renderer

    const count = clamp(this.numberAttr('count', 1800), 1, 20000)
    const colorA = new Color(this.getAttribute('color') ?? '#6d5cff')
    const colorB = new Color(this.getAttribute('color2') ?? '#22d3ee')

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const mixed = new Color()
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      mixed.copy(colorA).lerp(colorB, Math.random())
      colors[i * 3] = mixed.r
      colors[i * 3 + 1] = mixed.g
      colors[i * 3 + 2] = mixed.b
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))

    const material = new PointsMaterial({
      size: this.numberAttr('size', 0.035),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const points = new Points(geometry, material)
    scene.add(points)

    const reduce = prefersReducedMotion()
    const speed = this.numberAttr('speed', 1)
    let targetX = 0
    let targetY = 0
    this.onPointer = (event: PointerEvent): void => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 0.6
      targetY = (event.clientY / window.innerHeight - 0.5) * 0.4
    }
    if (!reduce) window.addEventListener('pointermove', this.onPointer, { passive: true })

    const animate = (): void => {
      if (!reduce) {
        points.rotation.y += 0.0004 * speed
        points.rotation.x += 0.0001 * speed
        camera.position.x += (targetX - camera.position.x) * 0.03
        camera.position.y += (-targetY - camera.position.y) * 0.03
        camera.lookAt(0, 0, 0)
      }
      renderer.render(scene, camera)
      this.frame = requestAnimationFrame(animate)
    }
    animate()

    this.observer = new ResizeObserver(() => {
      const w = this.clientWidth || 300
      const h = this.clientHeight || 300
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    this.observer.observe(this)
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.frame)
    this.observer?.disconnect()
    if (this.onPointer) window.removeEventListener('pointermove', this.onPointer)
    this.renderer?.dispose()
  }
}

register('aurora-particles', AuroraParticles)
