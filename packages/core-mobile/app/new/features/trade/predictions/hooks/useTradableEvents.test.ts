jest.mock('features/trade/predictions/services/predictionMarketClient', () => ({
  predictionMarketClient: {
    markets: {
      listEvents: jest.fn()
    }
  }
}))

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn()
}))

import { useInfiniteQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-hooks'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/trade/predictions/services/predictionMarketClient'
import { useTradableEvents } from './useTradableEvents'

const mockUseInfiniteQuery = useInfiniteQuery as jest.MockedFunction<
  typeof useInfiniteQuery
>
const mockListEvents = predictionMarketClient.markets
  .listEvents as jest.MockedFunction<
  typeof predictionMarketClient.markets.listEvents
>

const eventA = {
  eventTicker: 'EVT-A',
  title: 'Event A',
  seriesTicker: 'S1',
  volume: '100'
}

const eventB = {
  eventTicker: 'EVT-B',
  title: 'Event B',
  seriesTicker: 'S1',
  volume: '200'
}

beforeEach(() => {
  jest.clearAllMocks()

  mockUseInfiniteQuery.mockReturnValue({
    data: undefined,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isPending: false,
    refetch: jest.fn()
  } as any)
})

describe('useTradableEvents', () => {
  it('calls useInfiniteQuery with PREDICTIONS_MARKETS key', () => {
    renderHook(() => useTradableEvents())
    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [ReactQueryKeys.PREDICTIONS_MARKETS]
      })
    )
  })

  it('queryFn requests first page without cursor', async () => {
    mockListEvents.mockResolvedValueOnce({
      events: [eventA],
      cursor: 'next-cursor'
    } as never)

    let capturedQueryFn:
      | ((ctx: { pageParam: string | undefined }) => Promise<unknown>)
      | undefined
    mockUseInfiniteQuery.mockImplementation(options => {
      capturedQueryFn = options.queryFn as typeof capturedQueryFn
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: undefined, isPending: true, refetch: jest.fn() } as any
    })

    renderHook(() => useTradableEvents())
    await capturedQueryFn?.({ pageParam: undefined })
    expect(mockListEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        withNestedMarkets: true,
        limit: 30
      })
    )
    expect(mockListEvents).toHaveBeenCalledWith(
      expect.not.objectContaining({ cursor: expect.anything() })
    )
  })

  it('queryFn passes cursor for subsequent pages', async () => {
    mockListEvents.mockResolvedValueOnce({ events: [eventB] } as never)

    let capturedQueryFn:
      | ((ctx: { pageParam: string | undefined }) => Promise<unknown>)
      | undefined
    mockUseInfiniteQuery.mockImplementation(options => {
      capturedQueryFn = options.queryFn as typeof capturedQueryFn
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: undefined, isPending: true, refetch: jest.fn() } as any
    })

    renderHook(() => useTradableEvents())
    await capturedQueryFn?.({ pageParam: 'c1' })
    expect(mockListEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: 'c1',
        limit: 30,
        withNestedMarkets: true
      })
    )
  })

  it('getNextPageParam returns cursor when present', () => {
    let getNextPageParam:
      | ((lastPage: { cursor?: string | null; events: unknown[] }) => unknown)
      | undefined
    mockUseInfiniteQuery.mockImplementation(options => {
      getNextPageParam = options.getNextPageParam as typeof getNextPageParam
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: undefined, isPending: false, refetch: jest.fn() } as any
    })

    renderHook(() => useTradableEvents())
    expect(getNextPageParam?.({ events: [eventA], cursor: 'abc' })).toBe('abc')
    expect(
      getNextPageParam?.({ events: [eventA], cursor: null })
    ).toBeUndefined()
    expect(getNextPageParam?.({ events: [eventA], cursor: '' })).toBeUndefined()
  })

  it('flattens paginated events', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { events: [eventA], cursor: 'c1' },
          { events: [eventB], cursor: null }
        ]
      },
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      isPending: false,
      refetch: jest.fn()
    } as any)

    const { result } = renderHook(() => useTradableEvents())
    expect(result.current.events).toEqual([eventA, eventB])
  })

  it('returns empty events when data is undefined', () => {
    const { result } = renderHook(() => useTradableEvents())
    expect(result.current.events).toEqual([])
  })

  it('derives isRefreshing when refetching but not loading next page', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ events: [eventA] }] },
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: false,
      isPending: false,
      refetch: jest.fn()
    } as any)
    const { result } = renderHook(() => useTradableEvents())
    expect(result.current.isRefreshing).toBe(true)
  })

  it('isRefreshing is false while fetching next page', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ events: [eventA] }] },
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: true,
      isPending: false,
      refetch: jest.fn()
    } as any)
    const { result } = renderHook(() => useTradableEvents())
    expect(result.current.isRefreshing).toBe(false)
  })
})
