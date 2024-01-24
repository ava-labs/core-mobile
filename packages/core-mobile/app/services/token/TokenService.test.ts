import sdk from '@avalabs/coingecko-sdk'
import { watchListCacheClient } from 'services/watchlist/watchListCacheClient'
import * as inMemoryCache from 'utils/InMemoryCache'
import TokenService from './TokenService'
import TOP_MARKETS from './__mocks__/topMarkets.json'
import ADDITIONAL_MARKETS from './__mocks__/additionalMarkets.json'
import { coingeckoProxyClient as proxy } from './coingeckoProxyClient'
import WATCHLIST_PRICE from './__mocks__/watchlistPrice.json'
import MARKET_CHART from './__mocks__/marketChart.json'
import COIN_INFO from './__mocks__/coinInfo.json'
import MARKET_DATA from './__mocks__/marketData.json'

const MOCK_429 = { status: 429, message: 'Too many requests' }

const watchlistMarketsMock = jest.spyOn(watchListCacheClient, 'markets')

watchlistMarketsMock.mockImplementation(async ({ queries: { topMarkets } }) => {
  if (topMarkets) return TOP_MARKETS
  return ADDITIONAL_MARKETS
})

const inMemoryCacheMock = jest.spyOn(inMemoryCache, 'getCache')

describe('getMarketsFromWatchlistCache', () => {
  it('should return all cached markets', async () => {
    const result = await TokenService.getMarketsFromWatchlistCache({
      currency: sdk.VsCurrencyType.USD
    })
    expect(result.length).toEqual(5)
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
  const sdkSearchCoinsMock = jest.spyOn(sdk, 'coinsSearch')

  it('should return data from sdk', async () => {
    sdkSearchCoinsMock.mockImplementationOnce(async () => {
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
    expect(sdkSearchCoinsMock).toHaveBeenCalled()
    expect(result?.length).toEqual(1)
  })
  it('should return data from proxy', async () => {
    sdkSearchCoinsMock.mockRejectedValueOnce(async () => MOCK_429)
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
  const sdkMock = jest.spyOn(sdk, 'simplePrice')

  it('should return simple price data from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockImplementationOnce(async () => WATCHLIST_PRICE)
    const result = await TokenService.getSimplePrice({
      coinIds: ['test'],
      currency: sdk.VsCurrencyType.USD
    })
    expect(sdkMock).toHaveBeenCalledTimes(1)
    expect(result?.test?.usd?.price).toEqual(1)
  })
  it('should return simple price data from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockRejectedValueOnce(async () => MOCK_429)
    proxyMock.mockImplementationOnce(async () => WATCHLIST_PRICE)
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
    expect(sdkMock).not.toHaveBeenCalled()
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
  const sdkMock = jest.spyOn(sdk, 'coinsMarketChart')

  it('should return data from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockImplementationOnce(async () => MARKET_CHART as never)
    const result = await TokenService.getChartDataForCoinId({
      coingeckoId: 'test'
    })
    expect(sdkMock).toHaveBeenCalled()
    expect(result).not.toBeUndefined()
  })
  it('should return data from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockRejectedValueOnce(async () => MOCK_429)
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
  const sdkMock = jest.spyOn(sdk, 'coinsInfo')

  it('should return coin info from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockImplementationOnce(async () => COIN_INFO as never)
    const result = await TokenService.getCoinInfo({
      coingeckoId: 'test'
    })
    expect(sdkMock).toHaveBeenCalledTimes(1)
    expect(result?.id).toEqual('test')
  })
  it('should return coin info from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockRejectedValueOnce(async () => MOCK_429)
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
    expect(sdkMock).not.toHaveBeenCalled()
    expect(proxyMock).not.toHaveBeenCalled()
    expect(result?.id).toEqual('test')
  })
  it('should return fetched coin info with fresh param', async () => {
    inMemoryCacheMock.mockImplementation(() => COIN_INFO)
    sdkMock.mockImplementationOnce(async () => COIN_INFO as never)
    const result = await TokenService.getCoinInfo({
      coingeckoId: 'test',
      fresh: true
    })
    expect(sdkMock).toHaveBeenCalledTimes(1)
    expect(proxyMock).not.toHaveBeenCalled()
    expect(result?.id).toEqual('test')
  })
})

describe('getMarkets', () => {
  const proxyMock = jest.spyOn(proxy, 'coinsMarket')
  const sdkMock = jest.spyOn(sdk, 'coinsMarket')

  it('should return coins market data from sdk', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockImplementation(async () => MARKET_DATA as never)
    const result = await TokenService.getMarkets({})
    expect(sdkMock).toHaveBeenCalledTimes(1)
    expect(result?.[0]?.id).toEqual('test')
  })
  it('should return coins market data from proxy', async () => {
    inMemoryCacheMock.mockImplementation(() => undefined)
    sdkMock.mockRejectedValue(async () => MOCK_429)
    proxyMock.mockImplementation(async () => MARKET_DATA as never)
    const result = await TokenService.getMarkets({})
    expect(proxyMock).toHaveBeenCalledTimes(1)
    expect(result?.[0]?.id).toEqual('test')
  })
  it('should return coins market data from cache', async () => {
    inMemoryCacheMock.mockImplementation(() => MARKET_DATA as never)
    const result = await TokenService.getMarkets({})
    expect(sdkMock).not.toHaveBeenCalled()
    expect(proxyMock).not.toHaveBeenCalled()
    expect(result?.[0]?.id).toEqual('test')
  })
})
