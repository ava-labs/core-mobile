import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { array, number, object, record, string } from 'zod'

export type SparklineData = number[]

export interface ChartData {
  ranges: {
    minDate: number
    maxDate: number
    minPrice: number
    maxPrice: number
    diffValue: number
    percentChange: number
  }
  dataPoints: { date: Date; value: number }[]
}

export type PriceWithMarketData = {
  price: number
  change24: number
  marketCap: number
  vol24: number
}

export type GetMarketsParams = {
  currency?: VsCurrencyType
  sparkline?: boolean
  coinIds?: string[]
  page?: number
  perPage?: number
}

export const SimplePriceResponseSchema = z.record(
  string(),
  record(string(), string())
)

export const CoinMarketSchema = object({
  id: string(),
  symbol: string(),
  name: string(),
  price: number(),
  image: string(),
  sparkline_in_7d: object({
    price: array(number())
  }),
  price_change_percentage_24h: number(),
  price_change_percentage_1h_in_currency: number(),
  price_change_percentage_24h_in_currency: number(),
  price_change_percentage_7d_in_currency: number(),
  market_cap: number(),
  total_volume: number(),
  circulating_supply: number(),
  current_price: number()
})
