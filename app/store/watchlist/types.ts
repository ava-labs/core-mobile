import { ChartData } from 'services/token/types'

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
  logoUri: string
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
