import { ContractMarketChartResponse } from '@avalabs/coingecko-sdk'
import { defaultChartData } from 'store/watchlist'
import { ChartData, Error, SparklineData } from './types'
import { RetryBackoffPolicy, retry } from 'utils/js/retry'

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

export const transformContractMarketChartResponse = (
  rawData: ContractMarketChartResponse
): ChartData => {
  const dates = rawData.prices.map(value => value[0])
  const prices = rawData.prices.map(value => value[1])

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
    dataPoints: rawData.prices.map(tu => {
      return { date: new Date(tu[0]), value: tu[1] }
    })
  }
}

export const coingeckoRetry = <T>(
  operation: (retryIndex: number) => Promise<T | Error>
): Promise<T | undefined> => {
  return retry({
    operation,
    maxRetries: 2,
    backoffPolicy: RetryBackoffPolicy.constant(1),
    isSuccess: (response: T | Error) =>
      (response as Error)?.status?.error_code !== 429
  }) as Promise<T | undefined>
}
