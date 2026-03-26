import { useState, useMemo } from 'react'
import type { TradableMarket } from '@avalabs/prediction-market-sdk'

export const TRENDING_CHIP = 'Trending'

/**
 * Pure logic hook — no API calls, no async work.
 *
 * - "Trending" chip = all markets, sorted by volume24h descending (default)
 * - Category chip = markets where market.category === chip label
 * - sortByExpiry = sort ascending by expectedExpirationTime
 *
 * volume24h is a decimal string — use parseFloat() for comparison.
 */
export function usePredictionsFilter(markets: TradableMarket[]): {
  selectedChip: string
  sortByExpiry: boolean
  filteredMarkets: TradableMarket[]
  selectChip: (chip: string) => void
  setSortByExpiry: (value: boolean) => void
} {
  const [selectedChip, setSelectedChip] = useState<string>(TRENDING_CHIP)
  const [sortByExpiry, setSortByExpiry] = useState<boolean>(false)

  const filteredMarkets = useMemo(() => {
    const base =
      selectedChip === TRENDING_CHIP
        ? [...markets]
        : markets.filter(m => m.category === selectedChip)

    if (sortByExpiry) {
      return [...base].sort(
        (a, b) =>
          new Date(a.expectedExpirationTime).getTime() -
          new Date(b.expectedExpirationTime).getTime()
      )
    }

    return [...base].sort(
      (a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h)
    )
  }, [markets, selectedChip, sortByExpiry])

  return {
    selectedChip,
    sortByExpiry,
    filteredMarkets,
    selectChip: setSelectedChip,
    setSortByExpiry
  }
}
