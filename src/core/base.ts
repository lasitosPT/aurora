/**
 * Base class for Aurora components: attaches an open shadow root and provides a
 * couple of small helpers. Styles live inside the shadow root, so components are
 * self-contained; theming is done through CSS custom properties that pierce the
 * shadow boundary (e.g. `--aurora-accent`).
 */
export abstract class AuroraElement extends HTMLElement {
  protected readonly root: ShadowRoot

  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
  }

  /** Read a numeric attribute, falling back to `fallback` when absent or invalid. */
  protected numberAttr(name: string, fallback: number): number {
    const raw = this.getAttribute(name)
    if (raw === null) return fallback
    const value = Number(raw)
    return Number.isFinite(value) ? value : fallback
  }
}
