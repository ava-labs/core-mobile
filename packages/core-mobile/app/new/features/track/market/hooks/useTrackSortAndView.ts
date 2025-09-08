import { useMemo, useState } from 'react'
import { defaultPrice, MarketToken, Prices } from 'store/watchlist'
import { compareTokenPriceChangePercentage24h } from 'features/track/utils/utils'
import { DropdownSelection } from 'new/common/types'
import { DropdownGroup } from 'common/components/DropdownMenu'

export const useTrackSortAndView = (
  tokens: MarketToken[],
  prices: Prices
): {
  data: MarketToken[]
  sort: DropdownSelection
  view: DropdownSelection
} => {
  const [selectedSort, setSelectedSort] = useState<MarketSort>(
    MarketSort.MarketCap
  )
  const [selectedView, setSelectedView] = useState<MarketView>(MarketView.List)

  const sortedTokens = useMemo(() => {
    if (Object.keys(prices).length === 0) return tokens

    return tokens.slice().sort((a, b) => {
      const priceB = prices[b.id] ?? defaultPrice
      const priceA = prices[a.id] ?? defaultPrice

      switch (selectedSort) {
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
  }, [prices, selectedSort, tokens])

  const sortData = useMemo(() => {
    return MARKET_SORTS.map(s => ({
      ...s,
      items: s.items.map(i => ({ ...i, selected: i.id === selectedSort }))
    }))
  }, [selectedSort])

  const viewData = useMemo(() => {
    return MARKET_VIEWS.map(s => ({
      ...s,
      items: s.items.map(i => ({ ...i, selected: i.id === selectedView }))
    }))
  }, [selectedView])

  return {
    sort: {
      title: 'Sort',
      data: sortData,
      selected: selectedSort,
      onSelected: (value: string) => {
        setSelectedSort(value as MarketSort)
      }
    },
    view: {
      title: 'View',
      data: viewData,
      selected: selectedView,
      onSelected: (value: string) => {
        setSelectedView(value as MarketView)
      }
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

const MARKET_SORTS: DropdownGroup[] = [
  {
    key: 'market-sorts',
    items: [
      { id: MarketSort.Price, title: MarketSort.Price },
      { id: MarketSort.MarketCap, title: MarketSort.MarketCap },
      { id: MarketSort.Volume, title: MarketSort.Volume },
      { id: MarketSort.TopGainers, title: MarketSort.TopGainers },
      { id: MarketSort.TopLosers, title: MarketSort.TopLosers }
    ]
  }
]

const MARKET_VIEWS: DropdownGroup[] = [
  {
    key: 'market-views',
    items: [
      { id: MarketView.Grid, title: MarketView.Grid },
      { id: MarketView.List, title: MarketView.List }
    ]
  }
]
