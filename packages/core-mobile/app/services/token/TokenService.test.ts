import sdk from '@avalabs/coingecko-sdk'
import { watchListCacheClient } from 'services/watchlist/watchListCacheClient'
import * as inMemoryCache from 'utils/InMemoryCache'
import TokenService from './TokenService'
import TOP_MARKETS from './__mocks__/topMarkets.json'
import ADDITIONAL_MARKETS from './__mocks__/additionalMarkets.json'
import { coingeckoProxyClient as proxy } from './coingeckoProxyClient'
import WATCHLIST_PRICE from './__mocks__/watchlistPrice.json'
import { ChartDataSchema, ContractMarketChartResponseSchema } from './types'
import MARKET_CHART from './__mocks__/marketChart.json'

const MOCK_429 = { status: 429, message: 'Too many requests' }

const watchlistMarketsMock = jest.spyOn(watchListCacheClient, 'markets')

watchlistMarketsMock.mockImplementation(async ({ queries: { topMarkets } }) => {
  if (topMarkets) return TOP_MARKETS
  return ADDITIONAL_MARKETS
})

const inMemoryCacheMock = jest.spyOn(inMemoryCache, 'getCache')

describe('TokenService', () => {
  describe('getMarketsFromWatchlistCache', () => {
    it('should return all cached markets', async () => {
      const result = await TokenService.getMarketsFromWatchlistCache({
        currency: sdk.VsCurrencyType.USD
      })
      expect(result.length).toEqual(4)
    })
    it('should not have been called watchListCacheClient.markets', async () => {
      inMemoryCacheMock.mockImplementationOnce(() => TOP_MARKETS)
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
        'aave',
        sdk.VsCurrencyType.AUD
      )
      expect(result.price).toEqual(10)
    })
    it('should return 0 for unknown token', async () => {
      const result = await TokenService.getPriceWithMarketDataByCoinId(
        'unknown'
      )
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
        'aave'
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
      sdkMock.mockImplementationOnce(async () => MARKET_CHART as never)
      const result = await TokenService.getChartDataForCoinId({
        coingeckoId: 'test'
      })
      expect(sdkMock).toHaveBeenCalled()
      expect(result).not.toBeUndefined()
    })
    it('should return data from proxy', async () => {
      sdkMock.mockRejectedValueOnce(async () => MOCK_429)
      proxyMock.mockImplementationOnce(async () => MARKET_CHART as never)
      const result = await TokenService.getChartDataForCoinId({
        coingeckoId: 'test'
      })
      expect(proxyMock).toHaveBeenCalled()
      expect(result).not.toBeUndefined()
    })
  })
})
