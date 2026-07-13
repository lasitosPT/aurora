import { describe, expect, it } from 'vitest'
import './editor'
import type { AuroraEditor } from './editor'

describe('aurora-editor', () => {
  it('renders the toolbar and an editable page with a placeholder', () => {
    const el = document.createElement('aurora-editor') as AuroraEditor
    el.setAttribute('placeholder', 'Start typing')
    document.body.append(el)
    expect(el.shadowRoot?.querySelectorAll('.tools button').length).toBe(10)
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
