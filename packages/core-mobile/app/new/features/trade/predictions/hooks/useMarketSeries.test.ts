jest.mock('features/trade/predictions/services/predictionMarketClient', () => ({
  predictionMarketClient: {
    markets: {
      listSeries: jest.fn()
    }
  }
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn()
}))

import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-hooks'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/trade/predictions/services/predictionMarketClient'
import { useMarketSeries } from './useMarketSeries'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockListSeries = predictionMarketClient.markets
  .listSeries as jest.MockedFunction<
  typeof predictionMarketClient.markets.listSeries
>

const mockSeries = [
  {
    ticker: 'POLITICS',
    title: 'Politics',
    category: 'Politics',
    kycRequired: false
  },
  {
    ticker: 'FINANCE',
    title: 'Finance',
    category: 'Finance',
    kycRequired: false
  }
]

beforeEach(() => {
  jest.clearAllMocks()

  mockUseQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null
  } as any)
})

describe('useMarketSeries', () => {
  it('calls useQuery with PREDICTIONS_SERIES key', () => {
    renderHook(() => useMarketSeries())
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [ReactQueryKeys.PREDICTIONS_SERIES]
      })
    )
  })

  it('queryFn calls listSeries and returns the series array', async () => {
    mockListSeries.mockResolvedValueOnce({ series: mockSeries } as never)

    let capturedQueryFn: (() => Promise<unknown>) | undefined
    mockUseQuery.mockImplementation(options => {
      capturedQueryFn = options.queryFn as () => Promise<unknown>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: undefined, isLoading: false, error: null } as any
    })

    renderHook(() => useMarketSeries())
    const result = await capturedQueryFn?.()
    expect(result).toEqual(mockSeries)
    expect(mockListSeries).toHaveBeenCalledTimes(1)
  })

  it('returns empty array when data is undefined', () => {
    const { result } = renderHook(() => useMarketSeries())
    expect(result.current.series).toEqual([])
  })

  it('returns series array when data is available', () => {
    mockUseQuery.mockReturnValue({
      data: mockSeries,
      isLoading: false,
      error: null
    } as any)
    const { result } = renderHook(() => useMarketSeries())
    expect(result.current.series).toHaveLength(2)
    expect(result.current.series[0]?.category).toBe('Politics')
  })

  it('forwards isLoading from useQuery', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as any)
    const { result } = renderHook(() => useMarketSeries())
    expect(result.current.isLoading).toBe(true)
  })
})
