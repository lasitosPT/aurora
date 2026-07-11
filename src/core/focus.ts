/** Selector matching focusable elements, including aurora form controls. */
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"]), ' +
  'aurora-button:not([disabled]), aurora-input, aurora-switch:not([disabled]), aurora-slider'

/**
 * Keep a Tab keydown inside `container`. document.activeElement reports shadow
 * hosts, so aurora-* controls participate at host granularity. When the
 * container has no focusables, `fallback` (e.g. the dialog panel) is focused.
 */
export function trapTab(
  container: Element,
  event: KeyboardEvent,
  fallback?: HTMLElement | null,
): void {
  const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (!first || !last) {
    event.preventDefault()
    fallback?.focus()
    return
  }
  const active = document.activeElement
  if (active !== container && !container.contains(active)) {
    event.preventDefault()
    first.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  } else if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault()
    last.focus()
  }
}
