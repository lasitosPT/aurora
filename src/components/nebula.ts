import { AuroraElement } from '../core/base'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'
import { whenVisible } from '../core/visible'

const STYLE = `
  :host { display: block; position: relative; }
  canvas { display: block; width: 100%; height: 100%; }
`

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `
precision highp float;
uniform vec2 uR;
uniform float uT;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform float uGlow;

float h21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}
float n2(vec2 p){
  vec2 i=floor(p),f=fract(p);
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.,a=.55;
  mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){v+=a*n2(p);p=m*p;a*=.5;}
  return v;
}

void main(){
  vec2 uv=gl_FragCoord.xy/uR;
  vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;
  float t=uT*.05;

  float q=fbm(vec2(p.x*1.4+t,p.y*2.-t*.35));
  float r=fbm(vec2(p.x*2.2-t*.6,p.y*1.2+t*.25)+q*1.5);
  float curtain=smoothstep(.25,.95,r);
  float yfall=smoothstep(-.55,.55,p.y+q*.4);
  float glow=curtain*yfall;

  vec3 aur=mix(uColA,uColB,smoothstep(.2,.9,q));
  aur=mix(aur,uColC,r*.35);

  vec3 col=vec3(.024,.024,.04);
  col+=aur*glow*.8*uGlow;
  col+=aur*pow(glow,3.)*.6*uGlow;

  float s=h21(floor(gl_FragCoord.xy/max(1.75,uR.y/520.)));
  float star=smoothstep(.997,1.,s)*(.35+.65*n2(gl_FragCoord.xy*.5+uT*.3));
  col+=star*(1.-glow)*.45;

  float d=length(uv-vec2(.5,.42));
  col*=1.-d*d*.55;
  col+=(h21(gl_FragCoord.xy+fract(uT))-.5)/255.;
  gl_FragColor=vec4(col,1.);
}`

function hexToRgb(
  hex: string | null,
  fallback: [number, number, number],
): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? '')
  if (!match || !match[1]) return fallback
  const n = parseInt(match[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/**
 * `<aurora-nebula>` — an animated aurora-borealis backdrop rendered with a tiny
 * raw-WebGL fragment shader (no 3D library involved). Attributes: `color`,
 * `color2`, `color3` (the curtain palette), `speed`, `glow`, `still`.
 *
 * GPU work is deferred until the element first becomes visible, the pixel ratio
 * is capped at 2, rendering pauses off-screen and in hidden tabs, and a lost
 * WebGL context (e.g. evicted by the browser) is transparently rebuilt on
 * restore. `prefers-reduced-motion` gets a single still frame.
 */
export class AuroraNebula extends AuroraElement {
  private frame = 0
  private inView = true
  private io: IntersectionObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private onVisibility: (() => void) | null = null
  private cancelVisible: (() => void) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><canvas></canvas>`
    const canvas = this.root.querySelector('canvas')
    if (!canvas) return

    // No GPU cost until the backdrop is actually on screen.
    this.cancelVisible = whenVisible(this, () => this.boot(canvas), 0)

    // Browsers evict WebGL contexts under pressure; rebuild ours on restore.
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      this.stopLoop()
    })
    canvas.addEventListener('webglcontextrestored', () => this.boot(canvas))
  }

  disconnectedCallback(): void {
    this.stopLoop()
    this.teardownObservers()
    this.cancelVisible?.()
  }

  private stopLoop(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private teardownObservers(): void {
    this.io?.disconnect()
    this.io = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    if (this.onVisibility) {
      document.removeEventListener('visibilitychange', this.onVisibility)
      this.onVisibility = null
    }
  }

  private boot(canvas: HTMLCanvasElement): void {
    this.stopLoop()
    this.teardownObservers()

    // Bail out gracefully where WebGL is unavailable (e.g. a test environment).
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
    if (!gl || gl.isContextLost()) return

    const compile = (type: number, src: string): WebGLShader | null => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, src)
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

    const uR = gl.getUniformLocation(program, 'uR')
    const uT = gl.getUniformLocation(program, 'uT')
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uColA'),
      hexToRgb(this.getAttribute('color'), [0.427, 0.361, 1]),
    )
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uColB'),
      hexToRgb(this.getAttribute('color2'), [0.133, 0.827, 0.933]),
    )
    gl.uniform3fv(
      gl.getUniformLocation(program, 'uColC'),
      hexToRgb(this.getAttribute('color3'), [0.72, 0.35, 0.98]),
    )
    gl.uniform1f(gl.getUniformLocation(program, 'uGlow'), this.numberAttr('glow', 1))

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
    const draw = (t: number): void => {
      gl.uniform2f(uR, width, height)
      gl.uniform1f(uT, t)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const still = prefersReducedMotion() || this.hasAttribute('still')
    const speed = this.numberAttr('speed', 1)
    const t0 = performance.now()
    const loop = (): void => {
      draw(((performance.now() - t0) / 1000) * speed)
      this.frame = requestAnimationFrame(loop)
    }
    const start = (): void => {
      if (!this.frame && this.inView && !document.hidden && !still) {
        this.frame = requestAnimationFrame(loop)
      }
    }

    resize()
    if (still) draw(4)
    else start()

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        resize()
        if (still) draw(4)
      })
      this.resizeObserver.observe(this)
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver(([entry]) => {
        this.inView = Boolean(entry?.isIntersecting)
        if (this.inView) start()
        else this.stopLoop()
      })
      this.io.observe(this)
    }
    this.onVisibility = (): void => {
      if (document.hidden) this.stopLoop()
      else start()
    }
    document.addEventListener('visibilitychange', this.onVisibility)
  }
}

register('aurora-nebula', AuroraNebula)
