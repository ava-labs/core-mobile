import { useMemo } from 'react'
import { PerpMarketData, PerpMarketView } from '../types'
import {
  buildCoinCategoryIndex,
  CATEGORY_LABELS,
  CoinCategoryIndex
} from '../utils/marketCategories'
import { usePerpCategories } from './usePerpCategories'
import { usePerpsMarkets } from './usePerpsMarkets'

export type UsePerpetualMarketsResult = {
  markets: PerpMarketView[]
  categoryIndex: CoinCategoryIndex
  isLoading: boolean
  isRefreshing: boolean
  refetch: () => void
}

/**
 * Adapts the real Hyperliquid-backed {@link PerpMarketData} universe
 * (native + HIP-3, from {@link usePerpsMarkets}) onto the
 * {@link PerpMarketView} display model consumed by the perpetuals screens.
 *
 * The list is ranked by 24h notional volume (rank 1 = largest market) so the
 * `rank` shown next to each symbol is stable regardless of the caller's current
 * sort, and the default (unsorted / "Trending") order reads biggest-first.
 *
 * `tags` are the market's categories (native crypto sectors + HIP-3 asset
 * classes); `changePercent`/`changeStatus` are split from our signed fraction
 * into a non-negative magnitude percentage + a direction, matching upstream.
 */
export const usePerpetualMarkets = (): UsePerpetualMarketsResult => {
  const {
    markets: perpMarkets,
    isLoading,
    isRefreshing,
    refetch
  } = usePerpsMarkets()
  const hip3Categories = usePerpCategories()

  const categoryIndex = useMemo(
    () => buildCoinCategoryIndex(hip3Categories),
    [hip3Categories]
  )

  const markets = useMemo<PerpMarketView[]>(() => {
    return perpMarkets
      .toSorted((a, b) => b.volume - a.volume)
      .map((market, index) =>
        toPerpetualMarket(market, index + 1, categoryIndex)
      )
  }, [perpMarkets, categoryIndex])

  return { markets, categoryIndex, isLoading, isRefreshing, refetch }
}

/** Category chip labels for a coin, or `undefined` when it has none. */
const tagsForCoin = (
  symbol: string,
  categoryIndex: CoinCategoryIndex
): string[] | undefined => {
  const categories = categoryIndex.get(symbol)
  if (categories === undefined || categories.size === 0) {
    return undefined
  }
  return Array.from(categories, id => CATEGORY_LABELS[id])
}

const toPerpetualMarket = (
  market: PerpMarketData,
  rank: number,
  categoryIndex: CoinCategoryIndex
): PerpMarketView => ({
  id: market.symbol,
  symbol: market.symbol,
  rank,
  volume: market.volume,
  price: market.price,
  // The row UI pairs a non-negative magnitude with a separate direction; our
  // `changePercent` is a signed fraction (0.0123 = +1.23%).
  changePercent: Math.abs(market.changePercent) * 100,
  changeStatus: market.changeStatus,
  tags: tagsForCoin(market.symbol, categoryIndex)
})
