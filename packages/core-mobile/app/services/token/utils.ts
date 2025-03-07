import { defaultChartData } from 'store/watchlist'
import { RetryBackoffPolicy, retry } from 'utils/js/retry'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import Logger from 'utils/Logger'
import {
  ChartData,
  Error,
  SimplePriceResponse,
  RawSimplePriceResponse,
  SparklineData,
  TrendingToken
} from './types'

// data is of 7 days
// we only need the last 24 hours
export const transformSparklineData = (data: SparklineData | []): ChartData => {
  if (data.length === 0) return defaultChartData

  const oneDayDataPoints = Math.ceil(data.length / 7)
  const oneDayData = data.slice(-oneDayDataPoints)
  const minDate = 0
  const maxDate = oneDayDataPoints - 1
  const minPrice = Math.min(...oneDayData)
  const maxPrice = Math.max(...oneDayData)
  const lastDataPoint = oneDayData[oneDayData.length - 1]
  const firstDataPoint = oneDayData[0]
  if (lastDataPoint === undefined || firstDataPoint === undefined) {
    return defaultChartData
  }
  const diffValue = lastDataPoint - firstDataPoint
  const percentChange = (Math.abs(diffValue) / firstDataPoint) * 100

  return {
    ranges: {
      minDate,
      maxDate,
      minPrice,
      maxPrice,
      diffValue,
      percentChange
    },
    dataPoints: oneDayData.map((value, index) => {
      return { date: new Date(index), value: value }
    })
  }
}

export const transformMartketChartRawPrices = (
  pricesRaw: [number, number][]
): ChartData => {
  const dates = pricesRaw.map(value => value[0])
  const prices = pricesRaw.map(value => value[1])

  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const latestPricePoint = prices[prices.length - 1] ?? 0
  const oldestPricePoint = prices[0] ?? 0
  const diffValue = latestPricePoint - oldestPricePoint
  const average = (latestPricePoint + oldestPricePoint) / 2
  const percentChange = (diffValue / average) * 100

  return {
    ranges: {
      minDate,
      maxDate,
      minPrice,
      maxPrice,
      diffValue,
      percentChange
    },
    dataPoints: pricesRaw.map(tu => {
      return { date: new Date(tu[0]), value: tu[1] }
    })
  }
}

export const coingeckoRetry = <T>(
  operation: (useCoingeckoProxy: boolean) => Promise<T | Error>
): Promise<T | undefined> => {
  return retry({
    operation: (retryIndex: number) => operation(retryIndex > 0),
    maxRetries: 2,
    backoffPolicy: RetryBackoffPolicy.constant(1),
    isSuccess: (response: T | Error) => {
      const errorStatus = (response as Error)?.status
      if (errorStatus?.error_code === 429) {
        Logger.error(errorStatus?.error_message, errorStatus)
        return false
      }
      return true
    }
  }) as Promise<T | undefined>
}

export const transformSimplePriceResponse = (
  data: RawSimplePriceResponse,
  currencies = [VsCurrencyType.USD]
): SimplePriceResponse => {
  const formattedData: SimplePriceResponse = {}
  Object.keys(data).forEach(id => {
    const tokenData = data[id]
    formattedData[id] = {}
    currencies.forEach((currency: VsCurrencyType) => {
      // @ts-ignore
      formattedData[id][currency] = {
        price: tokenData?.[currency],
        change24: tokenData?.[`${currency}_24h_change`],
        vol24: tokenData?.[`${currency}_24h_vol`],
        marketCap: tokenData?.[`${currency}_market_cap`]
      }
    })
  })
  return formattedData
}

export const applyExchangeRateToTrendingTokens = (
  trendingTokens: TrendingToken[],
  exchangeRate: number
): TrendingToken[] => {
  return trendingTokens.map(item => ({
    ...item,
    price: item.price * exchangeRate,
    marketcap:
      typeof item.marketcap === 'number'
        ? item.marketcap * exchangeRate
        : item.marketcap,
    fdv: typeof item.fdv === 'number' ? item.fdv * exchangeRate : item.fdv,
    volume24hUSD:
      typeof item.volume24hUSD === 'number'
        ? item.volume24hUSD * exchangeRate
        : item.volume24hUSD,
    liquidity:
      typeof item.liquidity === 'number'
        ? item.liquidity * exchangeRate
        : item.liquidity,
    sparkline: item.sparkline
      ? item.sparkline.map(point => ({
          ...point,
          value: point.value * exchangeRate
        }))
      : item.sparkline
  }))
}
