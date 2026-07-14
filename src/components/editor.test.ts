import { describe, expect, it } from 'vitest'
import './editor'
import type { AuroraEditor } from './editor'

describe('aurora-editor', () => {
  it('renders the toolbar and an editable page with a placeholder', () => {
    const el = document.createElement('aurora-editor') as AuroraEditor
    el.setAttribute('placeholder', 'Start typing')
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('.tools button').length).toBe(21)
    const page = el.shadowRoot?.querySelector('.page')
    expect(page?.getAttribute('contenteditable')).toBe('true')
    expect(page?.getAttribute('data-placeholder')).toBe('Start typing')
    el.remove()
  })

  it('round-trips HTML through value and seeds from light DOM', () => {
    const el = document.createElement('aurora-editor') as AuroraEditor
    el.innerHTML = '<p>Hello <b>world</b></p>'
    document.body.append(el)
    expect(el.value).toBe('<p>Hello <b>world</b></p>')
    el.value = '<h2>Title</h2><p>Body</p>'
    expect(el.value).toBe('<h2>Title</h2><p>Body</p>')
    el.remove()
  })

  it('emits aurora-change as content changes', () => {
    const el = document.createElement('aurora-editor') as AuroraEditor
    document.body.append(el)
    let got = ''
    el.addEventListener('aurora-change', (e) => {
      got = (e as CustomEvent<{ value: string }>).detail.value
    })
    const page = el.shadowRoot?.querySelector<HTMLElement>('.page')
    if (page) {
      page.innerHTML = '<p>typed</p>'
      page.dispatchEvent(new Event('input'))
    }
    expect(got).toBe('<p>typed</p>')
    el.remove()
  })
})

describe('editor depth (v1.4)', () => {
  it('ships the extended tool set with colors and source toggle', () => {
    const el = document.createElement('aurora-editor') as AuroraEditor
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('.tools button').length).toBe(21)
    expect(el.shadowRoot?.querySelectorAll('.swatch input[type="color"]').length).toBe(2)
    expect(el.shadowRoot?.querySelector('[data-src]')).not.toBeNull()
    el.remove()
  })

  it('round-trips HTML through the source view', () => {
    const el = document.createElement('aurora-editor') as AuroraEditor
    document.body.append(el)
    el.value = '<p>hello</p>'
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-src]')?.click()
    expect(el.hasAttribute('source-view')).toBe(true)
    const src = el.shadowRoot?.querySelector<HTMLTextAreaElement>('.src')
    expect(src?.value).toBe('<p>hello</p>')
    if (src) {
      src.value = '<h2>edited</h2>'
      src.dispatchEvent(new Event('input'))
    }
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-src]')?.click()
    expect(el.hasAttribute('source-view')).toBe(false)
    expect(el.value).toBe('<h2>edited</h2>')
    el.remove()
  })

  it('respects readonly', () => {
    const el = document.createElement('aurora-editor') as AuroraEditor
    el.setAttribute('readonly', '')
    document.body.append(el)
    expect(el.shadowRoot?.querySelector('.page')?.getAttribute('contenteditable')).toBe('false')
    el.remove()
  })
})
