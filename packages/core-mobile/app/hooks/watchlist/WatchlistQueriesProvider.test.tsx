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

// CP-14918: regression coverage for the observer-fan-out fix, plus its
// fix-round-1 correction. Before this change, every `useTopTokens()` /
// `useGetTrendingTokens()` call minted its own `QueryObserver` for the same
// query key -- react-query dedupes the underlying fetch, but not the
// Observer, so N call sites meant N redundant 'observerResultsUpdated'
// notifications per real state change. Round 1 of the fix reintroduced a
// *different* fan-out by passing the raw `useQuery()` result through
// Context with `notifyOnChangeProps: 'all'` -- which disables tracked-props
// gating outright, so an isStale-only transition (staleTime elapsing, no
// data change) re-rendered every consumer. These tests pin all of:
//   1. exactly one `QueryObserver` exists for the key no matter how many
//      components read it (not just "one fetch" -- fetch-dedup alone
//      wouldn't have caught either bug);
//   2. every reader gets the identical result reference, not just equal
//      data;
//   3. an isStale-only transition changes NEITHER the context value
//      identity NOR triggers a re-render (round-1's actual bug);
//   4. reading outside the provider throws instead of silently mounting a
//      second observer.

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

    // Both reads come from the same shared context value.
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

    // The query key includes the resolved exchange rate, which starts
    // `undefined` (useExchangeRates() hasn't resolved yet) and becomes `1`
    // once it does -- two distinct keys, so two fetches. Critically, this
    // does NOT scale with the number of readers: 3 callers above still only
    // produce these same 2 fetches, because they all resolve through the
    // ONE observer <WatchlistQueriesProvider> mounted. This assertion alone
    // would also have passed on pre-fix code (fetch-dedup was never the
    // bug) -- the discriminating checks are the observer count and
    // `refetch` reference-identity assertions below.
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
    // Short REAL staleTime so the observer's internal `#updateStaleTimeout`
    // (queryObserver.ts:359-380) fires quickly -- this calls a bare
    // `updateResult()` with no fetch and no data change, just `isStale`
    // flipping true. Production uses the global `staleTime: 10000`
    // (ReactQueryProvider.tsx:27); this test uses 5ms to keep it fast. Real
    // (not fake) timers: `#updateStaleTimeout` schedules its `setTimeout`
    // synchronously while resolving the initial fetch, so switching to fake
    // timers afterwards wouldn't intercept that already-scheduled real
    // timer anyway -- and 5ms is fast enough to just really wait it out.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 5 } }
    })

    const { result, waitFor } = renderHook(() => useTopTokens(), {
      wrapper: makeWrapper(client)
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    const rendersAfterMount = result.all.length
    const resultAfterMount = result.current

    // Let the real staleTimeout elapse. If `notifyOnChangeProps: 'all'`
    // (round-1's bug) were still set, or if the provider read/exposed
    // `isStale`, this would produce a new context value and re-render
    // every consumer despite zero data/isLoading/isRefetching change.
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
