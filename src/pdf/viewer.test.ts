import { describe, expect, it } from 'vitest'
import { AuroraPdfviewer } from './viewer'

function fakeLib(pages: number): typeof AuroraPdfviewer.pdfLib {
  return {
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: pages,
        getPage: () =>
          Promise.resolve({
            getViewport: ({ scale }: { scale: number }) => ({
              width: 600 * scale,
              height: 800 * scale,
            }),
            render: () => ({ promise: Promise.resolve() }),
          }),
      }),
    }),
  }
}

describe('aurora-pdfviewer', () => {
  it('loads a document, reports pages, and pages through it', async () => {
    AuroraPdfviewer.pdfLib = fakeLib(3)
    const el = document.createElement('aurora-pdfviewer') as AuroraPdfviewer
    document.body.append(el)
    let pages = 0
    el.addEventListener('aurora-load', (e) => {
      pages = (e as CustomEvent<{ pages: number }>).detail.pages
    })
    await el.load('fake.pdf')
    expect(pages).toBe(3)
    expect(el.shadowRoot?.querySelector('.pages')?.textContent).toBe('1 / 3')
    expect(el.shadowRoot?.querySelector<HTMLButtonElement>('[data-a="prev"]')?.disabled).toBe(true)
    let current = 0
    el.addEventListener('aurora-page', (e) => {
      current = (e as CustomEvent<{ page: number }>).detail.page
    })
    el.go(2)
    await new Promise((r) => setTimeout(r, 0))
    expect(current).toBe(2)
    expect(el.shadowRoot?.querySelector('.pages')?.textContent).toBe('2 / 3')
    el.go(99)
    await new Promise((r) => setTimeout(r, 0))
    expect(el.shadowRoot?.querySelector('.pages')?.textContent).toBe('3 / 3')
    expect(el.shadowRoot?.querySelector<HTMLButtonElement>('[data-a="next"]')?.disabled).toBe(true)
    AuroraPdfviewer.pdfLib = null
    el.remove()
  })

  it('scales the canvas with zoom', async () => {
    AuroraPdfviewer.pdfLib = fakeLib(1)
    const el = document.createElement('aurora-pdfviewer') as AuroraPdfviewer
    document.body.append(el)
    await el.load('fake.pdf')
    const before = el.shadowRoot?.querySelector('canvas')?.width ?? 0
    el.zoom(1.25)
    await new Promise((r) => setTimeout(r, 0))
    const after = el.shadowRoot?.querySelector('canvas')?.width ?? 0
    expect(after).toBeGreaterThan(before)
    AuroraPdfviewer.pdfLib = null
    el.remove()
  })

  it('shows an error state for unloadable documents', async () => {
    AuroraPdfviewer.pdfLib = {
      getDocument: () => ({ promise: Promise.reject(new Error('404')) }),
    }
    const el = document.createElement('aurora-pdfviewer') as AuroraPdfviewer
    document.body.append(el)
    await el.load('missing.pdf')
    expect(el.shadowRoot?.querySelector('.state.error')?.textContent).toContain('404')
    AuroraPdfviewer.pdfLib = null
    el.remove()
  })
})
