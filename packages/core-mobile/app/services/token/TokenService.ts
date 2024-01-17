import {
  CoinMarket,
  coinsInfo,
  CoinsInfoResponse,
  coinsMarketChart,
  coinsSearch,
  getBasicCoingeckoHttp,
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
import promiseWithTimeout, { TimeoutError } from 'utils/js/promiseWithTimeout'
import { ChartData, GetMarketsParams, PriceWithMarketData } from './types'
import { transformContractMarketChartResponse } from './utils'
import { tokenServiceApiClient } from './apiClient'

const coingeckoBasicClient = getBasicCoingeckoHttp()
const CONTRACT_CALLS_TIMEOUT = 10000

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

    let contractCalls
    try {
      contractCalls = await promiseWithTimeout(
        Promise.all([
          contract.name?.(),
          contract.symbol?.(),
          contract.decimals?.()
        ]),
        CONTRACT_CALLS_TIMEOUT
      )
    } catch (e) {
      if (e instanceof TimeoutError) {
        throw new Error('Invalid token address')
      }
      throw e
    }
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
      chainId: network.chainId
    }
  }

  // if coinIds are undefined, the top 100 tokens will be returned
  async getMarkets({
    currency = VsCurrencyType.USD,
    sparkline = false,
    coinIds
  }: GetMarketsParams): Promise<CoinMarket[]> {
    let data: CoinMarket[] | undefined

    const key = coinIds
      ? `${arrayHash(coinIds)}-${currency}-${sparkline}`
      : `${currency}-${sparkline}`

    const cacheId = `getMarkets-${key}`

    data = getCache(cacheId)

    if (data === undefined) {
      data = await tokenServiceApiClient.markets({
        queries: { currency, topMarkets: true }
      })
      setCache(cacheId, data)
    }
    return data ?? []
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
    const allPriceData = await this.fetchPriceWithMarketData()
    const data = allPriceData?.[coinId]?.[currency]
    return {
      price: data?.price ?? 0,
      change24: data?.change24 ?? 0,
      marketCap: data?.marketCap ?? 0,
      vol24: data?.vol24 ?? 0
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
    const allPriceData = await this.fetchPriceWithMarketData()
    return coinIds.reduce((acc, coinId) => {
      const priceData = allPriceData?.[coinId]?.[currency]
      acc[coinId] = {
        [currency]: {
          price: priceData?.price,
          change24: priceData?.change24,
          marketCap: priceData?.marketCap,
          vol24: priceData?.vol24
        }
      }
      return acc
    }, {} as SimplePriceResponse)
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
  ): Promise<SimpleTokenPriceResponse | undefined> {
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
  }): Promise<ChartData | undefined> {
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

  private async fetchChartDataForCoin(
    coingeckoId: string,
    days: number,
    currency: VsCurrencyType = VsCurrencyType.USD
  ): Promise<ChartData | undefined> {
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

  private async fetchCoinInfo(
    coingeckoId: string
  ): Promise<CoinsInfoResponse | undefined> {
    try {
      return coinsInfo(coingeckoBasicClient, {
        assetPlatformId: coingeckoId
      })
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  async fetchPriceWithMarketData(): Promise<SimplePriceResponse | undefined> {
    try {
      let data: SimplePriceResponse | undefined
      const cacheId = `fetchPriceWithMarketData`

      data = getCache(cacheId)

      if (data === undefined) {
        data = await tokenServiceApiClient.simplePrice()
        setCache(cacheId, data)
      }
      return data
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  private async fetchPricesWithMarketDataByAddresses(
    assetPlatformId: string,
    tokenAddresses: string[],
    currencyCode: VsCurrencyType = VsCurrencyType.USD
  ): Promise<SimpleTokenPriceResponse | undefined> {
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
