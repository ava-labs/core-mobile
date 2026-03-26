jest.mock('features/predictions/services/predictionMarketClient', () => ({
  predictionMarketClient: {
    markets: {
      listTradableMarkets: jest.fn()
    }
  }
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn()
}))

import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-hooks'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/predictions/services/predictionMarketClient'
import { useTradableMarkets } from './useTradableMarkets'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockListTradableMarkets =
  predictionMarketClient.markets.listTradableMarkets as jest.MockedFunction<
    typeof predictionMarketClient.markets.listTradableMarkets
  >

const openMarket = {
  tickerId: 'INXD-24-B4900',
  title: 'S&P 500 above 4900?',
  category: 'Finance',
  imageUrl: null,
  openTime: '2024-01-01T00:00:00Z',
  closeTime: '2024-12-31T00:00:00Z',
  expectedExpirationTime: '2024-12-31T00:00:00Z',
  volume: '1000.00',
  volume24h: '200.00',
  kycRequired: false,
  yesQuote: { maxBidPrice: '0.71', minAskPrice: '0.73' },
  noQuote: { maxBidPrice: '0.27', minAskPrice: '0.29' }
}

const resolvedMarket = { ...openMarket, tickerId: 'RESOLVED-1', result: 'yes' }

beforeEach(() => {
  jest.clearAllMocks()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null } as any)
})

describe('useTradableMarkets', () => {
  it('calls useQuery with PREDICTIONS_MARKETS key', () => {
    renderHook(() => useTradableMarkets())
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [ReactQueryKeys.PREDICTIONS_MARKETS]
      })
    )
  })

  it('queryFn filters out resolved markets', async () => {
    mockListTradableMarkets.mockResolvedValueOnce({
      markets: [openMarket, resolvedMarket]
    } as never)

    let capturedQueryFn: (() => Promise<unknown>) | undefined
    mockUseQuery.mockImplementation(options => {
      capturedQueryFn = options.queryFn as () => Promise<unknown>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: undefined, isLoading: false, error: null } as any
    })

    renderHook(() => useTradableMarkets())
    const result = await capturedQueryFn?.()
    expect(result).toEqual([openMarket])
  })

  it('returns empty array when data is undefined', () => {
    const { result } = renderHook(() => useTradableMarkets())
    expect(result.current.markets).toEqual([])
  })

  it('forwards isLoading and error from useQuery', () => {
    const err = new Error('network error')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, error: err } as any)
    const { result } = renderHook(() => useTradableMarkets())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(err)
  })
})
