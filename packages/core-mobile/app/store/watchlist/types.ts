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
  TOP = 'TOP', // these are the top tokens in the market + additional tokens in our database
  TRENDING = 'TRENDING', // these are the trending avalanche tokens in the market
  SEARCH = 'SEARCH' // these are the tokens that match the search query (now also using internalId)
}

export type InternalId = string

export type MarketToken = {
  id: InternalId
  coingeckoId: string | null | undefined
  platforms: Record<string, string> | Record<string, never>
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

export type Charts = { [tokenId: string]: ChartData }

export type Prices = { [tokenId: string]: PriceData }

export type TokensAndCharts = {
  tokens: Record<string, MarketToken>
  charts: Charts
}

export type WatchListFavoriteState = {
  favorites: InternalId[]
}
