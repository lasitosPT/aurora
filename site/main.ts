import 'aurora'
import { AuroraConfetti, AuroraToaster } from 'aurora'
import { DOCS } from './docs-data'
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
  else if (value === 'components') location.href = './components.html'
  else if (value === 'install') {
    const target = document.getElementById('install')
    if (target) target.scrollIntoView({ behavior: 'smooth' })
    else location.href = './#install'
  } else if (value === 'github') window.open('https://github.com/lasitosPT/aurora', '_blank')
  else if (value === 'toast')
    AuroraToaster.show('Summoned from the palette.', { title: '⌘K', variant: 'default' })
  else if (value === 'confetti') AuroraConfetti.burst({ count: 130 })
})

/* ---------- data grid demo ---------- */
import type { AuroraGrid } from 'aurora'
const demoGrid = document.getElementById('demoGrid') as AuroraGrid | null
if (demoGrid) {
  demoGrid.columns = [
    { field: 'name', title: 'Project', width: '32%' },
    { field: 'lang', title: 'Language' },
    {
      field: 'stars',
      title: 'Stars',
      align: 'right',
      aggregate: 'sum',
      formatter: (v) => `★ ${String(v)}`,
    },
    { field: 'status', title: 'Status' },
  ]
  demoGrid.data = [
    { name: 'pulse', lang: 'TypeScript', stars: 412, status: 'stable' },
    { name: 'aurora', lang: 'TypeScript', stars: 951, status: 'active' },
    { name: 'volley', lang: 'Go', stars: 187, status: 'stable' },
    { name: 'statelet', lang: 'TypeScript', stars: 240, status: 'stable' },
    { name: 'critique', lang: 'TypeScript', stars: 305, status: 'active' },
    { name: 'devnotes', lang: 'Markdown', stars: 96, status: 'archive' },
    { name: 'nebula-kit', lang: 'GLSL', stars: 78, status: 'active' },
  ]
  demoGrid.detail = (row) =>
    `<strong>${String(row.name)}</strong> — ${String(row.lang)}, ${String(row.stars)} stars, ${String(row.status)}. Double-click any cell to edit it.`
}

const catAc = document.getElementById('catAc') as (HTMLElement & { options: string[] }) | null
if (catAc) catAc.options = ['TypeScript', 'JavaScript', 'Go', 'Rust', 'Python', 'Zig']

const catTree = document.getElementById('catTree') as (HTMLElement & { items: unknown[] }) | null
if (catTree)
  catTree.items = [
    {
      label: 'src',
      open: true,
      children: [
        { label: 'components', children: [{ label: 'grid.ts' }, { label: 'otp.ts' }] },
        { label: 'index.ts' },
      ],
    },
    { label: 'README.md' },
  ]

const catCrumb = document.getElementById('catCrumb') as (HTMLElement & { items: unknown[] }) | null
if (catCrumb)
  catCrumb.items = [
    { label: 'Home', href: './' },
    { label: 'Components', href: './components.html' },
    { label: 'Navigation' },
  ]

document.querySelectorAll('.catSpark').forEach((el, i) => {
  ;(el as HTMLElement & { data: number[] }).data =
    i === 0 ? [4, 9, 5, 12, 8, 15, 11, 18, 14, 22] : [6, 3, 8, 5, 11, 7, 13, 9, 16, 12]
})

const catChart = document.getElementById('catChart') as
  (HTMLElement & { labels: string[]; series: unknown[] }) | null
if (catChart) {
  catChart.labels = ['Q1', 'Q2', 'Q3', 'Q4']
  catChart.series = [
    { label: 'Stars', data: [120, 260, 410, 640] },
    { label: 'Forks', data: [40, 90, 150, 210] },
  ]
}

const catSched = document.getElementById('catSched') as (HTMLElement & { events: unknown[] }) | null
if (catSched)
  catSched.events = [
    { title: 'Standup', start: '2026-07-13T09:00', end: '2026-07-13T09:30' },
    { title: 'aurora sprint', start: '2026-07-14T10:00', end: '2026-07-14T12:30' },
    {
      title: 'Design review',
      start: '2026-07-15T14:00',
      end: '2026-07-15T15:30',
      color: '#22d3ee',
    },
    { title: 'Ship v1', start: '2026-07-17T16:00', end: '2026-07-17T17:00', color: '#34d399' },
  ]

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
const hasHero = Boolean(document.querySelector('.hero-title'))
if (!reduced && hasHero) {
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
  const giantEl = document.querySelector('.giant')
  const giant = giantEl ? new SplitText(giantEl, { type: 'chars' }) : null
  if (giant) gsap.set(giant.chars, { yPercent: 118 })
  if (giantEl && giant) {
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

/* ---------- components catalogue page ---------- */
const catalog = document.getElementById('catalog')
if (catalog) {
  if (!reduced && !hasHero) {
    const revealEls = gsap.utils.toArray<HTMLElement>('#catalog [data-reveal], #catalog .demo')
    gsap.set(revealEls, { autoAlpha: 0, y: 24 })
    if (typeof IntersectionObserver === 'undefined') {
      gsap.set(revealEls, { autoAlpha: 1, y: 0 })
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              io.unobserve(entry.target)
              gsap.to(entry.target, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' })
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      revealEls.forEach((el) => io.observe(el))
    }
  }

  const search = document.getElementById('catalogSearch') as HTMLInputElement | null
  const none = document.getElementById('catalogNone')
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase()
    let any = false
    document.querySelectorAll<HTMLElement>('.cat-section').forEach((section) => {
      let visible = 0
      section.querySelectorAll<HTMLElement>('.demo').forEach((card) => {
        const hay = `${card.querySelector('.demo-head')?.textContent ?? ''} ${
          card.querySelector('.demo-desc')?.textContent ?? ''
        } ${section.querySelector('.cat-title')?.textContent ?? ''}`.toLowerCase()
        const show = !q || hay.includes(q)
        card.style.display = show ? '' : 'none'
        if (show) visible++
      })
      section.style.display = visible > 0 ? '' : 'none'
      if (visible > 0) any = true
    })
    if (none) none.hidden = any
  })
}

/* ---------- per-component docs page ---------- */
const docRoot = document.getElementById('docRoot')
if (docRoot) {
  ;(window as unknown as Record<string, unknown>).AuroraToaster = AuroraToaster
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const tag = new URLSearchParams(location.search).get('c')
  const doc = DOCS.find((d) => d.tag === tag)
  const table = (title: string, rows: [string, string][]): string =>
    rows.length
      ? `<h2 class="cat-title" style="margin-top:40px">${title}</h2><table class="vars">${rows
          .map(([a, b]) => `<tr><td><code>${esc(a)}</code></td><td>${esc(b)}</td></tr>`)
          .join('')}</table>`
      : ''
  if (!doc) {
    docRoot.innerHTML =
      `<p class="kicker">Documentation</p><h1 class="section-title">Component docs</h1>` +
      `<p style="color:var(--muted)">Deep-dive pages roll out component by component. Available now:</p>` +
      `<div class="features" style="margin-top:30px">${DOCS.map(
        (d) =>
          `<a class="bento" style="grid-column: span 3" href="./docs.html?c=${d.tag}"><h3>${d.title}</h3><p>${d.summary.slice(0, 110)}…</p><p style="margin-top:12px;color:var(--accent)"><code>&lt;${d.tag}&gt;</code> →</p></a>`,
      ).join('')}</div>`
  } else {
    docRoot.innerHTML =
      `<p class="kicker">${doc.category} · docs</p>` +
      `<h1 class="section-title">${doc.title} <code style="font-size:.45em;color:var(--accent)">&lt;${doc.tag}&gt;</code></h1>` +
      `<p style="color:var(--muted);max-width:70ch">${doc.summary}</p>` +
      `<h2 class="cat-title" style="margin-top:40px">Live example</h2>` +
      `<div class="stage" style="margin:0 0 14px">${doc.example}</div>` +
      `<div class="code"><button class="copy">Copy</button><pre>${esc(doc.example)}</pre></div>` +
      table('Attributes', doc.attributes) +
      table('Events', doc.events) +
      table('CSS variables', doc.cssvars) +
      table('Properties & methods', doc.methods) +
      `<h2 class="cat-title" style="margin-top:40px">Tutorial</h2>` +
      doc.tutorial
        .map(
          (t) =>
            `<h3 style="font-family:var(--font-display);margin:26px 0 8px">${t.heading}</h3><p style="color:var(--muted);max-width:70ch">${t.text}</p>${t.code ? `<div class="code" style="margin-top:10px"><button class="copy">Copy</button><pre>${esc(t.code)}</pre></div>` : ''}`,
        )
        .join('')
    const tree = document.getElementById('docTree') as (HTMLElement & { items: unknown[] }) | null
    if (tree)
      tree.items = [
        {
          label: 'src',
          open: true,
          children: [
            { label: 'components', children: [{ label: 'grid.ts' }, { label: 'select.ts' }] },
            { label: 'index.ts' },
          ],
        },
        { label: 'site', children: [{ label: 'index.html' }] },
        { label: 'README.md' },
      ]
    const crumb = document.getElementById('docCrumb') as (HTMLElement & { items: unknown[] }) | null
    if (crumb)
      crumb.items = [
        { label: 'Home', href: './' },
        { label: 'Components', href: './components.html' },
        { label: 'Breadcrumb' },
      ]
    const spark = document.getElementById('docSpark') as (HTMLElement & { data: number[] }) | null
    if (spark) spark.data = [4, 9, 5, 12, 8, 15, 11, 18, 14, 22]
    const chart = document.getElementById('docChart') as
      (HTMLElement & { labels: string[]; series: unknown[] }) | null
    if (chart) {
      chart.labels = ['Q1', 'Q2', 'Q3', 'Q4']
      chart.series = [
        { label: 'Stars', data: [120, 260, 410, 640] },
        { label: 'Forks', data: [40, 90, 150, 210] },
      ]
    }
    const sched = document.getElementById('docSched') as
      (HTMLElement & { events: unknown[] }) | null
    if (sched)
      sched.events = [
        { title: 'Standup', start: '2026-07-13T09:00', end: '2026-07-13T09:30' },
        { title: 'aurora sprint', start: '2026-07-14T10:00', end: '2026-07-14T12:30' },
        {
          title: 'Design review',
          start: '2026-07-15T14:00',
          end: '2026-07-15T15:30',
          color: '#22d3ee',
        },
        { title: 'Ship v1', start: '2026-07-17T16:00', end: '2026-07-17T17:00', color: '#34d399' },
      ]
    const ac = document.getElementById('docAc') as (HTMLElement & { options: string[] }) | null
    if (ac) ac.options = ['TypeScript', 'JavaScript', 'Go', 'Rust', 'Python', 'Zig']
    if (doc.tag === 'aurora-grid') {
      const g = document.getElementById('docGrid') as AuroraGrid | null
      if (g) {
        g.columns = [
          { field: 'name', title: 'Project' },
          { field: 'stars', title: 'Stars', align: 'right', aggregate: 'sum' },
          { field: 'lang', title: 'Language' },
        ]
        g.data = [
          { name: 'pulse', stars: 412, lang: 'TypeScript' },
          { name: 'aurora', stars: 951, lang: 'TypeScript' },
          { name: 'volley', stars: 187, lang: 'Go' },
          { name: 'statelet', stars: 240, lang: 'TypeScript' },
          { name: 'critique', stars: 305, lang: 'TypeScript' },
          { name: 'devnotes', stars: 96, lang: 'Markdown' },
        ]
      }
    }
    docRoot.querySelectorAll<HTMLButtonElement>('.copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        void navigator.clipboard?.writeText(
          btn.parentElement?.querySelector('pre')?.textContent ?? '',
        )
      })
    })
  }
}
