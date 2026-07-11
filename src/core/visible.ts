/**
 * Run `callback` once, the first time `el` enters the viewport. Falls back to
 * running immediately where IntersectionObserver is unavailable (tests, SSR).
 * Returns a cleanup function.
 */
export function whenVisible(el: Element, callback: () => void, threshold = 0.15): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    callback()
    return () => undefined
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        io.disconnect()
        callback()
      }
    },
    { threshold },
  )
  io.observe(el)
  return () => io.disconnect()
}
