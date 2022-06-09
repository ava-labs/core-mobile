import {
  simplePrice,
  simpleTokenPrice,
  getBasicCoingeckoHttp,
  getProCoingeckoHttp,
  VsCurrencyType,
  coinsContractInfo,
  CoinsContractInfoResponse,
  CoinsInfoResponse,
  coinsContractMarketChart,
  coinsMarketChart,
  ContractMarketChartResponse,
  coinsInfo,
  SimplePriceResponse,
  SimpleTokenPriceResponse
} from '@avalabs/coingecko-sdk'
import Config from 'react-native-config'
import { getCache, setCache } from 'utils/InMemoryCache'
import { arrayHash } from 'utils/Utils'
import { ChartData, PriceWithMarketData } from './types'

const coingeckoBasicClient = getBasicCoingeckoHttp()
const coingeckoProClient = getProCoingeckoHttp()

export class TokenService {
  /**
   * Get the native token price with market data for a coin
   * @param coinId the coin id ie avalanche-2 for avax
   * @param currency the currency to be used
   * @returns the native token price with market data
   */
  async getPriceWithMarketDataByCoinId(
    coinId: string,
    currency: string
  ): Promise<PriceWithMarketData> {
    let data: SimplePriceResponse | undefined

    const currencyCode = currency.toLowerCase() as VsCurrencyType

    const key = `${coinId}-${currency}`
    const cacheId = `getPriceWithMarketDataByCoinId-${key}`

    data = getCache(cacheId)

    if (data === undefined) {
      data = await this.fetchPriceWithMarketData(coinId, currencyCode)

      setCache(cacheId, data)
    }

    const coin = data?.[coinId]?.[currencyCode]

    return {
      price: coin?.price ?? 0,
      change24: coin?.change24 ?? 0,
      marketCap: coin?.marketCap ?? 0,
      vol24: coin?.vol24 ?? 0
    }
  }

  /**
   * Get token price with market data for a list of addresses
   * @param tokenAddresses the token addresses
   * @param assetPlatformId The platform id for all the tokens in the list
   * @param currency the currency to be used
   * @returns a list of token price with market data
   */
  async getPricesWithMarketDataByAddresses(
    tokenAddresses: string[],
    assetPlatformId: string,
    currency: string
  ) {
    let data: SimpleTokenPriceResponse | undefined

    const currencyCode = currency.toLowerCase() as VsCurrencyType

    const key = `${arrayHash(tokenAddresses)}-${assetPlatformId}-${currency}`

    const cacheId = `getPricesWithMarketDataByAddresses-${key}`
    data = getCache(cacheId)

    if (data === undefined) {
      data = await this.fetchPricesWithMarketDataByAddresses(
        assetPlatformId,
        tokenAddresses,
        currencyCode
      )

      setCache(cacheId, data)
    }

    return data
  }

  /**
   * Get chart data for a coin
   * @param coingeckoId the coin id
   * @param days data up to number of days ago
   * @param fresh whether to ignore cache
   * @returns chart data
   */
  async getChartDataForCoinId({
    coingeckoId,
    days = 1,
    fresh = false
  }: {
    coingeckoId: string
    days?: number
    fresh?: boolean
  }) {
    let data: ChartData | undefined

    const key = `${coingeckoId}-${days.toString()}`
    const cacheId = `getChartDataForCoinId-${key}`

    data = fresh ? undefined : getCache(cacheId)

    if (data === undefined) {
      if (coingeckoId) {
        data = await this.fetchChartDataForCoin(coingeckoId, days)
      }

      setCache(cacheId, data)
    }

    return data
  }

  /**
   * Get chart data for a contract address
   * @param address the contract addresses
   * @param days data up to number of days ago
   * @param fresh whether to ignore cache
   * @returns chart data
   */
  async getChartDataForAddress({
    address,
    days = 1,
    fresh = false
  }: {
    address: string
    days?: number
    fresh?: boolean
  }) {
    let data: ChartData | undefined

    const key = `${address}-${days.toString()}`
    const cacheId = `getChartDataForAddress-${key}`

    data = fresh ? undefined : getCache(cacheId)

    if (data === undefined) {
      if (address) {
        data = await this.fetchChartDataForAddress(address, days)
      }

      setCache(cacheId, data)
    }

    return data
  }

  /**
   * Get info for a coin
   * @param coingeckoId the coin id
   * @param fresh whether to ignore cache
   * @returns coin info
   */
  async getCoinInfo({
    coingeckoId,
    fresh = false
  }: {
    coingeckoId: string
    fresh?: boolean
  }): Promise<CoinsInfoResponse | undefined> {
    let data: CoinsInfoResponse | undefined

    const key = coingeckoId
    const cacheId = `getCoinInfo-${key}`

    data = fresh ? undefined : getCache(cacheId)

    if (data === undefined) {
      if (coingeckoId) {
        data = await this.fetchCoinInfo(coingeckoId)
      }
      setCache(cacheId, data)
    }

    return data
  }

  /**
   * Get info for a contract address
   * @param address the contract addresses
   * @param fresh whether to ignore cache
   * @returns token info
   */
  async getContractInfo({
    address,
    fresh = false
  }: {
    address: string
    fresh?: boolean
  }): Promise<CoinsContractInfoResponse | undefined> {
    let data: CoinsContractInfoResponse | undefined

    const key = address
    const cacheId = `getContractInfo-${key}`

    data = fresh ? undefined : getCache(cacheId)

    if (data === undefined) {
      if (address) {
        data = await this.fetchContractInfo(address)
      }
      setCache(cacheId, data)
    }

    return data
  }

  private transformMarketChartResponse(rawData: ContractMarketChartResponse) {
    const dates = rawData.prices.map(value => value[0])
    const prices = rawData.prices.map(value => value[1])

    const minDate = Math.min(...dates)
    const maxDate = Math.max(...dates)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const diffValue = prices[prices.length - 1] - prices[0]
    const average = (prices[prices.length - 1] + prices[0]) / 2
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
        return { x: tu[0], y: tu[1] }
      })
    } as ChartData
  }

  private async fetchChartDataForAddress(address: string, days: number) {
    try {
      const rawData = await coinsContractMarketChart(coingeckoProClient, {
        assetPlatformId: 'avalanche',
        address: address,
        currency: 'usd' as VsCurrencyType,
        days,
        coinGeckoProApiKey: Config.COINGECKO_API_KEY
      })

      return this.transformMarketChartResponse(rawData)
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchChartDataForCoin(coingeckoId: string, days: number) {
    try {
      const rawData = await coinsMarketChart(coingeckoProClient, {
        assetPlatformId: coingeckoId,
        currency: 'usd' as VsCurrencyType,
        days,
        coinGeckoProApiKey: Config.COINGECKO_API_KEY
      })

      return this.transformMarketChartResponse(rawData)
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchContractInfo(address: string) {
    try {
      return coinsContractInfo(coingeckoProClient, {
        address: address,
        assetPlatformId: 'avalanche',
        coinGeckoProApiKey: Config.COINGECKO_API_KEY
      })
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchCoinInfo(coingeckoId: string) {
    try {
      return coinsInfo(coingeckoProClient, {
        assetPlatformId: coingeckoId,
        coinGeckoProApiKey: Config.COINGECKO_API_KEY
      })
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchPriceWithMarketData(
    coingeckoId: string,
    currencyCode: VsCurrencyType
  ) {
    try {
      return simplePrice(coingeckoBasicClient, {
        coinIds: [coingeckoId],
        currencies: [currencyCode],
        marketCap: true,
        vol24: true,
        change24: true
      })
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchPricesWithMarketDataByAddresses(
    assetPlatformId: string,
    tokenAddresses: string[],
    currencyCode: VsCurrencyType
  ) {
    try {
      return simpleTokenPrice(coingeckoBasicClient, {
        assetPlatformId,
        tokenAddresses,
        currencies: [currencyCode],
        marketCap: true,
        vol24: true,
        change24: true
      })
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }
}

export default new TokenService()
