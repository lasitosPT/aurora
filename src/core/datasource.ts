export interface DataSourceState {
  page?: number
  pageSize?: number
  sorts?: { field: string; dir: 'asc' | 'desc' }[]
  filters?: Record<string, string>
  search?: string
}

export interface DataSourceResult<T = Record<string, unknown>> {
  rows: T[]
  total: number
}

export interface DataSourceOptions<T = Record<string, unknown>> {
  url: string
  /** Turn view state into query params. Default: page/pageSize/sort/q + filter[field]. */
  params?: (state: DataSourceState) => Record<string, string>
  /** Turn the JSON payload into { rows, total }. Default: expects that exact shape. */
  parse?: (json: unknown) => DataSourceResult<T>
  fetcher?: typeof fetch
}

/**
 * A tiny remote adapter: `createDataSource({ url }).load(state)` builds the
 * query string from grid-style view state and resolves `{ rows, total }`.
 * Wire it to aurora-grid's `aurora-sort`/`aurora-filter`/`aurora-page` events
 * and assign `grid.data = rows` — server-side paging without a framework.
 */
export function createDataSource<T = Record<string, unknown>>(
  options: DataSourceOptions<T>,
): { load: (state?: DataSourceState) => Promise<DataSourceResult<T>> } {
  const toParams =
    options.params ??
    ((state: DataSourceState): Record<string, string> => {
      const out: Record<string, string> = {}
      if (state.page !== undefined) out['page'] = String(state.page)
      if (state.pageSize !== undefined) out['pageSize'] = String(state.pageSize)
      if (state.sorts?.length) out['sort'] = state.sorts.map((s) => `${s.field}:${s.dir}`).join(',')
      if (state.search) out['q'] = state.search
      for (const [field, value] of Object.entries(state.filters ?? {}))
        if (value) out[`filter[${field}]`] = value
      return out
    })
  const parse =
    options.parse ??
    ((json: unknown): DataSourceResult<T> => {
      const obj = json as { rows?: T[]; total?: number }
      return { rows: obj.rows ?? [], total: obj.total ?? obj.rows?.length ?? 0 }
    })
  const doFetch = options.fetcher ?? fetch.bind(globalThis)
  return {
    async load(state: DataSourceState = {}): Promise<DataSourceResult<T>> {
      const qs = new URLSearchParams(toParams(state)).toString()
      const res = await doFetch(
        `${options.url}${qs ? (options.url.includes('?') ? '&' : '?') + qs : ''}`,
      )
      if (!res.ok) throw new Error(`DataSource: ${res.status} ${res.statusText}`)
      return parse(await res.json())
    },
  }
}
