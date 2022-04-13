import {
  coinsContractInfo,
  CoinsContractInfoResponse,
  coinsContractMarketChart,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'

type Cache = {
  [address: string]:
    | {
        charts?: { [days: string]: ChartData }
        contract?: CoinsContractInfoResponse
      }
    | undefined
}

const cache: Cache = {}

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

class Coingecko {
  async fetchChartData(address: string, days: number): Promise<ChartData> {
    try {
      const cachedData = cache[address]?.charts?.[days]
      if (cachedData) {
        return cachedData
      }

      const rawData = await coinsContractMarketChart({
        address: address,
        currency: 'usd' as VsCurrencyType,
        days: days,
        id: 'avalanche'
      })

      const dates = rawData.prices.map(value => value[0])
      const prices = rawData.prices.map(value => value[1])

      const minDate = Math.min(...dates)
      const maxDate = Math.max(...dates)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const diffValue = prices[prices.length - 1] - prices[0]
      const average = (prices[prices.length - 1] + prices[0]) / 2
      const percentChange = (diffValue / average) * 100

      const chartData = {
        ranges: {
          minDate,
          maxDate,
          minPrice,
          maxPrice,
          diffValue,
          percentChange
        },
        dataPoints: rawData.prices.map(tu => {
          return { x: tu[0], y: tu[1] }
        })
      } as ChartData

      cache[address] = {
        charts: {
          ...cache[address]?.charts,
          [days]: chartData
        }
      }

      return chartData
    } catch (e) {
      return Promise.reject(e)
    }
  }

  async fetchContractInfo(address: string): Promise<CoinsContractInfoResponse> {
    try {
      const cachedData = cache[address]?.contract
      if (cachedData) {
        return cachedData
      }

      const rawData = await coinsContractInfo({
        address: address,
        id: 'avalanche'
      })

      cache[address] = {
        ...cache[address],
        contract: rawData
      }

      return rawData
    } catch (e) {
      return Promise.reject(e)
    }
  }
}

export default new Coingecko()
