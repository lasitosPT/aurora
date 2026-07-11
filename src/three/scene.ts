import {
  Color,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  WireframeGeometry,
} from 'three'
import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; position: relative; }
  canvas { display: block; width: 100%; height: 100%; }
`

/**
 * `<aurora-scene>` — a lightweight animated 3D backdrop: a rotating wireframe
 * icosahedron rendered with Three.js. Attributes: `color`, `detail`, `speed`.
 *
 * Import from `aurora/three` so the Three.js dependency is only pulled when used.
 */
export class AuroraScene extends AuroraElement {
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
    const camera = new PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.z = 3.2

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    this.renderer = renderer

    const geometry = new WireframeGeometry(new IcosahedronGeometry(1, this.numberAttr('detail', 1)))
    const material = new LineBasicMaterial({
      color: new Color(this.getAttribute('color') ?? '#6d5cff'),
      transparent: true,
      opacity: 0.9,
    })
    const mesh = new LineSegments(geometry, material)
    scene.add(mesh)

    const reduce = prefersReducedMotion()
    const speed = this.numberAttr('speed', 1)
    const animate = (): void => {
      if (!reduce) {
        mesh.rotation.x += 0.0015 * speed
        mesh.rotation.y += 0.0025 * speed
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
    this.renderer?.dispose()
  }
}

register('aurora-scene', AuroraScene)
