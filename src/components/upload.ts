import { gsap } from 'gsap'
import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { prefersReducedMotion } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host { display: block; }
  .zone {
    display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 1.6rem 1.2rem;
    text-align: center; cursor: pointer; color: var(--aurora-muted, #9a98b3);
    border: 1.5px dashed var(--aurora-border, rgba(255, 255, 255, 0.2));
    border-radius: 14px; transition: border-color 0.2s ease, background 0.2s ease;
  }
  .zone:hover, .zone.is-over { border-color: var(--aurora-accent, #6d5cff); background: rgba(109, 92, 255, 0.06); color: var(--aurora-fg, #ececf2); }
  .zone:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); outline-offset: 2px; }
  .zone strong { color: var(--aurora-fg, #ececf2); }
  ul { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li {
    display: flex; align-items: center; gap: 10px; padding: 0.5rem 0.8rem; font-size: 0.88rem;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1)); border-radius: 10px;
  }
  .size { color: var(--aurora-muted, #9a98b3); margin-left: auto; }
  .rm { all: unset; cursor: pointer; padding: 0 6px; color: var(--aurora-muted, #9a98b3); }
  .rm:hover { color: var(--aurora-error, #f87171); }
`

const fmtSize = (n: number): string =>
  n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(Math.round(n / 1024), 1)} KB`

/**
 * `<aurora-upload multiple accept="image/*" max-size="5242880">` — a drag-and-
 * drop file zone: click or drop to add, per-file rows with size and remove,
 * `max-size` (bytes) rejections via `aurora-error`. Form-associated (one
 * FormData entry per file). `files` getter; emits `aurora-change`.
 */
export class AuroraUpload extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private picked: File[] = []

  constructor() {
    super()
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
  }

  get files(): File[] {
    return [...this.picked]
  }

  connectedCallback(): void {
    const label = escapeHtml(this.getAttribute('label') ?? 'Drop files here or click to browse')
    this.root.innerHTML = `<style>${STYLE}</style><div class="zone" part="zone" tabindex="0" role="button" aria-label="${label}"><strong>${label}</strong><span>${this.hasAttribute('multiple') ? 'Multiple files welcome' : 'One file'}</span></div><input type="file" hidden ${this.hasAttribute('multiple') ? 'multiple' : ''} accept="${this.getAttribute('accept') ?? ''}" /><ul part="list"></ul>`
    const zone = this.root.querySelector<HTMLElement>('.zone')
    const input = this.root.querySelector<HTMLInputElement>('input')

    zone?.addEventListener('click', () => input?.click())
    zone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        input?.click()
      }
    })
    input?.addEventListener('change', () => {
      this.addFiles(Array.from(input.files ?? []))
      input.value = ''
    })
    zone?.addEventListener('dragover', (e) => {
      e.preventDefault()
      zone.classList.add('is-over')
    })
    zone?.addEventListener('dragleave', () => zone.classList.remove('is-over'))
    zone?.addEventListener('drop', (e) => {
      e.preventDefault()
      zone.classList.remove('is-over')
      this.addFiles(Array.from(e.dataTransfer?.files ?? []))
    })
  }

  /** Add files programmatically (same path as drop/browse). */
  addFiles(incoming: File[]): void {
    const maxSize = this.numberAttr('max-size', 0)
    for (const file of incoming) {
      if (maxSize > 0 && file.size > maxSize) {
        this.dispatchEvent(
          new CustomEvent('aurora-error', { detail: { file, reason: 'max-size' } }),
        )
        continue
      }
      if (!this.hasAttribute('multiple')) this.picked = []
      this.picked.push(file)
    }
    this.sync()
  }

  removeFile(index: number): void {
    this.picked.splice(index, 1)
    this.sync()
  }

  private sync(): void {
    const list = this.root.querySelector('ul')
    if (list) {
      list.innerHTML = this.picked
        .map(
          (f, i) =>
            `<li><span>📄</span>${escapeHtml(f.name)}<span class="size">${fmtSize(f.size)}</span><button class="rm" data-i="${i}" aria-label="Remove ${escapeHtml(f.name)}">✕</button></li>`,
        )
        .join('')
      list
        .querySelectorAll<HTMLButtonElement>('.rm')
        .forEach((b) => b.addEventListener('click', () => this.removeFile(Number(b.dataset.i))))
      if (!prefersReducedMotion() && this.picked.length > 0) {
        gsap.fromTo(
          list.children,
          { opacity: 0, y: 6 },
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            stagger: 0.05,
            ease: 'power2.out',
            clearProps: 'all',
          },
        )
      }
    }
    const name = this.getAttribute('name')
    if (this.internals && name) {
      const fd = new FormData()
      for (const f of this.picked) fd.append(name, f)
      this.internals.setFormValue(fd)
    }
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { files: this.files } }))
  }
}

register('aurora-upload', AuroraUpload)
