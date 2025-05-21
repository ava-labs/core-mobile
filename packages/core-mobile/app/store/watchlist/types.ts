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
  SEARCH = 'SEARCH' // these are the tokens that match the search query (fetched via Coingecko directly)
}

type InternalId = string
type CoingeckoId = string

export type MarketToken =
  | {
      id: InternalId
      coingeckoId: string | null | undefined
      platforms: Record<string, string> | Record<string, never>
      marketType: MarketType.TOP | MarketType.TRENDING
      symbol: string
      name: string
      logoUri?: string
      testID?: string
      currentPrice?: number
      priceChange24h?: number
      priceChangePercentage24h?: number
    }
  | {
      id: CoingeckoId
      coingeckoId: string
      marketType: MarketType.SEARCH
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
