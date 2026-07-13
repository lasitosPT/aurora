import { AuroraElement } from '../core/base'
import { register } from '../core/register'

const ACTIONS: { cmd: string; icon: string; label: string; arg?: boolean; block?: string }[] = [
  { cmd: 'bold', icon: '<b>B</b>', label: 'Bold' },
  { cmd: 'italic', icon: '<i>I</i>', label: 'Italic' },
  { cmd: 'underline', icon: '<u>U</u>', label: 'Underline' },
  { cmd: 'strikeThrough', icon: '<s>S</s>', label: 'Strikethrough' },
  { cmd: 'formatBlock', icon: 'H2', label: 'Heading', block: 'h2' },
  { cmd: 'formatBlock', icon: '❝', label: 'Quote', block: 'blockquote' },
  { cmd: 'insertUnorderedList', icon: '•≡', label: 'Bullet list' },
  { cmd: 'insertOrderedList', icon: '1≡', label: 'Numbered list' },
  { cmd: 'createLink', icon: '🔗', label: 'Link', arg: true },
  { cmd: 'removeFormat', icon: '⌫', label: 'Clear formatting' },
]

const STYLE = `
  :host {
    display: block; width: 100%; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 14px; background: var(--aurora-surface, #14141f); overflow: hidden;
  }
  :host(:focus-within) { border-color: var(--aurora-accent, #6d5cff); }
  .tools {
    display: flex; gap: 3px; flex-wrap: wrap; padding: 8px;
    border-bottom: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.08));
  }
  .tools button {
    all: unset; cursor: pointer; min-width: 30px; height: 30px; padding: 0 6px;
    display: inline-grid; place-items: center; border-radius: 8px; font-size: 0.85rem;
    color: var(--aurora-muted, #9a98b3);
  }
  .tools button:hover { color: var(--aurora-fg, #ececf2); background: rgba(255, 255, 255, 0.06); }
  .tools button.on { color: #fff; background: var(--aurora-accent, #6d5cff); }
  .tools button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .page {
    min-height: var(--aurora-editor-height, 180px); padding: 16px 18px; outline: none;
    line-height: 1.65; font-size: 0.95rem; overflow-y: auto; max-height: 480px;
  }
  .page:empty::before { content: attr(data-placeholder); color: var(--aurora-muted, #9a98b3); opacity: 0.6; }
  .page h2 { margin: 0.6em 0 0.3em; font-size: 1.25rem; }
  .page blockquote {
    margin: 0.6em 0; padding: 4px 14px; border-left: 3px solid var(--aurora-accent, #6d5cff);
    color: var(--aurora-muted, #9a98b3);
  }
  .page a { color: var(--aurora-accent2, #22d3ee); }
  .page ul, .page ol { padding-left: 1.4em; }
`

/**
 * `<aurora-editor>` — a rich text editor: bold/italic/underline/strike,
 * headings, quotes, lists, links, and clear-formatting over a contenteditable
 * page, with active-state toolbar buttons and ⌘/Ctrl+B/I/U shortcuts.
 * `value` is HTML; form-associated; emits `aurora-change` as you type.
 */
export class AuroraEditor extends AuroraElement {
  static readonly formAssociated = true
  private internals: ElementInternals | null = null
  private page: HTMLElement | null = null

  constructor() {
    super()
    if ('attachInternals' in this) {
      try {
        this.internals = this.attachInternals()
      } catch {
        this.internals = null
      }
    }
  }

  get value(): string {
    return this.page?.innerHTML ?? ''
  }

  set value(html: string) {
    if (this.page) {
      this.page.innerHTML = html
      this.internals?.setFormValue(html)
    }
  }

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="tools" part="tools" role="toolbar" aria-label="Formatting">${ACTIONS.map(
        (a, i) =>
          `<button data-a="${i}" aria-label="${a.label}" title="${a.label}">${a.icon}</button>`,
      ).join('')}</div>
      <div class="page" part="page" contenteditable="true" data-placeholder="${this.getAttribute('placeholder') ?? 'Write something…'}" aria-label="Editor"></div>`
    this.page = this.root.querySelector('.page')
    const initial = this.getAttribute('value') ?? this.innerHTML.trim()
    if (initial) this.value = initial
    this.root.querySelectorAll<HTMLButtonElement>('.tools button').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => e.preventDefault())
      btn.addEventListener('click', () => {
        const action = ACTIONS[Number(btn.dataset['a'])]
        if (action) this.exec(action)
      })
    })
    this.page?.addEventListener('input', () => {
      this.internals?.setFormValue(this.value)
      this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.value } }))
    })
    this.page?.addEventListener('keyup', () => this.reflect())
    this.page?.addEventListener('mouseup', () => this.reflect())
    this.page?.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      const map: Record<string, string> = { b: 'bold', i: 'italic', u: 'underline' }
      const cmd = map[key]
      if (cmd) {
        e.preventDefault()
        document.execCommand(cmd)
        this.reflect()
      }
    })
  }

  /** Run a formatting command against the current selection. */
  format(cmd: string, arg?: string): void {
    this.page?.focus()
    document.execCommand(cmd, false, arg)
    this.reflect()
    this.internals?.setFormValue(this.value)
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { value: this.value } }))
  }

  private exec(action: (typeof ACTIONS)[number]): void {
    if (action.arg) {
      const url = window.prompt('Link URL')
      if (!url) return
      this.format(action.cmd, url)
      return
    }
    this.format(action.cmd, action.block)
  }

  private reflect(): void {
    this.root.querySelectorAll<HTMLButtonElement>('.tools button').forEach((btn) => {
      const action = ACTIONS[Number(btn.dataset['a'])]
      if (!action || action.arg || action.block) return
      let on: boolean
      try {
        on = document.queryCommandState(action.cmd)
      } catch {
        on = false
      }
      btn.classList.toggle('on', on)
    })
  }
}

register('aurora-editor', AuroraEditor)
