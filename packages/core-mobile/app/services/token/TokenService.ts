import {
  coinsInfo,
  coinsMarket,
  coinsMarketChart,
  coinsSearch,
  getBasicCoingeckoHttp,
  simplePrice,
  SimplePriceParams,
  simpleTokenPrice,
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
import { coingeckoProxyClient } from 'services/token/coingeckoProxyClient'
import { watchListCacheClient } from 'services/watchlist/watchListCacheClient'
import Logger from 'utils/Logger'
import {
  ChartData,
  CoinMarket,
  Error,
  GetMarketsParams,
  PriceWithMarketData,
  SimplePriceResponse,
  CoinsSearchResponse,
  ContractMarketChartResponse,
  CoinsInfoResponse
} from './types'
import {
  coingeckoRetry,
  transformContractMarketChartResponse,
  transformSimplePriceResponse
} from './utils'

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

  /**
   * Get market data from cached watchlist
   * @param currency the currency to be used
   * @returns the cached markets
   */
  async getMarketsFromWatchlistCache({
    currency = VsCurrencyType.USD
  }: GetMarketsParams): Promise<CoinMarket[]> {
    let data: CoinMarket[] | undefined

    const cacheId = `getMarkets-${currency}`

    data = getCache(cacheId)

    if (data === undefined) {
      const topMarketsPromise = watchListCacheClient.markets({
        queries: { currency, topMarkets: true }
      })
      const additionalMarketsPromise = watchListCacheClient.markets({
        queries: { currency, topMarkets: false }
      })

      const [topMarkets, additionalMarkets] = await Promise.all([
        topMarketsPromise,
        additionalMarketsPromise
      ])
      data = topMarkets.concat(additionalMarkets)
      setCache(cacheId, data)
    }

    return data ?? []
  }

  /**
   * Get token search results
   * @param query the search query
   * @returns token search results
   */
  async getTokenSearch(query: string): Promise<MarketToken[] | undefined> {
    try {
      const data = await coingeckoRetry<CoinsSearchResponse>(
        useCoingeckoProxy => this.searchCoins(query, useCoingeckoProxy)
      )

      return data?.coins?.map(coin => {
        return {
          id: coin?.id,
          name: coin?.name,
          symbol: coin?.symbol,
          logoUri: coin?.thumb
        } as MarketToken
      })
    } catch {
      Logger.error('Failed to fetch token search data', { query })
    }
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
      if (priceData) {
        acc[coinId] = {
          [currency]: {
            price: priceData?.price,
            change24: priceData?.change24,
            marketCap: priceData?.marketCap,
            vol24: priceData?.vol24
          }
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
  ): Promise<SimplePriceResponse | undefined> {
    let data: SimplePriceResponse | undefined

    const key = `${arrayHash(tokenAddresses)}-${assetPlatformId}-${currency}`

    const cacheId = `getPricesWithMarketDataByAddresses-${key}`
    data = getCache(cacheId)

    if (data === undefined) {
      try {
        data = await coingeckoRetry<SimplePriceResponse>(useCoingeckoProxy =>
          this.fetchPricesWithMarketDataByAddresses({
            assetPlatformId,
            tokenAddresses,
            currency,
            useCoingeckoProxy
          })
        )
      } catch {
        data = undefined
      }

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
        try {
          data = await coingeckoRetry<ChartData | undefined>(
            useCoingeckoProxy =>
              this.fetchChartDataForCoin({
                coingeckoId,
                days,
                currency,
                useCoingeckoProxy
              })
          )
        } catch {
          data = undefined
        }
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
        try {
          data = await coingeckoRetry<CoinsInfoResponse>(useCoingeckoProxy =>
            this.fetchCoinInfo(coingeckoId, useCoingeckoProxy)
          )
        } catch {
          data = undefined
        }
      }
      setCache(cacheId, data)
    }

    return data
  }

  /**
   * Get token price with market data from cached watchlist
   * @returns token price with market data
   */
  async fetchPriceWithMarketData(): Promise<SimplePriceResponse | undefined> {
    try {
      let data: SimplePriceResponse | undefined
      const cacheId = `fetchPriceWithMarketData`

      data = getCache(cacheId)

      if (data === undefined) {
        data = await watchListCacheClient.simplePrice()
        setCache(cacheId, data)
      }
      return data
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  /**
   * Get markets first on coingecko (free tier) directly,
   * if we get 429 error, retry it on coingecko proxy (paid service)
   * @returns markets data
   */
  async getMarkets({
    currency = VsCurrencyType.USD,
    sparkline = false,
    coinIds,
    perPage,
    page
  }: GetMarketsParams): Promise<CoinMarket[]> {
    let data: CoinMarket[] | undefined

    const key = coinIds
      ? `${arrayHash(coinIds)}-${currency}-${sparkline}`
      : `${currency}-${sparkline}`

    const cacheId = `getMarkets-${key}`

    data = getCache(cacheId)

    if (data === undefined) {
      try {
        data = await coingeckoRetry<CoinMarket[]>(useCoingeckoProxy =>
          this.coinsMarket({
            coinIds,
            currency,
            sparkline,
            perPage,
            page,
            useCoingeckoProxy
          })
        )
      } catch {
        data = undefined
      }
      setCache(cacheId, data)
    }

    return data ?? []
  }

  /**
   * Get token price with market data first on coingecko (free tier) directly,
   * if we get 429 error, retry it on coingecko proxy (paid service)
   * @returns token price with market data
   */
  async getSimplePrice({
    coinIds = [],
    currency = VsCurrencyType.USD
  }: {
    coinIds: string[]
    currency: VsCurrencyType
  }): Promise<SimplePriceResponse | undefined> {
    let data: SimplePriceResponse | undefined

    const key = coinIds ? `${arrayHash(coinIds)}-${currency}` : `${currency}`

    const cacheId = `getSimplePrice-${key}`

    data = getCache(cacheId)

    if (data === undefined) {
      try {
        data = await coingeckoRetry<SimplePriceResponse>(useCoingeckoProxy =>
          this.simplePrice({
            coinIds,
            currencies: [currency],
            marketCap: true,
            vol24: true,
            change24: true,
            useCoingeckoProxy
          })
        )
      } catch {
        data = undefined
      }
      setCache(cacheId, data)
    }

    return data
  }

  private async fetchCoinInfo(
    coingeckoId: string,
    useCoingeckoProxy = false
  ): Promise<CoinsInfoResponse | Error> {
    if (useCoingeckoProxy) {
      return coingeckoProxyClient.marketDataByCoinId(undefined, {
        params: {
          id: coingeckoId
        }
      })
    }
    return coinsInfo(coingeckoBasicClient, {
      assetPlatformId: coingeckoId
    })
  }

  private async fetchChartDataForCoin({
    coingeckoId,
    days = 7,
    currency = VsCurrencyType.USD,
    useCoingeckoProxy = false
  }: {
    coingeckoId: string
    currency: VsCurrencyType
    days?: number
    useCoingeckoProxy?: boolean
  }): Promise<ChartData | Error | undefined> {
    let rawData: ContractMarketChartResponse | undefined
    if (useCoingeckoProxy) {
      rawData = await coingeckoProxyClient.marketChartByCoinId(undefined, {
        params: {
          id: coingeckoId
        },
        queries: {
          vs_currency: currency,
          days: days?.toString()
        }
      })
    } else {
      rawData = await coinsMarketChart(coingeckoBasicClient, {
        assetPlatformId: coingeckoId,
        currency,
        days
      })
    }
    return rawData ? transformContractMarketChartResponse(rawData) : undefined
  }

  private async coinsMarket({
    currency = VsCurrencyType.USD,
    sparkline = false,
    coinIds,
    perPage,
    page,
    useCoingeckoProxy = false
  }: GetMarketsParams & { useCoingeckoProxy?: boolean }): Promise<
    CoinMarket[] | Error
  > {
    if (useCoingeckoProxy) {
      return coingeckoProxyClient.coinsMarket(undefined, {
        queries: {
          ids: coinIds?.join(','),
          vs_currency: currency,
          per_page: perPage,
          page,
          sparkline
        }
      })
    }
    return coinsMarket(coingeckoBasicClient, {
      currency,
      sparkline,
      coinIds,
      perPage,
      page
    })
  }

  private async simplePrice({
    coinIds = [],
    currencies = [VsCurrencyType.USD],
    marketCap = false,
    vol24 = false,
    change24 = false,
    lastUpdated = false,
    useCoingeckoProxy = false
  }: SimplePriceParams & { useCoingeckoProxy?: boolean }): Promise<
    SimplePriceResponse | Error
  > {
    if (useCoingeckoProxy) {
      const rawData = await coingeckoProxyClient.simplePrice(undefined, {
        queries: {
          ids: coinIds?.join(','),
          vs_currencies: currencies.join(','),
          include_market_cap: String(marketCap),
          include_24hr_vol: String(vol24),
          include_24hr_change: String(change24),
          include_last_updated_at: String(lastUpdated)
        }
      })
      return transformSimplePriceResponse(rawData)
    }
    return simplePrice(coingeckoBasicClient, {
      coinIds,
      currencies,
      marketCap,
      vol24,
      change24,
      lastUpdated,
      shouldThrow: true
    })
  }

  private async searchCoins(
    query: string,
    useCoingeckoProxy = false
  ): Promise<CoinsSearchResponse | Error> {
    if (useCoingeckoProxy) {
      return coingeckoProxyClient.searchCoins(undefined, {
        queries: {
          query
        }
      })
    }
    return coinsSearch(coingeckoBasicClient, {
      query
    })
  }

  private async fetchPricesWithMarketDataByAddresses({
    assetPlatformId,
    tokenAddresses,
    currency = VsCurrencyType.USD,
    useCoingeckoProxy = false
  }: {
    assetPlatformId: string
    tokenAddresses: string[]
    currency: VsCurrencyType
    useCoingeckoProxy?: boolean
  }): Promise<SimplePriceResponse | Error> {
    if (useCoingeckoProxy) {
      return coingeckoProxyClient.simplePriceByContractAddresses(undefined, {
        params: {
          id: assetPlatformId
        },
        queries: {
          contract_addresses: tokenAddresses,
          vs_currencies: [currency],
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true
        }
      })
    }
    return simpleTokenPrice(coingeckoBasicClient, {
      assetPlatformId,
      tokenAddresses,
      currencies: [currency],
      marketCap: true,
      vol24: true,
      change24: true
    })
  }
}

export default new TokenService()
