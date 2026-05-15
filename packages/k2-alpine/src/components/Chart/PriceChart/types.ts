/**
 * OHLCV candle as returned by the backend `/v1/tokens/{coinId}/ohlcv` endpoint.
 * Contract documented in CP-14219-FerencSyncPrep.md.
 */
export type OhlcCandle = {
  /** Start of the candle bucket, ms epoch UTC. Inclusive. */
  ts: number
  open: number
  high: number
  low: number
  close: number
  /** Total trade volume in vsCurrency over the bucket. null when source doesn't provide volume. */
  volume: number | null
}

/** Time-range selectable on the chart. */
export type ChartRange = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y'

/** Full backend response shape. */
export type OhlcvResponse = {
  coinId: string
  range: ChartRange
  vsCurrency: string
  /** Server-decided granularity string, e.g. '1m', '5m', '15m', '1h', '4h', '1d'. */
  granularity: string
  /** ms epoch UTC when backend last refreshed this data. */
  lastUpdatedAt: number
  candles: OhlcCandle[]
}

/** All available ranges in display order. */
export const CHART_RANGES: readonly ChartRange[] = [
  '1H',
  '1D',
  '1W',
  '1M',
  '3M',
  '1Y'
] as const

/** Rendering mode for the price series. */
export type PriceChartMode = 'candlestick' | 'line'

/** Loading / data state of the chart. */
export type ChartState = 'loaded' | 'loading' | 'empty' | 'error'

/** Pre-computed y-axis tick — used to keep gridlines and labels aligned. */
export type YAxisTick = {
  /** Price value displayed on the label. */
  price: number
  /** Canvas-relative y position of the gridline (label sits above this). */
  y: number
}
