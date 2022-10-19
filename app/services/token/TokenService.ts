import {
  CoinMarket,
  coinsContractInfo,
  CoinsContractInfoResponse,
  coinsContractMarketChart,
  coinsInfo,
  CoinsInfoResponse,
  coinsMarket,
  coinsMarketChart,
  coinsSearch,
  getBasicCoingeckoHttp,
  simplePrice,
  SimplePriceResponse,
  simpleTokenPrice,
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import { ethers } from 'ethers'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { getCache, setCache } from 'utils/InMemoryCache'
import { arrayHash } from 'utils/Utils'
import {
  Network,
  NetworkContractToken,
  NetworkVMType
} from '@avalabs/chains-sdk'
import NetworkService from 'services/network/NetworkService'
import { MarketToken } from 'store/watchlist'
import xss from 'xss'
import { ChartData, PriceWithMarketData } from './types'
import { transformContractMarketChartResponse } from './utils'

const coingeckoBasicClient = getBasicCoingeckoHttp()

export class TokenService {
  /**
   * Get token data for a contract address
   * @param address the contract address
   * @param network the network the contract address is on
   * @returns token data
   */
  async getTokenData(
    address: string,
    network: Network
  ): Promise<NetworkContractToken | undefined> {
    if (!network || network.vmName !== NetworkVMType.EVM) {
      throw new Error('No network')
    }

    const provider = NetworkService.getProviderForNetwork(network)

    if (!provider || !(provider instanceof JsonRpcBatchInternal)) {
      throw new Error('No provider')
    }

    const contract = new ethers.Contract(address, ERC20.abi, provider)

    const contractCalls = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals()
    ])
    // Purify the values for XSS protection
    const name = xss(contractCalls[0])
    const symbol = xss(contractCalls[1])
    const decimals = parseInt(contractCalls[2])

    return {
      name,
      symbol,
      decimals,
      address,
      contractType: 'ERC-20',
      description: ''
    }
  }

  // if coinIds are undefined, the top 100 tokens will be returned
  async getMarkets(
    currency: VsCurrencyType = VsCurrencyType.USD,
    sparkline: boolean,
    coinIds?: string[]
  ): Promise<CoinMarket[]> {
    let data: CoinMarket[] | undefined

    const key = coinIds
      ? `${arrayHash(coinIds)}-${currency}-${sparkline}`
      : `${currency}-${sparkline}`

    const cacheId = `getMarkets-${key}`

    data = getCache(cacheId)

    if (data === undefined) {
      data = await coinsMarket(coingeckoBasicClient, {
        currency,
        sparkline,
        coinIds
      })
      setCache(cacheId, data)
    }

    return data
  }

  async getTokenSearch(query: string): Promise<MarketToken[] | undefined> {
    const data = await coinsSearch(coingeckoBasicClient, {
      query
    })
    return data?.coins?.map(coin => {
      return {
        id: coin?.id,
        name: coin?.name,
        symbol: coin?.symbol,
        logoUri: coin?.thumb
      } as MarketToken
    })
  }

  /**
   * Get token price with market data for a coin
   * @param coinId the coin id ie avalanche-2 for avax
   * @param currency the currency to be used
   * @returns the token price with market data
   */
  async getPriceWithMarketDataByCoinId(
    coinId: string,
    currency: VsCurrencyType = VsCurrencyType.USD
  ): Promise<PriceWithMarketData> {
    let data: SimplePriceResponse | undefined

    const key = `${coinId}-${currency}`
    const cacheId = `getPriceWithMarketDataByCoinId-${key}`

    data = getCache(cacheId)

    if (
      data?.[coinId]?.[currency] === undefined ||
      data?.[coinId]?.[currency]?.price === undefined
    ) {
      data = await this.fetchPriceWithMarketData([coinId], currency)

      setCache(cacheId, data)
    }

    return {
      price: data?.[coinId]?.[currency]?.price ?? 0,
      change24: data?.[coinId]?.[currency]?.change24 ?? 0,
      marketCap: data?.[coinId]?.[currency]?.marketCap ?? 0,
      vol24: data?.[coinId]?.[currency]?.vol24 ?? 0
    }
  }

  /**
   * Get token price with market data for a list of coins
   * @param coinIds the coin ids
   * @param currency the currency to be used
   * @returns a list of token price with market data
   */
  async getPriceWithMarketDataByCoinIds(
    coinIds: string[],
    currency: VsCurrencyType = VsCurrencyType.USD
  ): Promise<SimplePriceResponse | undefined> {
    let data: SimplePriceResponse | undefined

    const key = `${arrayHash(coinIds)}-${currency}`

    const cacheId = `getPriceWithMarketDataByCoinIds-${key}`

    data = getCache(cacheId)

    if (data === undefined) {
      data = await this.fetchPriceWithMarketData(coinIds, currency)
      setCache(cacheId, data)
    }

    return data
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
    currency: VsCurrencyType = VsCurrencyType.USD
  ) {
    let data: SimpleTokenPriceResponse | undefined

    const key = `${arrayHash(tokenAddresses)}-${assetPlatformId}-${currency}`

    const cacheId = `getPricesWithMarketDataByAddresses-${key}`
    data = getCache(cacheId)

    if (data === undefined) {
      data = await this.fetchPricesWithMarketDataByAddresses(
        assetPlatformId,
        tokenAddresses,
        currency
      )

      setCache(cacheId, data)
    }

    return data
  }

  /**
   * Get chart data for a coin
   * @param coingeckoId the coin id
   * @param days data up to number of days ago
   * @param currency the currency to be used
   * @param fresh whether to ignore cache
   * @returns chart data
   */
  async getChartDataForCoinId({
    coingeckoId,
    days = 1,
    currency = VsCurrencyType.USD,
    fresh = false
  }: {
    coingeckoId: string
    days?: number
    currency?: VsCurrencyType
    fresh?: boolean
  }) {
    let data: ChartData | undefined

    const key = `${coingeckoId}-${days.toString()}-${currency}`
    const cacheId = `getChartDataForCoinId-${key}`

    data = fresh ? undefined : getCache(cacheId)

    if (data === undefined) {
      if (coingeckoId) {
        data = await this.fetchChartDataForCoin(coingeckoId, days, currency)
      }

      setCache(cacheId, data)
    }

    return data
  }

  /**
   * Get chart data for a contract address
   * @param assetPlatformId the asset platform where the provided address lives
   * @param address the contract address
   * @param days data up to number of days ago
   * @param currency the currency to be used
   * @param fresh whether to ignore cache
   * @returns chart data
   */
  async getChartDataForAddress({
    assetPlatformId,
    address,
    days = 1,
    currency = VsCurrencyType.USD,
    fresh = false
  }: {
    assetPlatformId: string
    address: string
    days?: number
    currency?: VsCurrencyType
    fresh?: boolean
  }) {
    let data: ChartData | undefined

    const key = `${address}-${days.toString()}-${currency}`
    const cacheId = `getChartDataForAddress-${key}`

    data = fresh ? undefined : getCache(cacheId)

    if (data === undefined) {
      if (address) {
        data = await this.fetchChartDataForAddress(
          assetPlatformId,
          address,
          days,
          currency
        )
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
   * @param assetPlatformId the asset platform where the provided address lives
   * @param address the contract addresses
   * @param fresh whether to ignore cache
   * @returns token info
   */
  async getContractInfo({
    assetPlatformId,
    address,
    fresh = false
  }: {
    assetPlatformId: string
    address: string
    fresh?: boolean
  }): Promise<CoinsContractInfoResponse | undefined> {
    let data: CoinsContractInfoResponse | undefined

    const key = address
    const cacheId = `getContractInfo-${key}`

    data = fresh ? undefined : getCache(cacheId)

    if (data === undefined) {
      if (address) {
        data = await this.fetchContractInfo(assetPlatformId, address)
      }
      setCache(cacheId, data)
    }

    return data
  }

  private async fetchChartDataForAddress(
    assetPlatformId: string,
    address: string,
    days: number,
    currency: VsCurrencyType = VsCurrencyType.USD
  ) {
    try {
      const rawData = await coinsContractMarketChart(coingeckoBasicClient, {
        assetPlatformId,
        address: address,
        currency,
        days
      })

      return transformContractMarketChartResponse(rawData)
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchChartDataForCoin(
    coingeckoId: string,
    days: number,
    currency: VsCurrencyType = VsCurrencyType.USD
  ) {
    try {
      const rawData = await coinsMarketChart(coingeckoBasicClient, {
        assetPlatformId: coingeckoId,
        currency,
        days
      })

      return transformContractMarketChartResponse(rawData)
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchContractInfo(assetPlatformId: string, address: string) {
    try {
      return coinsContractInfo(coingeckoBasicClient, {
        address: address,
        assetPlatformId
      })
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchCoinInfo(coingeckoId: string) {
    try {
      return coinsInfo(coingeckoBasicClient, {
        assetPlatformId: coingeckoId
      })
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchPriceWithMarketData(
    coingeckoId: string[],
    currencyCode: VsCurrencyType = VsCurrencyType.USD
  ) {
    try {
      return simplePrice(coingeckoBasicClient, {
        coinIds: coingeckoId,
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
    currencyCode: VsCurrencyType = VsCurrencyType.USD
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
