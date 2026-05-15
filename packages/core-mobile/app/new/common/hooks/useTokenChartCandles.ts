import type {
  ChartRange,
  ChartState,
  OhlcCandle,
  PriceChartMode
} from '@avalabs/k2-alpine'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import TokenService from 'services/token/TokenService'

// CoinGecko granularity by `days`: 1 → 5m, 2-90 → hourly, >90 → daily.
// 1H uses the range endpoint (null here) to get 5-min data.
const RANGE_TO_DAYS: Record<ChartRange, number | null> = {
  '1H': null,
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365
}

const RANGE_TO_CANDLE_COUNT: Record<ChartRange, number> = {
  '1H': 12,
  '1D': 24,
  '1W': 48,
  '1M': 30,
  '3M': 48,
  '1Y': 52
}

const HOUR_RANGE_WINDOW_SECONDS = 2 * 60 * 60

type PriceDataPoint = { date: Date; value: number }

const sanitizeValue = (n: number): number => (Number.isFinite(n) ? n : 0)
const pointTimestamp = (p: PriceDataPoint): number =>
  p.date instanceof Date ? p.date.getTime() : Number(p.date) || 0

const pointsToFlatCandles = (points: PriceDataPoint[]): OhlcCandle[] =>
  points.map(p => {
    const value = sanitizeValue(p.value)
    return {
      ts: pointTimestamp(p),
      open: value,
      high: value,
      low: value,
      close: value,
      volume: null
    }
  })

const sliceToCandle = (slice: PriceDataPoint[]): OhlcCandle | null => {
  const first = slice[0]
  const last = slice[slice.length - 1]
  if (!first || !last) return null
  let high = -Infinity
  let low = Infinity
  for (const p of slice) {
    const value = sanitizeValue(p.value)
    if (value > high) high = value
    if (value < low) low = value
  }
  if (!Number.isFinite(high) || !Number.isFinite(low)) return null
  return {
    ts: pointTimestamp(first),
    open: sanitizeValue(first.value),
    high,
    low,
    close: sanitizeValue(last.value),
    volume: null
  }
}

// Approximate OHLC: upstream only provides close prices, so `open` is the
// first close in the bucket and `close` is the last. Volume always null.
// Real OHLCV comes with CP-14267.
const bucketPointsIntoCandles = (
  points: PriceDataPoint[],
  bucketCount: number
): OhlcCandle[] => {
  if (points.length === 0 || bucketCount <= 0) return []
  const pointsPerBucket = Math.max(1, Math.ceil(points.length / bucketCount))
  const candles: OhlcCandle[] = []
  for (let i = 0; i < points.length; i += pointsPerBucket) {
    const candle = sliceToCandle(points.slice(i, i + pointsPerBucket))
    if (candle) candles.push(candle)
  }
  return candles
}

export const useTokenChartCandles = ({
  coingeckoId,
  range,
  currency,
  mode
}: {
  coingeckoId: string | undefined
  range: ChartRange
  currency: VsCurrencyType
  mode: PriceChartMode
}): { candles: OhlcCandle[]; state: ChartState } => {
  const days = RANGE_TO_DAYS[range]
  const enabled = Boolean(coingeckoId)

  const { data, isLoading, isError } = useQuery({
    enabled,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ReactQueryKeys.TOKEN_CHART_DATA, coingeckoId, range, currency],
    queryFn: () => {
      if (days === null) {
        const toSec = Math.floor(Date.now() / 1000)
        const fromSec = toSec - HOUR_RANGE_WINDOW_SECONDS
        return TokenService.getChartDataForCoinRange({
          coingeckoId: coingeckoId as string,
          from: fromSec,
          to: toSec,
          currency
        })
      }
      return TokenService.getChartDataForCoinId({
        coingeckoId: coingeckoId as string,
        days,
        currency
      })
    },
    staleTime: 60_000,
    networkMode: 'offlineFirst'
  })

  return useMemo(() => {
    if (!enabled)
      return { candles: [] as OhlcCandle[], state: 'empty' as ChartState }
    if (isLoading)
      return { candles: [] as OhlcCandle[], state: 'loading' as ChartState }
    if (isError)
      return { candles: [] as OhlcCandle[], state: 'error' as ChartState }
    const points = data?.dataPoints ?? []
    if (points.length === 0)
      return { candles: [] as OhlcCandle[], state: 'empty' as ChartState }
    const candles =
      mode === 'candlestick'
        ? bucketPointsIntoCandles(points, RANGE_TO_CANDLE_COUNT[range])
        : pointsToFlatCandles(points)
    return { candles, state: 'loaded' as ChartState }
  }, [enabled, isLoading, isError, data, mode, range])
}
