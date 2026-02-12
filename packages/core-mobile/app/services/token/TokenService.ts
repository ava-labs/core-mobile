import {
  coinsInfo,
  coinsMarket,
  coinsMarketChart,
  coinsSearch,
  getBasicCoingeckoHttp,
  simplePrice,
  SimplePriceParams,
  VsCurrencyType
} from '@avalabs/core-coingecko-sdk'
import { Contract, ContractRunner } from 'ethers'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { getCache, setCache } from 'utils/InMemoryCache'
import { arrayHash } from 'utils/Utils'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import { MarketToken } from 'store/watchlist/types'
import xss from 'xss'
import promiseWithTimeout, { TimeoutError } from 'utils/js/promiseWithTimeout'
import { coingeckoProxyClient } from 'services/token/coingeckoProxyClient'
import Logger from 'utils/Logger'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { TrendingToken } from 'utils/api/types'
import { watchListClient } from 'utils/api/fetches/nitroWatchlistFetchClient'
import {
  ChartData,
  CoinMarket,
  Error as CoingeckoError,
  GetMarketsParams,
  SimplePriceResponse,
  CoinsSearchResponse,
  ContractMarketChartResponse,
  CoinsInfoResponse
} from './types'
import {
  coingeckoRetry,
  applyExchangeRateToTrendingTokens,
  transformMartketChartRawPrices,
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
      throw new Error('Invalid network')
    }

    const provider = await getEvmProvider(network)

    const contract = new Contract(
      address,
      ERC20.abi,
      provider as ContractRunner
    )

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
      type: TokenType.ERC20,
      chainId: network.chainId
    }
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
    currency = VsCurrencyType.USD,
    includeMarketData = false
  }: {
    coinIds: string[]
    currency: VsCurrencyType
    includeMarketData?: boolean
  }): Promise<SimplePriceResponse | undefined> {
    let data: SimplePriceResponse | undefined

    try {
      data = await coingeckoRetry<SimplePriceResponse>(useCoingeckoProxy =>
        this.simplePrice({
          coinIds,
          currencies: [currency],
          marketCap: includeMarketData,
          vol24: includeMarketData,
          change24: includeMarketData,
          useCoingeckoProxy
        })
      )
    } catch {
      data = undefined
    }

    return data
  }

  async getTrendingTokens(
    exchangeRate: number | undefined
  ): Promise<TrendingToken[]> {
    let data: TrendingToken[] | undefined
    const cacheId = `getTrendingTokens-${exchangeRate}`

    data = getCache(cacheId)

    if (data === undefined) {
      data = await watchListClient.getTrendingTokens()

      if (exchangeRate && exchangeRate !== 1) {
        data = applyExchangeRateToTrendingTokens(data, exchangeRate)
      }

      setCache(cacheId, data)
    }

    return data
  }

  private async fetchCoinInfo(
    coingeckoId: string,
    useCoingeckoProxy = false
  ): Promise<CoinsInfoResponse | CoingeckoError> {
    if (useCoingeckoProxy) {
      return coingeckoProxyClient.marketDataByCoinId(coingeckoId)
    }
    return coinsInfo(coingeckoBasicClient, {
      coinId: coingeckoId
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
  }): Promise<ChartData | CoingeckoError | undefined> {
    let rawData: ContractMarketChartResponse | undefined
    if (useCoingeckoProxy) {
      rawData = await coingeckoProxyClient.marketChartByCoinId({
        id: coingeckoId,
        vs_currency: currency,
        days: days?.toString() ?? '1'
      })
    } else {
      rawData = await coinsMarketChart(coingeckoBasicClient, {
        coinId: coingeckoId,
        currency,
        days
      })
    }
    return rawData ? transformMartketChartRawPrices(rawData.prices) : undefined
  }

  private async coinsMarket({
    currency = VsCurrencyType.USD,
    sparkline = false,
    coinIds,
    perPage,
    page,
    useCoingeckoProxy = false
  }: GetMarketsParams & { useCoingeckoProxy?: boolean }): Promise<
    CoinMarket[] | CoingeckoError
  > {
    if (useCoingeckoProxy) {
      return coingeckoProxyClient.coinsMarket({
        ids: coinIds?.join(','),
        vs_currency: currency,
        per_page: perPage,
        page,
        sparkline
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
    SimplePriceResponse | CoingeckoError
  > {
    if (useCoingeckoProxy) {
      const rawData = await coingeckoProxyClient.simplePrice({
        ids: coinIds?.join(','),
        vs_currencies: currencies.join(','),
        include_market_cap: String(marketCap),
        include_24hr_vol: String(vol24),
        include_24hr_change: String(change24),
        include_last_updated_at: String(lastUpdated)
      })
      return transformSimplePriceResponse(rawData, currencies)
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
  ): Promise<CoinsSearchResponse | CoingeckoError> {
    if (useCoingeckoProxy) {
      return coingeckoProxyClient.searchCoins(query)
    }
    return coinsSearch(coingeckoBasicClient, {
      query
    })
  }
}

export default new TokenService()
