import { describe, expect, it, vi } from 'vitest'
import { createDataSource } from './datasource'

describe('createDataSource', () => {
  it('builds grid-state query params and parses the default shape', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rows: [{ id: 1 }], total: 42 }),
    })
    const ds = createDataSource({ url: '/api/items', fetcher: fetcher as unknown as typeof fetch })
    const result = await ds.load({
      page: 2,
      pageSize: 25,
      sorts: [{ field: 'name', dir: 'desc' }],
      search: 'aur',
      filters: { lang: 'ts', empty: '' },
    })
    expect(result).toEqual({ rows: [{ id: 1 }], total: 42 })
    const url = String(fetcher.mock.calls[0]?.[0])
    expect(url).toContain('/api/items?')
    expect(url).toContain('page=2')
    expect(url).toContain('sort=name%3Adesc')
    expect(url).toContain('q=aur')
    expect(url).toContain('filter%5Blang%5D=ts')
    expect(url).not.toContain('empty')
  })

  it('throws on HTTP errors and honors custom parse', async () => {
    const bad = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'boom' })
    await expect(
      createDataSource({ url: '/x', fetcher: bad as unknown as typeof fetch }).load(),
    ).rejects.toThrow('500')
    const custom = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [1, 2], meta: { count: 2 } }),
    })
    const ds = createDataSource<number>({
      url: '/y',
      fetcher: custom as unknown as typeof fetch,
      parse: (j) => {
        const o = j as { data: number[]; meta: { count: number } }
        return { rows: o.data, total: o.meta.count }
      },
    })
    expect(await ds.load()).toEqual({ rows: [1, 2], total: 2 })
  })
})
