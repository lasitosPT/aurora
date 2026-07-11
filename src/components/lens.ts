import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: block; position: relative; overflow: hidden; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.35s ease;
    pointer-events: none;
  }
  canvas.is-ready { opacity: 1; }
`

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uR;
uniform vec2 uImg;
uniform vec2 uMouse;
uniform float uS;

vec2 cover(vec2 uv){
  float rc=uR.x/uR.y;
  float ri=uImg.x/uImg.y;
  vec2 s=rc>ri?vec2(1.,ri/rc):vec2(rc/ri,1.);
  return (uv-.5)*s+.5;
}

void main(){
  vec2 uv=gl_FragCoord.xy/uR;
  vec2 toM=uv-uMouse;
  float dist=length(toM*vec2(uR.x/uR.y,1.));
  float bulge=uS*.15*smoothstep(.55,.08,dist);
  vec2 dir=normalize(toM+vec2(1e-5));
  vec2 duv=uv-dir*bulge;
  float ab=bulge*.18;
  float r=texture2D(uTex,cover(duv-dir*ab)).r;
  float g=texture2D(uTex,cover(duv)).g;
  float b=texture2D(uTex,cover(duv+dir*ab)).b;
  gl_FragColor=vec4(r,g,b,1.);
}`

/**
 * `<aurora-lens src="..." alt="...">` — an image that liquifies toward the
 * cursor with a chromatic-aberration fringe, rendered by a tiny raw-WebGL
 * shader. A real `<img>` underneath keeps accessibility, SEO and no-WebGL
 * environments intact. Attributes: `src`, `alt`, `strength`, `crossorigin`.
 * GPU work is deferred until visible; a lost context rebuilds on restore.
 */
export class AuroraLens extends AuroraElement {
  private frame = 0
  private hover = false
  private sx = 0
  private tx = 0
  private mx = 0.5
  private my = 0.5
  private tmx = 0.5
  private tmy = 0.5
  private resizeObserver: ResizeObserver | null = null
  private cancelVisible: (() => void) | null = null
  private onEnter: (() => void) | null = null
  private onMove: ((event: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null

  connectedCallback(): void {
    const src = this.getAttribute('src') ?? ''
    this.root.innerHTML = `<style>${STYLE}</style><img alt="" /><canvas aria-hidden="true"></canvas>`
    const img = this.root.querySelector('img')
    const canvas = this.root.querySelector('canvas')
    if (!img || !canvas) return
    img.alt = this.getAttribute('alt') ?? ''
    const cors = this.getAttribute('crossorigin')
    if (cors !== null) img.crossOrigin = cors
    if (src) img.src = src

    if (!src || prefersReducedMotion()) return

    const bootWhenLoaded = (): void => {
      if (img.complete && img.naturalWidth > 0) this.boot(canvas, img)
      else img.addEventListener('load', () => this.boot(canvas, img), { once: true })
    }
    this.cancelVisible = whenVisible(this, bootWhenLoaded, 0)

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      this.stopLoop()
      canvas.classList.remove('is-ready')
    })
    canvas.addEventListener('webglcontextrestored', () => bootWhenLoaded())
  }

  disconnectedCallback(): void {
    this.stopLoop()
    this.resizeObserver?.disconnect()
    this.cancelVisible?.()
    if (this.onEnter) this.removeEventListener('pointerenter', this.onEnter)
    if (this.onMove) this.removeEventListener('pointermove', this.onMove)
    if (this.onLeave) this.removeEventListener('pointerleave', this.onLeave)
  }

  private stopLoop(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private boot(canvas: HTMLCanvasElement, img: HTMLImageElement): void {
    this.stopLoop()
    this.resizeObserver?.disconnect()

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    })
    if (!gl || gl.isContextLost()) return

    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }
    const vert = compile(gl.VERTEX_SHADER, VERT)
    const frag = compile(gl.FRAGMENT_SHADER, FRAG)
    const program = gl.createProgram()
    if (!vert || !frag || !program) return
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    gl.useProgram(program)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    // NPOT-safe texture from the already-loaded <img>.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    gl.uniform2f(gl.getUniformLocation(program, 'uImg'), img.naturalWidth, img.naturalHeight)
    gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0)
    const uR = gl.getUniformLocation(program, 'uR')
    const uMouse = gl.getUniformLocation(program, 'uMouse')
    const uS = gl.getUniformLocation(program, 'uS')
    const strength = this.numberAttr('strength', 1)

    let width = 0
    let height = 0
    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cw = canvas.clientWidth || this.clientWidth
      const ch = canvas.clientHeight || this.clientHeight
      if (!cw || !ch) return
      width = Math.round(cw * dpr)
      height = Math.round(ch * dpr)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }
    const draw = (): void => {
      gl.uniform2f(uR, width, height)
      gl.uniform2f(uMouse, this.mx, this.my)
      gl.uniform1f(uS, this.sx * strength)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = (): void => {
      this.sx += (this.tx - this.sx) * 0.08
      this.mx += (this.tmx - this.mx) * 0.14
      this.my += (this.tmy - this.my) * 0.14
      draw()
      if (!this.hover && this.sx < 0.004) {
        this.sx = 0
        draw()
        this.stopLoop()
        return
      }
      this.frame = requestAnimationFrame(loop)
    }
    const startLoop = (): void => {
      if (!this.frame) this.frame = requestAnimationFrame(loop)
    }

    resize()
    draw()
    canvas.classList.add('is-ready')

    this.onEnter = (): void => {
      this.hover = true
      this.tx = 1
      startLoop()
    }
    this.onMove = (event: PointerEvent): void => {
      const rect = this.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      this.tmx = (event.clientX - rect.left) / rect.width
      this.tmy = 1 - (event.clientY - rect.top) / rect.height
    }
    this.onLeave = (): void => {
      this.hover = false
      this.tx = 0
      startLoop()
    }
    this.addEventListener('pointerenter', this.onEnter)
    this.addEventListener('pointermove', this.onMove)
    this.addEventListener('pointerleave', this.onLeave)

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        resize()
        draw()
      })
      this.resizeObserver.observe(this)
    }
  }
}

register('aurora-lens', AuroraLens)
