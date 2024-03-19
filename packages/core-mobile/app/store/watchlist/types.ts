import { ChartData } from 'services/token/types'

export const defaultChartData = {
  ranges: {
    minDate: 0,
    maxDate: 0,
    minPrice: 0,
    maxPrice: 0,
    diffValue: 0,
    percentChange: 0
  },
  dataPoints: []
}

export const defaultPrice = {
  priceInCurrency: 0,
  marketCap: 0,
  vol24: 0,
  change24: 0
}

export const initialState: WatchListState = {
  tokens: {},
  favorites: [],
  prices: {},
  charts: {}
}

export type MarketToken = {
  id: string // coingeckoId
  symbol: string
  name: string
  logoUri?: string
  testID?: string
  priceChange24h?: number
  priceChangePercentage24h?: number
}

export type PriceData = {
  priceInCurrency: number
  change24: number
  marketCap: number
  vol24: number
}

export type Charts = { [coingeckoID: string]: ChartData }

export type Prices = { [coingeckoID: string]: PriceData }

export type WatchListState = {
  tokens: { [coingeckoID: string]: MarketToken }
  favorites: string[]
  prices: Prices
  charts: Charts
}
