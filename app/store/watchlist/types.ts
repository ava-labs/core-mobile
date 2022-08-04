import { TokenType } from 'store/balance'
import { PriceWithMarketData } from 'services/token/types'

export type WatchListState = {
  tokens: MarketToken[]
  favorites: MarketToken[]
}
export const initialState: WatchListState = {
  tokens: [],
  favorites: []
}

export type MarketToken = Omit<PriceWithMarketData, 'price'> & {
  id: string
  symbol: string
  name: string
  priceInCurrency: number
  type: TokenType
  logoUri: string
  assetPlatformId: string
}
