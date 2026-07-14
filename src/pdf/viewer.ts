import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp } from '../core/motion'
import { register } from '../core/register'
import { t } from '../core/i18n'

interface PdfPageLike {
  getViewport: (opts: { scale: number }) => { width: number; height: number }
  render: (opts: {
    canvasContext: CanvasRenderingContext2D
    viewport: unknown
    canvas?: HTMLCanvasElement
  }) => {
    promise: Promise<void>
  }
}

interface PdfDocLike {
  numPages: number
  getPage: (n: number) => Promise<PdfPageLike>
}

interface PdfLibLike {
  GlobalWorkerOptions?: { workerSrc: string }
  getDocument: (src: { url: string }) => { promise: Promise<PdfDocLike> }
}

const STYLE = `
  :host {
    display: block; color: var(--aurora-fg, #ececf2); font-size: 0.86rem;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  .bar {
    display: flex; align-items: center; gap: 6px; padding: 8px 12px;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
    font-variant-numeric: tabular-nums;
  }
  .bar button {
    all: unset; cursor: pointer; min-width: 28px; height: 28px; padding: 0 7px;
    display: inline-grid; place-items: center; border-radius: 8px;
    color: var(--aurora-muted, #9a98b3);
  }
  .bar button:hover:not(:disabled) { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.06); }
  .bar button:disabled { opacity: 0.35; cursor: default; }
  .bar button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .pages { margin: 0 6px; color: var(--aurora-muted, #9a98b3); }
  .spacer { flex: 1; }
  .stage { display: grid; place-items: center; padding: 16px; overflow: auto; max-height: var(--aurora-pdf-height, 460px); background: rgba(0, 0, 0, 0.25); }
  canvas { border-radius: 6px; box-shadow: 0 10px 34px rgba(0, 0, 0, 0.5); background: #fff; max-width: 100%; }
  .state { padding: 34px; text-align: center; color: var(--aurora-muted, #9a98b3); }
  .state.error { color: var(--aurora-danger, #f43f5e); }
`

/**
 * `<aurora-pdfviewer src="doc.pdf">` — a PDF viewer on the opt-in
 * `aurora/pdf` entry, rendering through Mozilla's pdf.js (a peer of this
 * entry, exactly like Three.js on `aurora/three`). Page controls, zoom
 * in/out, and a download button in aurora chrome. Configure the worker once
 * via `AuroraPdfviewer.workerSrc`. Emits `aurora-load` with `{ pages }` and
 * `aurora-page` with `{ page }`.
 */
export class AuroraPdfviewer extends AuroraElement {
  /** Set to the pdf.js worker URL before first use (bundler-specific). */
  static workerSrc = ''
  /** Injectable pdf.js module (used by tests; defaults to importing pdfjs-dist). */
  static pdfLib: PdfLibLike | null = null

  private doc: PdfDocLike | null = null
  private page = 1
  private scale = 1.2

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="bar" part="bar">
        <button data-a="prev" aria-label="Previous page" disabled>‹</button>
        <span class="pages">– / –</span>
        <button data-a="next" aria-label="Next page" disabled>›</button>
        <span class="spacer"></span>
        <button data-a="zoomout" aria-label="Zoom out">−</button>
        <button data-a="zoomin" aria-label="Zoom in">+</button>
        <a data-a="download" download href="${escapeHtml(this.getAttribute('src') ?? '')}" aria-label="Download PDF"><button tabindex="-1">⬇</button></a>
      </div>
      <div class="stage" part="stage"><div class="state">${t('pdf.loading')}</div></div>`
    this.root
      .querySelector('[data-a="prev"]')
      ?.addEventListener('click', () => this.go(this.page - 1))
    this.root
      .querySelector('[data-a="next"]')
      ?.addEventListener('click', () => this.go(this.page + 1))
    this.root.querySelector('[data-a="zoomin"]')?.addEventListener('click', () => this.zoom(1.25))
    this.root.querySelector('[data-a="zoomout"]')?.addEventListener('click', () => this.zoom(0.8))
    const src = this.getAttribute('src')
    if (src) void this.load(src)
  }

  /** Load a document URL (also called for the src attribute). */
  async load(src: string): Promise<void> {
    try {
      const lib = AuroraPdfviewer.pdfLib ?? ((await import('pdfjs-dist')) as unknown as PdfLibLike)
      if (lib.GlobalWorkerOptions && AuroraPdfviewer.workerSrc)
        lib.GlobalWorkerOptions.workerSrc = AuroraPdfviewer.workerSrc
      this.doc = await lib.getDocument({ url: src }).promise
      this.page = 1
      this.dispatchEvent(new CustomEvent('aurora-load', { detail: { pages: this.doc.numPages } }))
      await this.renderPage()
    } catch (err) {
      const stage = this.root.querySelector('.stage')
      if (stage)
        stage.innerHTML = `<div class="state error">${t('pdf.error')}${err instanceof Error ? ` — ${escapeHtml(err.message)}` : ''}</div>`
    }
  }

  go(page: number): void {
    if (!this.doc) return
    const next = clamp(page, 1, this.doc.numPages)
    if (next === this.page) return
    this.page = next
    void this.renderPage()
    this.dispatchEvent(new CustomEvent('aurora-page', { detail: { page: next } }))
  }

  zoom(factor: number): void {
    this.scale = clamp(this.scale * factor, 0.4, 4)
    void this.renderPage()
  }

  private async renderPage(): Promise<void> {
    if (!this.doc) return
    const pageObj = await this.doc.getPage(this.page)
    const viewport = pageObj.getViewport({ scale: this.scale })
    const stage = this.root.querySelector('.stage')
    if (!stage) return
    let canvas = stage.querySelector('canvas')
    if (!canvas) {
      stage.innerHTML = ''
      canvas = document.createElement('canvas')
      stage.appendChild(canvas)
    }
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')
    if (ctx) await pageObj.render({ canvasContext: ctx, viewport, canvas }).promise
    const pages = this.root.querySelector('.pages')
    if (pages) pages.textContent = `${this.page} / ${this.doc.numPages}`
    const prev = this.root.querySelector<HTMLButtonElement>('[data-a="prev"]')
    const next = this.root.querySelector<HTMLButtonElement>('[data-a="next"]')
    if (prev) prev.disabled = this.page <= 1
    if (next) next.disabled = this.page >= this.doc.numPages
  }
}

register('aurora-pdfviewer', AuroraPdfviewer)
