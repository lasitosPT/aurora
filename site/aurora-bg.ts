// Raw-WebGL aurora shader for the hero — a single fullscreen triangle with a
// domain-warped fbm fragment shader. No three.js needed: ~3 kB instead of 130.
type Cleanup = () => void

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `
precision highp float;
uniform vec2 uR;
uniform float uT;

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

  // domain-warped curtains
  float q=fbm(vec2(p.x*1.4+t,p.y*2.-t*.35));
  float r=fbm(vec2(p.x*2.2-t*.6,p.y*1.2+t*.25)+q*1.5);
  float curtain=smoothstep(.25,.95,r);

  // strongest in the upper half, fading toward the content area
  float yfall=smoothstep(-.55,.55,p.y+q*.4);
  float glow=curtain*yfall;

  vec3 violet=vec3(.427,.361,1.);
  vec3 cyan=vec3(.133,.827,.933);
  vec3 magenta=vec3(.72,.35,.98);
  vec3 aur=mix(violet,cyan,smoothstep(.2,.9,q));
  aur=mix(aur,magenta,r*.35);

  vec3 col=vec3(.024,.024,.04);
  col+=aur*glow*.8;
  col+=aur*pow(glow,3.)*.6;

  // sparse stars, dimmed where the aurora glows
  float s=h21(floor(gl_FragCoord.xy/max(1.75,uR.y/520.)));
  float star=smoothstep(.997,1.,s)*(.35+.65*n2(gl_FragCoord.xy*.5+uT*.3));
  col+=star*(1.-glow)*.45;

  // vignette + dither
  float d=length(uv-vec2(.5,.42));
  col*=1.-d*d*.55;
  col+=(h21(gl_FragCoord.xy+fract(uT))-.5)/255.;
  gl_FragColor=vec4(col,1.);
}`

export function mountAurora(canvas: HTMLCanvasElement, opts: { still?: boolean } = {}): Cleanup {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  })
  if (!gl) {
    canvas.style.display = 'none'
    return () => undefined
  }

  const compile = (type: number, src: string): WebGLShader => {
    const shader = gl.createShader(type)
    if (!shader) throw new Error('shader alloc failed')
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return shader
  }

  const prog = gl.createProgram()
  if (!prog) return () => undefined
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  gl.useProgram(prog)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const uR = gl.getUniformLocation(prog, 'uR')
  const uT = gl.getUniformLocation(prog, 'uT')

  let w = 0
  let h = 0
  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    if (!cw || !ch) return
    w = Math.round(cw * dpr)
    h = Math.round(ch * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }
  }

  const draw = (t: number): void => {
    gl.uniform2f(uR, w, h)
    gl.uniform1f(uT, t)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  let raf = 0
  let inView = true
  const t0 = performance.now()
  const loop = (): void => {
    draw((performance.now() - t0) / 1000)
    raf = requestAnimationFrame(loop)
  }
  const start = (): void => {
    if (!raf && inView && !document.hidden && !opts.still) raf = requestAnimationFrame(loop)
  }
  const stop = (): void => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  resize()
  const onResize = (): void => {
    resize()
    if (opts.still) draw(4)
  }
  window.addEventListener('resize', onResize)
  const io = new IntersectionObserver(([entry]) => {
    inView = Boolean(entry?.isIntersecting)
    if (inView) start()
    else stop()
  })
  io.observe(canvas)
  const onVis = (): void => {
    if (document.hidden) stop()
    else start()
  }
  document.addEventListener('visibilitychange', onVis)

  if (opts.still) draw(4)
  else start()

  return () => {
    stop()
    io.disconnect()
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVis)
  }
}
