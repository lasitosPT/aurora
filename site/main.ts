import 'aurora'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (reduced) document.documentElement.classList.add('reduced')

/* ---------- hero backdrop: <aurora-nebula> from the library ---------- */
const nebula = document.querySelector<HTMLElement>('.gl')
if (nebula) {
  gsap.to(nebula, { opacity: 1, duration: reduced ? 0 : 1.8, ease: 'power2.out', delay: 0.15 })
}

/* ---------- lazy three.js demo cards ---------- */
const threeStages = ['sceneStage', 'particlesStage']
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => el !== null)
if (threeStages.length > 0) {
  let loaded = false
  const io = new IntersectionObserver(
    (entries) => {
      if (!loaded && entries.some((e) => e.isIntersecting)) {
        loaded = true
        io.disconnect()
        void import('aurora/three').then(() =>
          threeStages.forEach((stage) => stage.classList.add('is-loaded')),
        )
      }
    },
    { rootMargin: '600px' },
  )
  threeStages.forEach((stage) => io.observe(stage))
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

/* ---------- replay buttons: re-mount the card's component ---------- */
document.querySelectorAll<HTMLButtonElement>('.replay').forEach((btn) => {
  btn.addEventListener('click', () => {
    const el = btn
      .closest('.stage')
      ?.querySelector('aurora-text, aurora-typewriter, aurora-scramble')
    if (el) el.replaceWith(el.cloneNode(true))
  })
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

  /* stat counters are <aurora-counter> components — no site code needed */

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
  /* reduced motion: everything visible (the components handle their own fallbacks) */
  const loader = document.querySelector<HTMLElement>('.loader')
  if (loader) loader.style.display = 'none'
}
