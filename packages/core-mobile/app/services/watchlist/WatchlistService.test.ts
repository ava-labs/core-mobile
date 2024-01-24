import TokenService from 'services/token/TokenService'
import TOP_MARKETS from '../token/__mocks__/topMarkets.json'
import ADDITIONAL_MARKETS from '../token/__mocks__/additionalMarkets.json'
import WATCHLIST_PRICE from '../token/__mocks__/watchlistPrice.json'
import ADDITIONAL_WATCHLIST_PRICE from '../token/__mocks__/additionalWatchlistPrice.json'
import WatchlistService from './WatchlistService'

describe('getTokens', () => {
  const getMarketsFromWatchlistCacheMock = jest.spyOn(
    TokenService,
    'getMarketsFromWatchlistCache'
  )
  const getMarketsMock = jest.spyOn(TokenService, 'getMarkets')
  it('should return all market data', async () => {
    getMarketsFromWatchlistCacheMock.mockImplementation(
      () => TOP_MARKETS as never
    )
    getMarketsMock.mockImplementation(() => ADDITIONAL_MARKETS as never)
    const result = await WatchlistService.getTokens('usd', [
      'avalanche-2',
      'internet-computer'
    ])
    expect(Object.keys(result.tokens).length).toEqual(5)
  })

  it('should return only cached market data', async () => {
    getMarketsFromWatchlistCacheMock.mockImplementation(
      () => TOP_MARKETS as never
    )
    getMarketsMock.mockImplementation(() => ADDITIONAL_MARKETS as never)
    const result = await WatchlistService.getTokens('usd', [])
    expect(Object.keys(result.tokens).length).toEqual(3)
  })
})

describe('getPrices', () => {
  const fetchPriceWithMarketDataMock = jest.spyOn(
    TokenService,
    'fetchPriceWithMarketData'
  )
  const getSimplePriceMock = jest.spyOn(TokenService, 'getSimplePrice')
  it('should return all price data', async () => {
    fetchPriceWithMarketDataMock.mockImplementation(
      () => WATCHLIST_PRICE as never
    )
    getSimplePriceMock.mockImplementation(
      () => ADDITIONAL_WATCHLIST_PRICE as never
    )
    const result = await WatchlistService.getPrices(
      [
        'test-aave',
        'test',
        'additional-watchlist-price-1',
        'additional-watchlist-price-2',
        'additional-watchlist-price-3'
      ],
      'usd'
    )
    expect(fetchPriceWithMarketDataMock).toHaveBeenCalledTimes(1)
    expect(getSimplePriceMock).toHaveBeenCalledTimes(1)
    expect(Object.keys(result).length).toEqual(5)
  })

  it('should return only cached price data', async () => {
    fetchPriceWithMarketDataMock.mockImplementation(
      () => WATCHLIST_PRICE as never
    )
    getSimplePriceMock.mockImplementation(
      () => ADDITIONAL_WATCHLIST_PRICE as never
    )
    const result = await WatchlistService.getPrices(
      ['test-aave', 'test'],
      'usd'
    )
    expect(fetchPriceWithMarketDataMock).toHaveBeenCalledTimes(1)
    expect(getSimplePriceMock).not.toHaveBeenCalled()
    expect(Object.keys(result).length).toEqual(2)
  })
})

describe('tokenSearch', () => {
  const getTokenSearchMock = jest.spyOn(TokenService, 'getTokenSearch')
  const getPriceWithMarketDataByCoinIdsMock = jest.spyOn(
    TokenService,
    'getPriceWithMarketDataByCoinIds'
  )
  const getMarketsFromWatchlistCacheMock = jest.spyOn(
    TokenService,
    'getMarketsFromWatchlistCache'
  )
  it('should return token data by search query', async () => {
    getTokenSearchMock.mockImplementationOnce(async () => {
      return [
        {
          id: 'test'
        },
        {
          id: 'test-aave'
        },
        {
          id: 'test01'
        }
      ] as never
    })
    getPriceWithMarketDataByCoinIdsMock.mockImplementation(
      () => WATCHLIST_PRICE as never
    )
    getMarketsFromWatchlistCacheMock.mockImplementation(
      () => TOP_MARKETS as never
    )

    const result = await WatchlistService.tokenSearch('test', 'usd')
    expect(getPriceWithMarketDataByCoinIdsMock).toHaveBeenCalledTimes(1)
    expect(getMarketsFromWatchlistCacheMock).toHaveBeenCalledTimes(1)
    expect(Object.keys(result?.tokens as never).length).toEqual(3)
  })

  it('should return undefined if query does not match any token', async () => {
    getTokenSearchMock.mockImplementationOnce(async () => [])
    const result = await WatchlistService.tokenSearch('unknown', 'usd')
    expect(result).toBeUndefined()
    expect(getPriceWithMarketDataByCoinIdsMock).not.toHaveBeenCalled()
    expect(getMarketsFromWatchlistCacheMock).not.toHaveBeenCalled()
  })
})
