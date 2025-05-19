import { IndexPath } from '@avalabs/k2-alpine'
import { useMemo, useState } from 'react'
import { defaultPrice, MarketToken, Prices } from 'store/watchlist'
import { compareTokenPriceChangePercentage24h } from 'features/track/utils/utils'
import { DropdownSelection } from 'new/common/types'

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
          return compareTokenPriceChangePercentage24h(b, a)
        case MarketSort.TopLosers:
          return compareTokenPriceChangePercentage24h(a, b)
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

enum MarketSort {
  Price = 'Price',
  MarketCap = 'Market cap',
  Volume = 'Volume',
  TopGainers = 'Top gainers',
  TopLosers = 'Top losers'
}

export enum MarketView {
  Grid = 'Grid view',
  List = 'List view'
}

type MarketSorts = MarketSort[][]
type MarketViews = MarketView[][]

const MARKET_SORTS: MarketSorts = [
  [
    MarketSort.Price,
    MarketSort.MarketCap,
    MarketSort.Volume,
    MarketSort.TopGainers,
    MarketSort.TopLosers
  ]
]

const MARKET_VIEWS: MarketViews = [[MarketView.Grid, MarketView.List]]
