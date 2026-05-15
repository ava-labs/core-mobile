export type OhlcCandle = {
  /** Start of the candle bucket, ms epoch UTC. Inclusive. */
  ts: number
  open: number
  high: number
  low: number
  close: number
  /** null when source doesn't provide volume. */
  volume: number | null
}

export type ChartRange = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y'

export type OhlcvResponse = {
  coinId: string
  range: ChartRange
  vsCurrency: string
  granularity: string
  lastUpdatedAt: number
  candles: OhlcCandle[]
}

export const CHART_RANGES: readonly ChartRange[] = [
  '1D',
  '1W',
  '1M',
  '3M',
  '1Y'
] as const

export type PriceChartMode = 'candlestick' | 'line'

export type ChartState = 'loaded' | 'loading' | 'empty' | 'error'

export type YAxisTick = {
  price: number
  /** Canvas-relative y position of the gridline (label sits above this). */
  y: number
}
