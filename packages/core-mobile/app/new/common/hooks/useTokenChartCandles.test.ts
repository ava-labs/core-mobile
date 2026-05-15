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
  value: number
): { date: Date; value: number } => ({
  date: new Date(ts),
  value
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
          currency: VsCurrencyType.USD,
          mode: 'line'
        })
      )
      expect(result.current).toEqual({ candles: [], state: 'empty' })
    })

    it('returns loading state while the query is in flight', () => {
      setQueryResult({ isLoading: true })
      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD,
          mode: 'line'
        })
      )
      expect(result.current).toEqual({ candles: [], state: 'loading' })
    })

    it('returns error state when the query fails', () => {
      setQueryResult({ isError: true })
      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD,
          mode: 'line'
        })
      )
      expect(result.current).toEqual({ candles: [], state: 'error' })
    })

    it('returns empty state when the response has no points', () => {
      setQueryResult({ data: { dataPoints: [], ranges: {} } })
      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD,
          mode: 'line'
        })
      )
      expect(result.current).toEqual({ candles: [], state: 'empty' })
    })
  })

  describe('line mode (flat candles)', () => {
    it('emits one candle per data point with open=high=low=close=value', () => {
      const points = [
        makePoint(1000, 10),
        makePoint(2000, 20),
        makePoint(3000, 15)
      ]
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD,
          mode: 'line'
        })
      )

      expect(result.current.state).toBe('loaded')
      expect(result.current.candles).toEqual([
        { ts: 1000, open: 10, high: 10, low: 10, close: 10, volume: null },
        { ts: 2000, open: 20, high: 20, low: 20, close: 20, volume: null },
        { ts: 3000, open: 15, high: 15, low: 15, close: 15, volume: null }
      ])
    })

    it('treats non-finite values as 0', () => {
      const points = [makePoint(1000, NaN), makePoint(2000, Infinity)]
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD,
          mode: 'line'
        })
      )

      expect(result.current.candles.map(c => c.close)).toEqual([0, 0])
    })
  })

  describe('candlestick mode (bucketed OHLC)', () => {
    it('produces 24 candles from 24 sub-points for the 1D range', () => {
      const points = Array.from({ length: 24 }, (_, i) =>
        makePoint(i * 60_000, 100 + i)
      )
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD,
          mode: 'candlestick'
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
          currency: VsCurrencyType.USD,
          mode: 'candlestick'
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

    it('always sets volume to null (CoinGecko market_chart has no volume)', () => {
      const points = [makePoint(1000, 10), makePoint(2000, 20)]
      setQueryResult({ data: { dataPoints: points, ranges: {} } })

      const { result } = renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1D',
          currency: VsCurrencyType.USD,
          mode: 'candlestick'
        })
      )

      expect(result.current.candles.every(c => c.volume === null)).toBe(true)
    })
  })

  describe('query key', () => {
    it('uses [TOKEN_CHART_DATA, coingeckoId, range, currency]', () => {
      renderHook(() =>
        useTokenChartCandles({
          coingeckoId: 'bitcoin',
          range: '1W',
          currency: VsCurrencyType.EUR,
          mode: 'line'
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
          currency: VsCurrencyType.USD,
          mode: 'line'
        })
      )
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      )
    })
  })
})
