import * as sdk from '@avalabs/core-coingecko-sdk'
import * as inMemoryCache from 'utils/InMemoryCache'
import { getV1WatchlistTrending } from 'utils/api/generated/tokenAggregator/aggregatorApi.client/sdk.gen'
import TokenService from './TokenService'
import { coingeckoProxyClient as proxy } from './coingeckoProxyClient'
import WATCHLIST_PRICE from './__mocks__/watchlistPrice.json'
import MARKET_CHART from './__mocks__/marketChart.json'
import COIN_INFO from './__mocks__/coinInfo.json'
import MARKET_DATA from './__mocks__/marketData.json'
import RAW_WATCHLIST_PRICE from './__mocks__/rawWatchlistPrice.json'

jest.mock(
  'utils/api/generated/tokenAggregator/aggregatorApi.client/sdk.gen',
  () => ({
    getV1WatchlistTrending: jest.fn()
  })
)

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

jest.mock('@avalabs/core-coingecko-sdk', () => ({
  ...jest.requireActual('@avalabs/core-coingecko-sdk'),
  coinsSearch: jest.fn(),
  simplePrice: jest.fn(),
  coinsMarketChart: jest.fn(),
  coinsInfo: jest.fn(),
  coinsMarket: jest.fn()
}))

const MOCK_429 = { status: 429, message: 'Too many requests' }

const inMemoryCacheMock = jest.spyOn(inMemoryCache, 'getCache')

describe('getTokenSearch', () => {
  const proxySearchCoinsMock = jest.spyOn(proxy, 'searchCoins')
  const { coinsSearch } = require('@avalabs/core-coingecko-sdk')

  it('should return data from sdk', async () => {
    coinsSearch.mockImplementationOnce(async () => {
      return {
        coins: [
          {
            id: 'sdk-test',
            symbol: 'test',
            name: 'test',
            thumb: 'test'
          }
        ]
      } as never
    })
    const result = await TokenService.getTokenSearch('test')
    expect(result).not.toBeUndefined()
    expect(coinsSearch).toHaveBeenCalled()
    expect(result?.length).toEqual(1)
  })
  it('should return data from proxy', async () => {
    coinsSearch.mockRejectedValueOnce(async () => MOCK_429)
    proxySearchCoinsMock.mockImplementationOnce(async () => {
      return {
        coins: [
          {
            id: 'proxy-test',
            symbol: 'test',
            name: 'test',
            thumb: 'test'
          }
        ]
      }
    })
    const result = await TokenService.getTokenSearch('test')
    expect(result?.[0]?.id).toEqual('proxy-test')
    expect(proxySearchCoinsMock).toHaveBeenCalled()
  })
})

describe('getSimplePrice', () => {
  const proxyMock = jest.spyOn(proxy, 'simplePrice')
  const { simplePrice } = require('@avalabs/core-coingecko-sdk')

  it('should return simple price data from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    simplePrice.mockImplementationOnce(async () => WATCHLIST_PRICE)
    const result = await TokenService.getSimplePrice({
      coinIds: ['test'],
      currency: sdk.VsCurrencyType.USD
    })
    expect(simplePrice).toHaveBeenCalledTimes(1)
    expect(result?.test?.usd?.price).toEqual(1)
  })
  it('should return simple price data from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    simplePrice.mockRejectedValueOnce(async () => MOCK_429)
    proxyMock.mockImplementationOnce(async () => RAW_WATCHLIST_PRICE)
    const result = await TokenService.getSimplePrice({
      coinIds: ['test'],
      currency: sdk.VsCurrencyType.USD
    })
    expect(proxyMock).toHaveBeenCalledTimes(1)
    expect(result?.test?.usd?.price).toEqual(1)
  })
})

describe('getChartDataForCoinId', () => {
  const proxyMock = jest.spyOn(proxy, 'marketChartByCoinId')
  const { coinsMarketChart } = require('@avalabs/core-coingecko-sdk')

  it('should return data from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    coinsMarketChart.mockImplementationOnce(async () => MARKET_CHART as never)
    const result = await TokenService.getChartDataForCoinId({
      coingeckoId: 'test'
    })
    expect(coinsMarketChart).toHaveBeenCalled()
    expect(result).not.toBeUndefined()
  })
  it('should return data from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    coinsMarketChart.mockRejectedValueOnce(async () => MOCK_429)
    proxyMock.mockImplementationOnce(async () => MARKET_CHART as never)
    const result = await TokenService.getChartDataForCoinId({
      coingeckoId: 'test'
    })
    expect(proxyMock).toHaveBeenCalled()
    expect(result).not.toBeUndefined()
  })
})

describe('getCoinInfo', () => {
  const proxyMock = jest.spyOn(proxy, 'marketDataByCoinId')
  const { coinsInfo } = require('@avalabs/core-coingecko-sdk')

  it('should return coin info from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    coinsInfo.mockImplementationOnce(async () => COIN_INFO as never)
    const result = await TokenService.getCoinInfo({
      coingeckoId: 'test'
    })
    expect(coinsInfo).toHaveBeenCalledTimes(1)
    expect(result?.id).toEqual('test')
  })
  it('should return coin info from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    coinsInfo.mockRejectedValueOnce(async () => MOCK_429)
    proxyMock.mockImplementationOnce(async () => COIN_INFO as never)
    const result = await TokenService.getCoinInfo({
      coingeckoId: 'test'
    })
    expect(proxyMock).toHaveBeenCalledTimes(1)
    expect(result?.id).toEqual('test')
  })
  it('should return coin info from cache', async () => {
    inMemoryCacheMock.mockImplementation(() => COIN_INFO)
    const result = await TokenService.getCoinInfo({
      coingeckoId: 'test'
    })
    expect(coinsInfo).not.toHaveBeenCalled()
    expect(proxyMock).not.toHaveBeenCalled()
    expect(result?.id).toEqual('test')
  })
  it('should return fetched coin info with fresh param', async () => {
    inMemoryCacheMock.mockImplementation(() => COIN_INFO)
    coinsInfo.mockImplementationOnce(async () => COIN_INFO as never)
    const result = await TokenService.getCoinInfo({
      coingeckoId: 'test',
      fresh: true
    })
    expect(coinsInfo).toHaveBeenCalledTimes(1)
    expect(proxyMock).not.toHaveBeenCalled()
    expect(result?.id).toEqual('test')
  })
})

describe('getTrendingTokens', () => {
  const getTrendingMock = getV1WatchlistTrending as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    inMemoryCacheMock.mockImplementation(() => undefined)
  })

  it('should return trending tokens from the aggregator API', async () => {
    const mockToken = {
      internalId: 'avax',
      name: 'Avalanche',
      symbol: 'AVAX',
      price: 30,
      liquidity: 1000000,
      address: '0x123',
      decimals: 18,
      lastUpdated: '2024-01-01',
      sparkline: null,
      platforms: null,
      isNative: true
    }
    getTrendingMock.mockResolvedValue({ data: [mockToken] })

    const result = await TokenService.getTrendingTokens(undefined)

    expect(getTrendingMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual([mockToken])
  })

  it('should apply exchange rate to token prices', async () => {
    const mockToken = {
      internalId: 'avax',
      name: 'Avalanche',
      symbol: 'AVAX',
      price: 30,
      marketcap: 1000,
      fdv: 2000,
      volume24hUSD: 500,
      liquidity: 100,
      address: '0x123',
      decimals: 18,
      lastUpdated: '2024-01-01',
      sparkline: null,
      platforms: null,
      isNative: true
    }
    getTrendingMock.mockResolvedValue({ data: [mockToken] })

    const result = await TokenService.getTrendingTokens(2)

    expect(result[0]?.price).toEqual(60)
    expect(result[0]?.marketcap).toEqual(2000)
    expect(result[0]?.fdv).toEqual(4000)
    expect(result[0]?.volume24hUSD).toEqual(1000)
    expect(result[0]?.liquidity).toEqual(200)
  })

  it('should return empty array when API returns no data', async () => {
    getTrendingMock.mockResolvedValue({ data: undefined })

    const result = await TokenService.getTrendingTokens(undefined)

    expect(result).toEqual([])
  })
})

describe('getMarkets', () => {
  const proxyMock = jest.spyOn(proxy, 'coinsMarket')
  const { coinsMarket } = require('@avalabs/core-coingecko-sdk')

  it('should return coins market data from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    coinsMarket.mockImplementation(async () => MARKET_DATA as never)
    const result = await TokenService.getMarkets({})
    expect(coinsMarket).toHaveBeenCalledTimes(1)
    expect(result?.[0]?.id).toEqual('test')
  })
  it('should return coins market data from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    coinsMarket.mockRejectedValue(async () => MOCK_429)
    proxyMock.mockImplementation(async () => MARKET_DATA as never)
    const result = await TokenService.getMarkets({})
    expect(proxyMock).toHaveBeenCalledTimes(1)
    expect(result?.[0]?.id).toEqual('test')
  })
  it('should return coins market data from cache', async () => {
    inMemoryCacheMock.mockImplementation(() => MARKET_DATA as never)
    const result = await TokenService.getMarkets({})
    expect(coinsMarket).not.toHaveBeenCalled()
    expect(proxyMock).not.toHaveBeenCalled()
    expect(result?.[0]?.id).toEqual('test')
  })
})
