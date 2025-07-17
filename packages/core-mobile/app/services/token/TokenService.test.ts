import * as sdk from '@avalabs/core-coingecko-sdk'
import { watchListCacheClient } from 'services/watchlist/watchListCacheClient'
import * as inMemoryCache from 'utils/InMemoryCache'
import TokenService from './TokenService'
import TOP_MARKETS from './__mocks__/tokens.json'
import { coingeckoProxyClient as proxy } from './coingeckoProxyClient'
import WATCHLIST_PRICE from './__mocks__/watchlistPrice.json'
import MARKET_CHART from './__mocks__/marketChart.json'
import COIN_INFO from './__mocks__/coinInfo.json'
import MARKET_DATA from './__mocks__/marketData.json'
import RAW_WATCHLIST_PRICE from './__mocks__/rawWatchlistPrice.json'

jest.mock('@avalabs/core-coingecko-sdk', () => ({
  ...jest.requireActual('@avalabs/core-coingecko-sdk'),
  coinsSearch: jest.fn(),
  simplePrice: jest.fn(),
  coinsMarketChart: jest.fn(),
  coinsInfo: jest.fn(),
  coinsMarket: jest.fn()
}))

const MOCK_429 = { status: 429, message: 'Too many requests' }

const watchlistMarketsMock = jest.spyOn(watchListCacheClient, 'tokens')

// @ts-ignore
watchlistMarketsMock.mockImplementation(async () => {
  return TOP_MARKETS
})

const inMemoryCacheMock = jest.spyOn(inMemoryCache, 'getCache')

describe('getMarketsFromWatchlistCache', () => {
  it('should return all cached markets', async () => {
    const result = await TokenService.getMarketsFromWatchlistCache({
      currency: sdk.VsCurrencyType.USD
    })
    expect(result.length).toEqual(1758)
  })
  it('should not have been called watchListCacheClient.markets', async () => {
    inMemoryCacheMock.mockImplementation(() => TOP_MARKETS)
    TokenService.getMarketsFromWatchlistCache({
      currency: sdk.VsCurrencyType.USD
    })
    expect(watchlistMarketsMock).not.toHaveBeenCalled()
  })
})

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
  it('should return simple price data from cache', async () => {
    inMemoryCacheMock.mockImplementation(() => WATCHLIST_PRICE)
    const result = await TokenService.getSimplePrice({
      coinIds: ['test'],
      currency: sdk.VsCurrencyType.USD
    })
    expect(simplePrice).not.toHaveBeenCalled()
    expect(proxyMock).not.toHaveBeenCalled()
    expect(result?.test?.usd?.price).toEqual(1)
  })
})

describe('getPriceWithMarketDataByCoinId', () => {
  const watchlistSimplePriceMock = jest.spyOn(
    watchListCacheClient,
    'simplePrice'
  )
  watchlistSimplePriceMock.mockImplementationOnce(async () => {
    return WATCHLIST_PRICE
  })
  it('should return data for token test in currency USD', async () => {
    const result = await TokenService.getPriceWithMarketDataByCoinId('test')
    expect(result.price).toEqual(1)
  })
  it('should return data for token aave in currency AUD', async () => {
    const result = await TokenService.getPriceWithMarketDataByCoinId(
      'test-aave',
      sdk.VsCurrencyType.AUD
    )
    expect(result.price).toEqual(10)
  })
  it('should return 0 for unknown token', async () => {
    const result = await TokenService.getPriceWithMarketDataByCoinId('unknown')
    expect(result.price).toEqual(0)
  })
})

describe('getPriceWithMarketDataByCoinIds', () => {
  const watchlistSimplePriceMock = jest.spyOn(
    watchListCacheClient,
    'simplePrice'
  )
  watchlistSimplePriceMock.mockImplementationOnce(async () => {
    return WATCHLIST_PRICE
  })
  it('should return data for list of tokens in currency USD', async () => {
    const result = await TokenService.getPriceWithMarketDataByCoinIds([
      'test',
      'test-aave'
    ])
    // @ts-ignore
    expect(Object.keys(result).length).toEqual(2)
  })
  it('should return empty object for tokens in currency USD', async () => {
    const result = await TokenService.getPriceWithMarketDataByCoinIds([
      'unknown1',
      'unknonw2'
    ])
    // @ts-ignore
    expect(Object.keys(result).length).toEqual(0)
  })
  it('should return data for matching token in currency USD', async () => {
    const result = await TokenService.getPriceWithMarketDataByCoinIds([
      'unknown1',
      'test'
    ])
    // @ts-ignore
    expect(Object.keys(result).length).toEqual(1)
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
