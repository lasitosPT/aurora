import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; position: relative; }
  canvas { display: block; width: 100%; height: 100%; }
`

/**
 * `<aurora-wave>` — a wireframe ocean: a plane displaced by travelling sine
 * waves, viewed from a low angle. Attributes: `color`, `speed`, `amplitude`,
 * `opacity`.
 *
 * Import from `aurora/three` so the Three.js dependency is only pulled when used.
 */
export class AuroraWave extends AuroraElement {
  private renderer: WebGLRenderer | null = null
  private frame = 0
  private observer: ResizeObserver | null = null

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
    const camera = new PerspectiveCamera(50, width / height, 0.1, 50)
    camera.position.set(0, 1.1, 3.2)
    camera.lookAt(0, 0, 0)

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    this.renderer = renderer

    const geometry = new PlaneGeometry(9, 5, 90, 50)
    const material = new MeshBasicMaterial({
      color: new Color(this.getAttribute('color') ?? '#6d5cff'),
      wireframe: true,
      transparent: true,
      opacity: this.numberAttr('opacity', 0.45),
      side: DoubleSide,
    })
    const mesh = new Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2.35
    scene.add(mesh)

    const position = geometry.attributes.position
    if (!position) return
    const amplitude = this.numberAttr('amplitude', 0.4)
    const speed = this.numberAttr('speed', 1)
    const displace = (t: number): void => {
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i)
        const y = position.getY(i)
        position.setZ(i, Math.sin(x * 1.1 + t) * Math.cos(y * 1.4 + t * 0.7) * amplitude)
      }
      position.needsUpdate = true
    }

    if (prefersReducedMotion()) {
      displace(1.5)
      renderer.render(scene, camera)
    } else {
      const t0 = performance.now()
      const animate = (): void => {
        displace(((performance.now() - t0) / 1000) * speed)
        renderer.render(scene, camera)
        this.frame = requestAnimationFrame(animate)
      }
      animate()
    }

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
    this.renderer?.dispose()
  }
}

register('aurora-wave', AuroraWave)
