import 'aurora'

// Three.js is heavy and only powers the decorative hero scene — load it lazily
// so it never blocks first paint. <aurora-scene> upgrades a moment after mount.
void import('aurora/three')

// Copy-to-clipboard on every code block.
document.querySelectorAll<HTMLButtonElement>('.copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const pre = btn.parentElement?.querySelector('pre')
    const text = pre?.textContent ?? ''
    void navigator.clipboard?.writeText(text).catch(() => undefined)
    const previous = btn.textContent
    btn.textContent = 'Copied'
    btn.classList.add('is-copied')
    window.setTimeout(() => {
      btn.textContent = previous
      btn.classList.remove('is-copied')
    }, 1400)
  })
})

// Smooth in-page scrolling for anchor links.
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href')?.slice(1)
    if (!id) return
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})

// Reveal sections as they enter the viewport.
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view')
        observer.unobserve(entry.target)
      }
    }
  },
  { threshold: 0.12 },
)
document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el))

// Shrink the nav once the hero is scrolled past.
const nav = document.querySelector('.nav')
window.addEventListener('scroll', () => nav?.classList.toggle('is-scrolled', window.scrollY > 24), {
  passive: true,
})

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())
