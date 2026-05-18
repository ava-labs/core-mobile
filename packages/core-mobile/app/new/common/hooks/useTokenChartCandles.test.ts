import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-hooks'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useTokenChartCandles } from './useTokenChartCandles'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn()
}))

jest.mock('services/token/TokenService', () => ({
  __esModule: true,
  default: {
    getChartDataForCoinId: jest.fn(),
    getChartDataForCoinRange: jest.fn()
  }
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

const setQueryResult = (result: Partial<ReturnType<typeof useQuery>>): void => {
  mockUseQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

const makePoint = (
  ts: number,
  value: number,
  volume: number | null = null
): { date: Date; value: number; volume: number | null } => ({
  date: new Date(ts),
  value,
  volume
})

describe('useTokenChartCandles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setQueryResult({ data: undefined, isLoading: false, isError: false })
  })

  describe('state machine', () => {
    it('returns empty state when coingeckoId is undefined', () => {
      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: undefined,
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )
      expect(result.current).toEqual({
        candles: [],
        state: 'empty',
        isFetching: false
      })
    })

    it('returns loading state while the query is in flight', () => {
      setQueryResult({ isLoading: true })
      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )
      expect(result.current).toEqual({
        candles: [],
        state: 'loading',
        isFetching: false
      })
    })

    it('returns error state when the query fails', () => {
      setQueryResult({ isError: true })
      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )
      expect(result.current).toEqual({
        candles: [],
        state: 'error',
        isFetching: false
      })
    })

    it('returns empty state when the response has no points', () => {
      setQueryResult({ data: { dataPoints: [], ranges: {} } })
      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )
      expect(result.current).toEqual({
        candles: [],
        state: 'empty',
        isFetching: false
      })
    })
  })

  describe('bucketing', () => {
    it('produces 24 candles from 24 sub-points for the 1D range', () => {
      const points = Array.from({ length: 24 }, (_, i) =>
        makePoint(i * 60_000, 100 + i)
      )
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      expect(result.current.candles.length).toBe(24)
      const first = result.current.candles[0]
      expect(first).toEqual(
        expect.objectContaining({
          open: 100,
          close: 100,
          high: 100,
          low: 100,
          volume: null
        })
      )
    })

    it('aggregates open/high/low/close per bucket correctly', () => {
      const points: ReturnType<typeof makePoint>[] = []
      for (let i = 0; i < 48; i++) {
        points.push(makePoint(i * 1000, i))
      }
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      expect(result.current.candles.length).toBe(24)
      expect(result.current.candles[0]).toEqual(
        expect.objectContaining({
          open: 0,
          close: 1,
          high: 1,
          low: 0
        })
      )
      expect(result.current.candles[23]).toEqual(
        expect.objectContaining({
          open: 46,
          close: 47,
          high: 47,
          low: 46
        })
      )
    })

    it('sets volume to null when source points have no volume', () => {
      const points = [makePoint(1000, 10), makePoint(2000, 20)]
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      expect(result.current.candles.every(c => c.volume === null)).toBe(true)
    })

    it('sums per-bucket volumes when source points carry volume', () => {
      const points: ReturnType<typeof makePoint>[] = []
      for (let i = 0; i < 48; i++) {
        points.push(makePoint(i * 1000, i, 10))
      }
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      expect(result.current.candles.length).toBe(24)
      expect(result.current.candles.every(c => c.volume === 20)).toBe(true)
    })

    it('treats non-finite values as 0', () => {
      const points = [makePoint(1000, NaN), makePoint(2000, Infinity)]
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      expect(result.current.candles.map(c => c.close)).toEqual([0, 0])
    })
  })

  describe('query key', () => {
    it('uses [TOKEN_CHART_DATA, coingeckoId, range, currency]', () => {
      renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1W',
          currency: VsCurrencyType.EUR
        })
      )
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [
            ReactQueryKeys.TOKEN_CHART_DATA,
            'bitcoin',
            '1W',
            VsCurrencyType.EUR
          ],
          enabled: true
        })
      )
    })

    it('disables the query when coingeckoId is undefined', () => {
      renderHook(() =>
        useTokenChartCandles({
          coingeckoId: undefined,
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      )
    })
  })
})
