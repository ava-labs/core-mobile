import { VsCurrencyType } from '@avalabs/coingecko-sdk'

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
