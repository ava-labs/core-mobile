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

export const initialState: WatchListFavoriteState = {
  favorites: []
}

export enum MarketType {
  TOP = 'TOP', // these are the top tokens in the market (our backend fetches them from Coingecko)
  TRENDING = 'TRENDING' // these are the trending avalanche tokens in the market (our backend fetches them from birdeye)
}

export type MarketToken = {
  id: string // coingeckoId or address when coingeckoId is not available
  marketType: MarketType
  symbol: string
  name: string
  logoUri?: string
  testID?: string
  currentPrice?: number
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

export type TokensAndCharts = {
  tokens: Record<string, MarketToken>
  charts: Charts
}

export type WatchListFavoriteState = {
  favorites: string[]
}
