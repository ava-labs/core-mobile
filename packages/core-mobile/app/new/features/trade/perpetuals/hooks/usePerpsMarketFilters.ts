import { useMemo, useState } from 'react'
import { PerpMarketData } from '../types'
import {
  availableCategories,
  buildCoinCategoryIndex,
  CATEGORY_LABELS,
  CategoryId
} from '../utils/marketCategories'
import { usePerpCategories } from './usePerpCategories'

export const PERPS_SORT_CHIPS = ['Trending', 'Volume', 'Change'] as const
export type PerpsSortChip = typeof PERPS_SORT_CHIPS[number]

/** A category chip: its canonical id and the label shown on the chip. */
export type PerpsCategoryChip = {
  id: CategoryId
  label: string
}

const sortMarkets = (
  markets: PerpMarketData[],
  chip: PerpsSortChip
): PerpMarketData[] => {
  switch (chip) {
    case 'Change':
      return markets.toSorted((a, b) => b.changePercent - a.changePercent)
    case 'Volume':
    case 'Trending':
    default:
      return markets.toSorted((a, b) => b.volume - a.volume)
  }
}

/**
 * Client-side filtering + sorting of the perps universe.
 *
 * - Category chips (native crypto sectors + HIP-3 asset classes) narrow the list
 *   to markets in the selected category. `undefined` = "All".
 * - Sort chips then rank the result: "Trending"/"Volume" by 24h notional volume,
 *   "Change" by 24h price change.
 *
 * Category filtering is applied before the sort, mirroring core-web.
 */
export const usePerpsMarketFilters = (
  markets: PerpMarketData[]
): {
  selectedChip: PerpsSortChip
  selectChip: (chip: PerpsSortChip) => void
  categories: PerpsCategoryChip[]
  selectedCategory: CategoryId | undefined
  selectCategory: (category: CategoryId | undefined) => void
  sortedMarkets: PerpMarketData[]
} => {
  const [selectedChip, setSelectedChip] = useState<PerpsSortChip>('Trending')
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryId | undefined
  >(undefined)

  const hip3Categories = usePerpCategories()
  const categoryIndex = useMemo(
    () => buildCoinCategoryIndex(hip3Categories),
    [hip3Categories]
  )

  // Only surface category chips that have at least one present market.
  const categories = useMemo<PerpsCategoryChip[]>(() => {
    const names = markets.map(m => m.symbol)
    return availableCategories(names, categoryIndex).map(id => ({
      id,
      label: CATEGORY_LABELS[id]
    }))
  }, [markets, categoryIndex])

  const sortedMarkets = useMemo(() => {
    const filtered =
      selectedCategory === undefined
        ? markets
        : markets.filter(
            m => categoryIndex.get(m.symbol)?.has(selectedCategory) ?? false
          )
    return sortMarkets(filtered, selectedChip)
  }, [markets, categoryIndex, selectedCategory, selectedChip])

  return {
    selectedChip,
    selectChip: setSelectedChip,
    categories,
    selectedCategory,
    selectCategory: setSelectedCategory,
    sortedMarkets
  }
}
