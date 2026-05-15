/**
 * Static OHLCV fixtures used for on-device visual verification of the price
 * chart (CP-14265 scaffolding). Replaced by `useTokenOhlc` in CP-14267.
 */
import { ChartRange, OhlcvResponse } from '@avalabs/k2-alpine'

export const CHART_FIXTURES: Record<ChartRange, OhlcvResponse> = {
  '1H': require('./__fixtures__/ohlcv-avax-1h.json'),
  '1D': require('./__fixtures__/ohlcv-avax-1d.json'),
  '1W': require('./__fixtures__/ohlcv-avax-1w.json'),
  '1M': require('./__fixtures__/ohlcv-avax-1m.json'),
  '3M': require('./__fixtures__/ohlcv-avax-3m.json'),
  '1Y': require('./__fixtures__/ohlcv-avax-1y.json')
}
