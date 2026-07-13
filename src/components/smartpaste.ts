import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'

type FieldEl = HTMLElement & { value?: unknown; checked?: boolean }

const MATCHERS: { names: RegExp; extract: (text: string) => string | null }[] = [
  {
    names: /e-?mail/i,
    extract: (t) => /[\w.+-]+@[\w-]+\.[\w.]{2,}/.exec(t)?.[0] ?? null,
  },
  {
    names: /phone|tel|mobile/i,
    extract: (t) => /(?:\+?\d[\d\s().-]{7,}\d)/.exec(t)?.[0]?.trim() ?? null,
  },
  {
    names: /url|web|site|link/i,
    extract: (t) => /https?:\/\/\S+/.exec(t)?.[0] ?? null,
  },
  {
    names: /date|dob|birth/i,
    extract: (t) => {
      const m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(t) ?? null
      if (m) return m[0]
      const eu = /\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/.exec(t)
      if (eu) return `${eu[3]}-${String(eu[2]).padStart(2, '0')}-${String(eu[1]).padStart(2, '0')}`
      return null
    },
  },
  {
    names: /zip|postal/i,
    extract: (t) => /\b\d{4}-?\d{3}\b|\b\d{5}(?:-\d{4})?\b/.exec(t)?.[0] ?? null,
  },
  {
    names: /name/i,
    extract: (t) => {
      const line = t
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /^[A-ZÀ-Ý][\w'À-ÿ-]+(\s+[A-ZÀ-Ý][\w'À-ÿ-]+)+$/.test(l))
      return line ?? null
    },
  },
]

const STYLE = `
  :host { display: inline-block; }
  button {
    all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center;
    gap: 8px; padding: 0.55rem 1.05rem; font: inherit; color: #fff;
    background: var(--aurora-accent, #6d5cff); border-radius: var(--aurora-radius, 0.6rem);
  }
  button:hover { background: var(--aurora-accent-hover, #5a49e0); }
  button:focus-visible { outline: 2px solid var(--aurora-accent2, #22d3ee); outline-offset: 2px; }
`

/**
 * `<aurora-smartpaste for="formId">` — reads the clipboard and distributes
 * what it finds into the named fields of the target container: emails, phone
 * numbers, URLs, dates, postal codes, and names are matched to fields by
 * name heuristics; supply a `map` function to take over entirely. Emits
 * `aurora-paste` with the applied `{ values }`.
 */
export class AuroraSmartpaste extends AuroraElement {
  /** Optional custom mapper: raw clipboard text → { fieldName: value }. */
  map: ((text: string) => Record<string, unknown>) | null = null

  connectedCallback(): void {
    this.root.innerHTML = `<style>${STYLE}</style><button part="button"><span aria-hidden="true">✨</span>${escapeHtml(
      this.getAttribute('label') ?? 'Smart paste',
    )}</button>`
    this.root.querySelector('button')?.addEventListener('click', () => {
      void navigator.clipboard
        ?.readText?.()
        .then((text) => this.paste(text))
        .catch(() =>
          this.dispatchEvent(new CustomEvent('aurora-error', { detail: { reason: 'clipboard' } })),
        )
    })
  }

  /** Apply text as if it were pasted (also the programmatic/test path). */
  paste(text: string): Record<string, unknown> {
    const targetId = this.getAttribute('for')
    const container = targetId
      ? document.getElementById(targetId)
      : (this.closest('aurora-form') ?? this.parentElement)
    const fields = Array.from(container?.querySelectorAll<FieldEl>('[name]') ?? [])
    const values: Record<string, unknown> = this.map ? this.map(text) : {}
    if (!this.map) {
      for (const field of fields) {
        const name = field.getAttribute('name') ?? ''
        const matcher = MATCHERS.find((m) => m.names.test(name))
        const found = matcher?.extract(text)
        if (found !== null && found !== undefined) values[name] = found
      }
    }
    for (const [name, value] of Object.entries(values)) {
      const field = fields.find((f) => f.getAttribute('name') === name)
      if (!field) continue
      if (typeof field.checked === 'boolean') field.checked = Boolean(value)
      else field.value = value
      field.dispatchEvent(new Event('input', { bubbles: true }))
    }
    this.dispatchEvent(new CustomEvent('aurora-paste', { detail: { values } }))
    return values
  }
}

register('aurora-smartpaste', AuroraSmartpaste)
