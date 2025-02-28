export enum MarketFilter {
  Hours = '24 hours',
  Week = '1 week',
  Month = 'month',
  ThreeMonths = '3 months',
  Year = '1 year'
}
export enum MarketSort {
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

export type MarketFilters = MarketFilter[][]
export type MarketSorts = MarketSort[][]
export type MarketViews = MarketView[][]

export const MARKET_FILTERS: MarketFilters = [
  [
    MarketFilter.Hours,
    MarketFilter.Week,
    MarketFilter.Month,
    MarketFilter.ThreeMonths,
    MarketFilter.Year
  ]
]
export const MARKET_SORTS: MarketSorts = [
  [
    MarketSort.Price,
    MarketSort.MarketCap,
    MarketSort.Volume,
    MarketSort.TopGainers,
    MarketSort.TopLosers
  ]
]

export const MARKET_VIEWS: MarketViews = [[MarketView.Grid, MarketView.List]]
