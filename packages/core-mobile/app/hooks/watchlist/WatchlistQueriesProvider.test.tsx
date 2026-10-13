/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import React, { PropsWithChildren } from 'react'
import { WatchlistQueriesProvider } from './WatchlistQueriesProvider'
import { useTopTokens } from './useTopTokens'
import {
  useGetTrendingToken,
  useGetTrendingTokens
} from './useGetTrendingTokens'

const mockGetTopTokens = jest.fn()
const mockGetTrendingTokens = jest.fn()
const mockGetExchangeRates = jest.fn()

jest.mock('services/watchlist/WatchlistService', () => ({
  __esModule: true,
  default: {
    getTopTokens: (...args: unknown[]) => mockGetTopTokens(...args),
    getTrendingTokens: (...args: unknown[]) => mockGetTrendingTokens(...args)
  }
}))

jest.mock('services/defi/DeFiService', () => ({
  __esModule: true,
  default: {
    getExchangeRates: (...args: unknown[]) => mockGetExchangeRates(...args)
  }
}))

jest.mock('utils/runAfterInteractions', () => ({
  runAfterInteractions: (fn: () => unknown) => fn()
}))

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector()
}))

jest.mock('store/settings/currency', () => ({
  selectSelectedCurrency: () => 'USD'
}))

const makeWrapper =
  (client: QueryClient) =>
  ({ children }: PropsWithChildren): JSX.Element =>
    (
      <QueryClientProvider client={client}>
        <WatchlistQueriesProvider>{children}</WatchlistQueriesProvider>
      </QueryClientProvider>
    )

describe('WatchlistQueriesProvider (CP-14918 observer fan-out fix)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTopTokens.mockResolvedValue({
      tokens: { avax: { id: 'avax', internalId: 'avax' } as any },
      charts: {},
      prices: {}
    })
    mockGetTrendingTokens.mockResolvedValue([
      { internalId: 'avax', symbol: 'AVAX' },
      { internalId: 'btc', symbol: 'BTC' }
    ])
    mockGetExchangeRates.mockResolvedValue({ usd: { usd: 1 } })
  })

  it('mounts exactly ONE QueryObserver for the key no matter how many components call useTopTokens(), and all readers get the identical result reference', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })

    const { result, waitFor } = renderHook(
      () => ({ a: useTopTokens(), b: useTopTokens() }),
      { wrapper: makeWrapper(client) }
    )

    await waitFor(() => expect(result.current.a.data).toBeDefined())

    expect(mockGetTopTokens).toHaveBeenCalledTimes(1)

    // The discriminating check: fetch-dedup alone would have passed on the
    // pre-fix code too (react-query dedupes fetches per key regardless of
    // observer count). Observer count is what pre-fix code got wrong.
    const query = client
      .getQueryCache()
      .find({ queryKey: [ReactQueryKeys.WATCHLIST_TOP_TOKENS, 'USD'] })
    expect(query?.observers.length).toBe(1)

    expect(result.current.a).toBe(result.current.b)
    expect(result.current.a.data?.tokens.avax?.id).toBe('avax')
  })

  it('shares one observer across 3 simultaneous trending-token callers and applies select independently per caller', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })

    const { result, waitFor } = renderHook(
      () => ({
        all: useGetTrendingTokens(),
        avax: useGetTrendingToken('avax'),
        btc: useGetTrendingToken('btc')
      }),
      { wrapper: makeWrapper(client) }
    )

    await waitFor(() => expect(result.current.all.data).toBeDefined())

    // Two fetches, not one: the query key embeds the exchange rate, which
    // resolves undefined -> 1, so two distinct keys. The count stays 2
    // regardless of reader count -- all 3 callers share one observer.
    expect(mockGetTrendingTokens).toHaveBeenCalledTimes(2)
    expect(result.current.all.data).toHaveLength(2)
    expect(result.current.avax.data?.symbol).toBe('AVAX')
    expect(result.current.btc.data?.symbol).toBe('BTC')

    const query = client
      .getQueryCache()
      .find({ queryKey: [ReactQueryKeys.WATCHLIST_TRENDING_TOKENS, 1] })
    expect(query?.observers.length).toBe(1)

    // All 3 reads derive from the SAME underlying observer: `refetch` is a
    // stable bound method on the one shared observer, so reference equality
    // here would NOT have held pre-fix (each `useGetTrendingTokens()` call
    // minted its own observer with its own `refetch`).
    expect(result.current.avax.refetch).toBe(result.current.all.refetch)
    expect(result.current.btc.refetch).toBe(result.current.all.refetch)
  })

  it('does not change context value identity or re-render when only isStale flips (staleTime elapsing, zero data change)', async () => {
    // 5ms REAL staleTime: the observer schedules its stale timeout with a
    // real setTimeout while the initial fetch resolves, so fake timers
    // installed afterwards can't intercept it -- waiting it out is simpler.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 5 } }
    })

    const { result, waitFor } = renderHook(() => useTopTokens(), {
      wrapper: makeWrapper(client)
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    const rendersAfterMount = result.all.length
    const resultAfterMount = result.current

    // If `notifyOnChangeProps: 'all'` were set, or the provider exposed
    // `isStale`, this flip would re-render every consumer despite zero
    // data/isLoading/isRefetching change.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.all.length).toBe(rendersAfterMount)
    expect(result.current).toBe(resultAfterMount)
  })

  it('throws when used outside <WatchlistQueriesProvider> instead of silently mounting a second observer', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    const wrapper = ({ children }: PropsWithChildren): JSX.Element => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useTopTokens(), { wrapper })

    expect(result.error).toBeDefined()
    expect(result.error?.message).toMatch(/WatchlistQueriesProvider/)
  })
})
