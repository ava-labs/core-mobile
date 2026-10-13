import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-hooks'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import type { ChartRange } from '@avalabs/k2-alpine'
import TokenService from 'services/token/TokenService'
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
    it('emits a single flat candle when the response has one point', () => {
      const points = [makePoint(1000, 42)]
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      expect(result.current.state).toBe('loaded')
      expect(result.current.candles).toEqual([
        { ts: 1000, open: 42, high: 42, low: 42, close: 42, volume: null }
      ])
    })

    // Halves the candle count rather than emitting one candle per source
    // point, since a one-point bucket can only ever be flat.
    it('buckets coarse data into fewer multi-point candles instead of one-point candles', () => {
      const points = Array.from({ length: 48 }, (_, i) =>
        makePoint(i * 60_000, 100 + (i % 2 === 0 ? i : -i))
      )
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      // 48 source points, bucket count 48 -> 24 buckets of 2 points each,
      // so each candle opens on every other source point.
      const { candles } = result.current
      expect(candles.length).toBe(24)
      expect(candles.map(c => c.ts)).toEqual(
        Array.from({ length: 24 }, (_, i) => i * 2 * 60_000)
      )
      expect(candles[0]).toEqual(
        expect.objectContaining({ open: 100, close: 99, high: 100, low: 99 })
      )
    })

    // ~25 hourly points is what `days=1` degrades to if CoinGecko ever
    // returns hourly instead of 5-minutely granularity.
    it('produces real candles from a coarse hourly 1D response', () => {
      const points = Array.from({ length: 25 }, (_, i) =>
        makePoint(i * 3_600_000, i % 2 === 0 ? 100 + i : 100 - i)
      )
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      const { candles } = result.current
      expect(candles.length).toBeGreaterThan(1)
      expect(candles.every(c => c.high >= c.low)).toBe(true)
      expect(candles.some(c => c.high > c.low)).toBe(true)
      expect(candles.some(c => c.close < c.open)).toBe(true)
    })

    it('merges a short trailing slice so the last candle is not flat', () => {
      // 25 points into 12 affordable buckets = 3 per bucket, leaving a
      // 1-point tail that has to be folded into the previous candle.
      const points = Array.from({ length: 25 }, (_, i) =>
        makePoint(i * 1000, i)
      )
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD
        })
      )

      const { candles } = result.current
      const last = candles[candles.length - 1]
      expect(candles.length).toBe(8)
      expect(last).toEqual(
        expect.objectContaining({ open: 21, close: 24, high: 24, low: 21 })
      )
    })

    it('aggregates open/high/low/close per bucket correctly', () => {
      // 96 source points bucketed into 48 candles (1D) = 2 points per bucket.
      const points: ReturnType<typeof makePoint>[] = []
      for (let i = 0; i < 96; i++) {
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

      expect(result.current.candles.length).toBe(48)
      expect(result.current.candles[0]).toEqual(
        expect.objectContaining({
          open: 0,
          close: 1,
          high: 1,
          low: 0
        })
      )
      expect(result.current.candles[47]).toEqual(
        expect.objectContaining({
          open: 94,
          close: 95,
          high: 95,
          low: 94
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
      // 96 source points bucketed into 48 candles (1D) = 2 points per bucket,
      // each carrying volume 10 → per-bucket volume 20.
      const points: ReturnType<typeof makePoint>[] = []
      for (let i = 0; i < 96; i++) {
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

      expect(result.current.candles.length).toBe(48)
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

      expect(result.current.candles.map(c => c.close)).toEqual([0])
    })
  })

  describe('endpoint selection', () => {
    const runQueryFn = (range: ChartRange): void => {
      renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range,
          currency: VsCurrencyType.USD
        })
      )
      const { queryFn } = mockUseQuery.mock.calls[0]?.[0] as unknown as {
        queryFn: () => unknown
      }
      queryFn()
    }

    // The range endpoint only returns hourly granularity on our plan, which
    // is too coarse to bucket a day into candles.
    it('fetches 1D via days=1 rather than the range endpoint', () => {
      runQueryFn('1D')
      expect(TokenService.getChartDataForCoinId).toHaveBeenCalledWith(
        expect.objectContaining({ days: 1 })
      )
      expect(TokenService.getChartDataForCoinRange).not.toHaveBeenCalled()
    })

    it('fetches 1H via the range endpoint over a 2h window', () => {
      runQueryFn('1H')
      expect(TokenService.getChartDataForCoinId).not.toHaveBeenCalled()
      const arg = (TokenService.getChartDataForCoinRange as jest.Mock).mock
        .calls[0]?.[0] as { from: number; to: number }
      expect(arg.to - arg.from).toBe(2 * 60 * 60)
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
