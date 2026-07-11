import 'aurora'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(pointer: fine)').matches
if (reduced) document.documentElement.classList.add('reduced')

/* ---------- WebGL aurora hero (lazy, ~3 kB) ---------- */
const glCanvas = document.querySelector<HTMLCanvasElement>('.gl')
if (glCanvas) {
  void import('./aurora-bg').then(({ mountAurora }) => {
    mountAurora(glCanvas, { still: reduced })
    gsap.to(glCanvas, { opacity: 1, duration: reduced ? 0 : 1.8, ease: 'power2.out', delay: 0.15 })
  })
}

/* ---------- lazy three.js demo card ---------- */
const sceneStage = document.getElementById('sceneStage')
if (sceneStage) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        void import('aurora/three').then(() => sceneStage.classList.add('is-loaded'))
      }
    },
    { rootMargin: '600px' },
  )
  io.observe(sceneStage)
}

/* ---------- copy buttons ---------- */
document.querySelectorAll<HTMLButtonElement>('.copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const pre = btn.parentElement?.querySelector('pre')
    void navigator.clipboard?.writeText(pre?.textContent ?? '').catch(() => undefined)
    const previous = btn.textContent
    btn.textContent = 'Copied'
    btn.classList.add('is-copied')
    window.setTimeout(() => {
      btn.textContent = previous
      btn.classList.remove('is-copied')
    }, 1400)
  })
})

/* ---------- aurora-text replay ---------- */
document.querySelector('.replay')?.addEventListener('click', () => {
  const el = document.querySelector('#textStage aurora-text')
  if (el) el.replaceWith(el.cloneNode(true))
})

/* ---------- nav state ---------- */
const nav = document.querySelector('.nav')
window.addEventListener('scroll', () => nav?.classList.toggle('is-scrolled', window.scrollY > 24), {
  passive: true,
})

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

/* ---------- motion choreography ---------- */
if (!reduced) {
  /* cursor glow (desktop) */
  if (finePointer) {
    const cursor = document.querySelector<HTMLElement>('.cursor')
    if (cursor) {
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' })
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' })
      let shown = false
      window.addEventListener('pointermove', (e) => {
        if (!shown) {
          shown = true
          gsap.set(cursor, { x: e.clientX, y: e.clientY })
          gsap.to(cursor, { opacity: 1, duration: 0.4 })
        }
        xTo(e.clientX)
        yTo(e.clientY)
      })
      document.addEventListener('mouseover', (e) => {
        const target = e.target as Element | null
        cursor.classList.toggle('is-active', Boolean(target?.closest?.('[data-hover]')))
      })
    }
  }

  /* hero title: chars for plain lines, a masked block for the gradient line
     (SplitText chars would break background-clip: text) */
  const split = new SplitText('.hero-title .line:not(.line-grad)', { type: 'chars' })
  const gradInner = document.querySelector('.hero-title .line-grad .inner')
  gsap.set(split.chars, { yPercent: 118 })
  if (gradInner) gsap.set(gradInner, { yPercent: 118 })
  gsap.set('[data-intro]', { autoAlpha: 0, y: 26 })

  /* preloader → hero intro */
  const loader = document.querySelector<HTMLElement>('.loader')
  const seen = sessionStorage.getItem('aurora:seen') === '1'
  sessionStorage.setItem('aurora:seen', '1')

  const intro = gsap.timeline({ paused: true })
  intro.to(split.chars, {
    yPercent: 0,
    duration: 1.1,
    ease: 'power4.out',
    stagger: 0.018,
  })
  if (gradInner) {
    intro.to(gradInner, { yPercent: 0, duration: 1.1, ease: 'power4.out' }, 0.32)
  }
  intro.to(
    '[data-intro]',
    { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09 },
    '-=0.7',
  )

  if (loader && !seen) {
    const word = new SplitText('.loader-word', { type: 'chars' })
    gsap.set(word.chars, { yPercent: 120 })
    gsap
      .timeline()
      .to(word.chars, { yPercent: 0, duration: 0.6, ease: 'power3.out', stagger: 0.035 })
      .to('.loader-bar i', { scaleX: 1, duration: 0.55, ease: 'power2.inOut' }, '-=0.25')
      .to(loader, { yPercent: -100, duration: 0.75, ease: 'power4.inOut' }, '+=0.1')
      .set(loader, { display: 'none' })
      .add(() => intro.play(), '-=0.55')
  } else {
    if (loader) loader.style.display = 'none'
    intro.play()
  }

  /* hero parallax on scroll */
  gsap.to('.hero-inner', {
    yPercent: -14,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to('.gl', {
    scale: 1.08,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to('.scroll-hint', {
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '18% top', scrub: true },
  })

  /* manifesto lines — masked inner blocks (gradient-safe) */
  document.querySelectorAll<HTMLElement>('.mline .inner').forEach((inner) => {
    gsap.from(inner, {
      yPercent: 115,
      duration: 1,
      ease: 'power4.out',
      scrollTrigger: { trigger: inner, start: 'top 88%', once: true },
    })
  })

  /* generic reveals */
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 36 })
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        overwrite: true,
      }),
  })

  /* stat counters */
  document.querySelectorAll<HTMLElement>('.num').forEach((el) => {
    const target = Number(el.dataset.count ?? '0')
    const state = { v: 0 }
    gsap.to(state, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => {
        el.textContent = String(Math.round(state.v))
      },
    })
  })

  /* footer giant */
  const giant = new SplitText('.giant', { type: 'chars' })
  gsap.from(giant.chars, {
    yPercent: 118,
    duration: 1,
    ease: 'power4.out',
    stagger: 0.03,
    scrollTrigger: { trigger: '.giant', start: 'top 88%', once: true },
  })

  /* keep trigger positions honest once fonts/layout settle */
  void document.fonts?.ready.then(() => ScrollTrigger.refresh())
} else {
  /* reduced motion: everything visible, counters set instantly */
  document.querySelectorAll<HTMLElement>('.num').forEach((el) => {
    el.textContent = el.dataset.count ?? el.textContent
  })
  const loader = document.querySelector<HTMLElement>('.loader')
  if (loader) loader.style.display = 'none'
}
