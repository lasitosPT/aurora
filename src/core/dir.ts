/**
 * Resolve the effective text direction for an element by walking up the
 * composed tree (crossing shadow boundaries) to the nearest explicit `dir`
 * attribute. Components use this to mirror behaviour CSS logical properties
 * can't express — pointer math, flyout sides, arrow-key direction.
 */
export function isRtl(el: Element): boolean {
  let node: Element | null = el
  while (node) {
    const dir = node.getAttribute('dir')
    if (dir === 'rtl') return true
    if (dir === 'ltr') return false
    node = node.parentElement ?? (node.getRootNode() as ShadowRoot).host ?? null
  }
  return false
}
