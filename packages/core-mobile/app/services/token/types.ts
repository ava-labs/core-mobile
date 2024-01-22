import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { array, number, object, record, string, z } from 'zod'

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

const SimplePriceInCurrency = object({
  price: number().optional().nullable(),
  change24: number().optional().nullable(),
  marketCap: number().optional().nullable(),
  vol24: number().optional().nullable()
})

const SimplePriceInCurrencyResponseSchema = record(
  string(),
  SimplePriceInCurrency
)

export const SimplePriceResponseSchema = record(
  string(),
  SimplePriceInCurrencyResponseSchema
)

export type SimplePriceInCurrencyResponse = z.infer<
  typeof SimplePriceInCurrencyResponseSchema
>
export type SimplePriceResponse = z.infer<typeof SimplePriceResponseSchema>

export const CoinMarketSchema = object({
  id: string(),
  symbol: string(),
  name: string(),
  price: number().optional().nullable(),
  image: string(),
  sparkline_in_7d: object({
    price: array(number())
  })
    .nullable()
    .optional(),
  price_change_percentage_24h: number().optional().nullable(),
  price_change_percentage_1h_in_currency: number().optional().nullable(),
  price_change_percentage_24h_in_currency: number().optional().nullable(),
  price_change_percentage_7d_in_currency: number().optional().nullable(),
  market_cap: number(),
  total_volume: number(),
  circulating_supply: number(),
  current_price: number().optional().nullable()
})

export type CoinMarket = z.infer<typeof CoinMarketSchema>

export type Error = {
  status: {
    error_code: number
    error_message: string
  }
}
