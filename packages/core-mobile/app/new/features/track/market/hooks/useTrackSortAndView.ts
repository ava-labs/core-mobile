import { IndexPath } from '@avalabs/k2-alpine'
import { useMemo, useState } from 'react'
import { defaultPrice, MarketToken, Prices } from 'store/watchlist'
import { comparePercentChange } from 'features/track/utils'
import { DropdownSelection } from 'common/components/DropdownSelections'
import { MARKET_SORTS, MARKET_VIEWS, MarketSort } from '../consts'

export const useTrackSortAndView = (
  tokens: MarketToken[],
  prices: Prices
): {
  data: MarketToken[]
  sort: DropdownSelection
  view: DropdownSelection
} => {
  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 1
  })
  const [selectedView, setSelectedView] = useState<IndexPath>({
    section: 0,
    row: 1
  })

  const sortOption = useMemo(() => {
    return (
      MARKET_SORTS?.[selectedSort.section]?.[selectedSort.row] ??
      MarketSort.MarketCap
    )
  }, [selectedSort])

  const sortedTokens = useMemo(() => {
    if (Object.keys(prices).length === 0) return tokens

    return tokens.slice().sort((a, b) => {
      const priceB = prices[b.id] ?? defaultPrice
      const priceA = prices[a.id] ?? defaultPrice

      switch (sortOption) {
        case MarketSort.MarketCap:
          return priceB.marketCap - priceA.marketCap
        case MarketSort.Volume:
          return priceB.vol24 - priceA.vol24
        case MarketSort.TopGainers:
          return comparePercentChange(b, a)
        case MarketSort.TopLosers:
          return comparePercentChange(a, b)
        case MarketSort.Price:
        default:
          return priceB.priceInCurrency - priceA.priceInCurrency
      }
    })
  }, [prices, sortOption, tokens])

  return {
    sort: {
      title: 'Sort',
      data: MARKET_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort
    },
    view: {
      title: 'View',
      data: MARKET_VIEWS,
      selected: selectedView,
      onSelected: setSelectedView
    },
    data: sortedTokens
  }
}
