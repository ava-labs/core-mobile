export type TokenListDict = {
  [contract: string]: TokenListERC20
}

export type TokenListERC20 = {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

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

export type TokenAddress = string
export type ChartDays = number

export type CharDataParams = {
  coingeckoId?: string
  address?: string
  days?: number
  fresh?: boolean
}

export type ContractInfoParams = {
  coingeckoId?: string
  address?: string
  fresh?: boolean
}

export type PriceWithMarketData = {
  price: number
  change24: number
  marketCap: number
  vol24: number
}
