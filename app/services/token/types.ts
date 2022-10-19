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
  dataPoints: { x: number; y: number }[]
}

export type PriceWithMarketData = {
  price: number
  change24: number
  marketCap: number
  vol24: number
}
