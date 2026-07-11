import 'aurora'
import { AuroraConfetti, AuroraToaster } from 'aurora'
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
const threeStages = ['sceneStage', 'particlesStage', 'waveStage']
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

/* ---------- feature bento: spotlight + beam are <aurora-spotlight> cards ---------- */

/* ---------- feature bento: live theme swatches ---------- */
document.querySelectorAll<HTMLButtonElement>('.swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    const demo = btn.closest<HTMLElement>('.theme-demo')
    if (!demo) return
    demo.style.setProperty('--aurora-accent', btn.dataset.accent ?? '#6d5cff')
    demo.style.setProperty('--aurora-accent-hover', btn.dataset.accentHover ?? '#5a49e0')
    demo.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('is-active', s === btn))
  })
})

/* ---------- feature bento: draw the icons when the grid enters view ---------- */
const features = document.querySelector('.features')
if (features) {
  if (typeof IntersectionObserver === 'undefined') {
    features.classList.add('is-live')
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect()
          features.classList.add('is-live')
        }
      },
      { threshold: 0.15 },
    )
    io.observe(features)
  }
}

/* ---------- toast demo buttons ---------- */
document.querySelectorAll<HTMLElement>('.toast-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    AuroraToaster.show(btn.dataset.msg ?? 'Hello from aurora', {
      title: btn.dataset.title,
      variant: (btn.dataset.variant as 'success' | 'error' | undefined) ?? 'default',
    })
  })
})

/* ---------- menu + confetti demos ---------- */
document.getElementById('demoMenu')?.addEventListener('aurora-select', (event) => {
  const { value } = (event as CustomEvent<{ value: string }>).detail
  AuroraToaster.show(`"${value}" selected from the menu.`, {
    title: 'aurora-select',
    variant: value === 'Delete' ? 'error' : 'default',
  })
})
document.getElementById('confettiBtn')?.addEventListener('click', (event) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  AuroraConfetti.burst({ x: rect.left + rect.width / 2, y: rect.top, count: 130 })
  AuroraToaster.show('v0.10.0 is out the door.', { title: 'Shipped', variant: 'success' })
})

/* ---------- command palette: drives the page ---------- */
const palette = document.getElementById('sitePalette')
document.getElementById('cmdBtn')?.addEventListener('click', () => {
  ;(palette as (HTMLElement & { show(): void }) | null)?.show()
})
palette?.addEventListener('aurora-select', (event) => {
  const { value } = (event as CustomEvent<{ value: string }>).detail
  if (value === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
  else if (value === 'components')
    document.getElementById('components')?.scrollIntoView({ behavior: 'smooth' })
  else if (value === 'install')
    document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' })
  else if (value === 'github') window.open('https://github.com/lasitosPT/aurora', '_blank')
  else if (value === 'toast')
    AuroraToaster.show('Summoned from the palette.', { title: '⌘K', variant: 'default' })
  else if (value === 'confetti') AuroraConfetti.burst({ count: 130 })
})

/* ---------- drawer demo ---------- */
document.getElementById('drawerBtn')?.addEventListener('click', () => {
  ;(document.getElementById('demoDrawer') as (HTMLElement & { show(): void }) | null)?.show()
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

  /* Scroll-entry effects use IntersectionObserver (like aurora-reveal in the
     library): unlike position-based triggers, IO can't miss elements on instant
     jumps — anchor loads, scroll restoration, programmatic scrolls. */
  const onVisible = (el: Element, cb: () => void, threshold = 0.12): void => {
    if (typeof IntersectionObserver === 'undefined') {
      cb()
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect()
          cb()
        }
      },
      { threshold },
    )
    io.observe(el)
  }

  /* manifesto lines — masked inner blocks (gradient-safe). Observe the in-flow
     .mline wrapper, NOT the inner: the inner starts translated outside its
     overflow-hidden parent, so its own intersection area is zero and an
     observer on it would never fire. */
  document.querySelectorAll<HTMLElement>('.mline').forEach((line) => {
    const inner = line.querySelector('.inner')
    if (!inner) return
    gsap.set(inner, { yPercent: 115 })
    onVisible(line, () => gsap.to(inner, { yPercent: 0, duration: 1, ease: 'power4.out' }))
  })

  /* generic reveals — batched per IO flush so neighbours stagger together */
  const revealEls = gsap.utils.toArray<HTMLElement>('[data-reveal]')
  gsap.set(revealEls, { autoAlpha: 0, y: 36 })
  if (typeof IntersectionObserver === 'undefined') {
    gsap.set(revealEls, { autoAlpha: 1, y: 0 })
  } else {
    let queue: Element[] = []
    let flush = 0
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            queue.push(entry.target)
            io.unobserve(entry.target)
          }
        }
        if (queue.length > 0 && !flush) {
          flush = window.setTimeout(() => {
            gsap.to(queue, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.08,
              overwrite: true,
            })
            queue = []
            flush = 0
          }, 60)
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    revealEls.forEach((el) => io.observe(el))
  }

  /* stat counters are <aurora-counter> components — no site code needed */

  /* feature bento: equalizer bars */
  gsap.to('.eq i', {
    scaleY: 0.3,
    duration: 0.5,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    stagger: { each: 0.13, from: 'center' },
  })

  /* footer giant */
  const giant = new SplitText('.giant', { type: 'chars' })
  gsap.set(giant.chars, { yPercent: 118 })
  const giantEl = document.querySelector('.giant')
  if (giantEl) {
    onVisible(giantEl, () =>
      gsap.to(giant.chars, {
        yPercent: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.03,
      }),
    )
  }

  /* keep the parallax scrub honest once fonts/layout settle */
  void document.fonts?.ready.then(() => ScrollTrigger.refresh())
} else {
  /* reduced motion: everything visible (the components handle their own fallbacks) */
  const loader = document.querySelector<HTMLElement>('.loader')
  if (loader) loader.style.display = 'none'
}
