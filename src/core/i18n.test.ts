import { afterEach, describe, expect, it } from 'vitest'
import { setMessages, t } from './i18n'
import '../components/grid'
import '../components/form'
import '../components/input'
import type { AuroraGrid } from '../components/grid'
import type { AuroraForm } from '../components/form'

afterEach(() => setMessages())

describe('i18n', () => {
  it('resolves defaults, overrides, and template args', () => {
    expect(t('grid.search')).toBe('Search…')
    expect(t('form.min', 3)).toBe('Must be at least 3')
    setMessages({ 'grid.search': 'Procurar…', 'form.min': 'Mínimo de {0}' })
    expect(t('grid.search')).toBe('Procurar…')
    expect(t('form.min', 3)).toBe('Mínimo de 3')
    expect(t('grid.exportCsv')).toBe('Export CSV')
    setMessages()
    expect(t('grid.search')).toBe('Search…')
  })

  it('localizes the grid chrome', () => {
    setMessages({ 'grid.search': 'Procurar…', 'grid.empty': 'Sem resultados.' })
    const el = document.createElement('aurora-grid') as AuroraGrid
    el.setAttribute('searchable', '')
    document.body.append(el)
    el.columns = [{ field: 'x', title: 'X' }]
    el.data = []
    expect(el.shadowRoot?.querySelector('[data-search]')?.getAttribute('placeholder')).toBe(
      'Procurar…',
    )
    expect(el.shadowRoot?.querySelector('.empty')?.textContent).toBe('Sem resultados.')
    el.remove()
  })

  it('localizes form validation messages', () => {
    setMessages({ 'form.required': 'Campo obrigatório' })
    const form = document.createElement('aurora-form') as AuroraForm
    form.innerHTML = '<aurora-input name="a" required></aurora-input>'
    document.body.append(form)
    const errors = form.validate()
    expect(errors['a']).toBe('Campo obrigatório')
    form.remove()
  })
})
