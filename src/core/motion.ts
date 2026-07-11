/** Clamp `n` to the inclusive `[min, max]` range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

/** Linear interpolation between `a` and `b` by `t` (0..1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Whether the user has asked for reduced motion. Components should honour this. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
