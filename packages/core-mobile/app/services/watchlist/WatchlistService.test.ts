import TokenService from 'services/token/TokenService'
import { transformSparklineData } from 'services/token/utils'
import { MarketType } from 'store/watchlist'
import WATCHLIST_PRICE from '../token/__mocks__/watchlistPrice.json'
import ADDITIONAL_WATCHLIST_PRICE from '../token/__mocks__/additionalWatchlistPrice.json'

// Mock the HTTP clients before importing WatchlistService
jest.mock('utils/api/clients/proxyApiClient', () => ({
  proxyApi: {
    GET: jest.fn(),
    use: jest.fn()
  }
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {
    GET: jest.fn(),
    use: jest.fn()
  }
}))

import { WatchlistService } from './WatchlistService'


jest.mock('services/token/utils', () => ({
  transformSparklineData: jest.fn()
}))

// Mock TokenService as a singleton instance with instance methods
jest.mock('services/token/TokenService', () => ({
  getTokenSearch: jest.fn(),
  getSimplePrice: jest.fn(),
  getMarkets: jest.fn(),
  fetchPriceWithMarketData: jest.fn()
}))

describe('getTopMarkets', () => {
  let watchlistService: WatchlistService
  const getV1watchlistmarketsMock =
    mockAggregatedClient.getV1watchlistmarkets as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    watchlistService = new WatchlistService(mockAggregatedClient)
  })

  it('should call token aggregator API with correct params', async () => {
    getV1watchlistmarketsMock.mockResolvedValue([])

    await watchlistService.getTopTokens('USD')

    expect(getV1watchlistmarketsMock).toHaveBeenCalledWith('usd')
  })

  it('should return correctly mapped markets', async () => {
    getV1watchlistmarketsMock.mockResolvedValue([
      {
        internalId: 'avax',
        coingeckoId: 'avalanche-2',
        platforms: { 43114: '0x123' },
        symbol: 'AVAX',
        name: 'Avalanche',
        meta: { logoUri: 'avax.png' },
        current_price: 35,
        price_change_24h: 1.2,
        price_change_percentage_24h: -3.4
      }
    ])

    const result = await watchlistService.getTopTokens('USD')
    const m = result.tokens

    expect(Object.keys(m)).toEqual(['avax'])

    expect(m.avax).toEqual({
      marketType: MarketType.TOP,
      id: 'avax',
      coingeckoId: 'avalanche-2',
      platforms: { 43114: '0x123' },
      symbol: 'AVAX',
      name: 'Avalanche',
      logoUri: 'avax.png',
      currentPrice: 35,
      priceChange24h: 1.2,
      priceChangePercentage24h: -3.4
    })
  })

  it('should map sparkline chart data when present', async () => {
    getV1watchlistmarketsMock.mockResolvedValue([
      {
        internalId: 'avax',
        sparkline_in_7d: { price: [1, 2, 3] }
      }
    ])
    ;(transformSparklineData as jest.Mock).mockReturnValue([10, 20, 30])

    const { charts } = await watchlistService.getTopTokens('USD')

    expect(transformSparklineData).toHaveBeenCalledWith([1, 2, 3])
    expect(charts.avax).toEqual([10, 20, 30])
  })

  it('should NOT add chart entry when sparkline is missing', async () => {
    getV1watchlistmarketsMock.mockResolvedValue([
      {
        internalId: 'avax',
        sparkline_in_7d: null
      }
    ])

    const { charts } = await watchlistService.getTopTokens('USD')
    expect(charts).toEqual({})
  })

  it('should return empty markets and charts when API returns empty array', async () => {
    getV1watchlistmarketsMock.mockResolvedValue([])

    const result = await watchlistService.getTopTokens('USD')

    expect(result.tokens).toEqual({})
    expect(result.charts).toEqual({})
  })

  it('should handle missing optional fields gracefully', async () => {
    getV1watchlistmarketsMock.mockResolvedValue([
      {
        internalId: 'test',
        symbol: 'TST',
        name: 'TestToken'
        // everything else undefined
      }
    ])

    const { tokens } = await watchlistService.getTopTokens('USD')

    expect(tokens.test).toEqual({
      marketType: MarketType.TOP,
      id: 'test',
      coingeckoId: undefined,
      platforms: {},
      symbol: 'TST',
      name: 'TestToken',
      logoUri: undefined,
      currentPrice: undefined,
      priceChange24h: undefined,
      priceChangePercentage24h: undefined
    })
  })
})

describe('getPrices', () => {
  let watchlistService: WatchlistService
  const fetchPriceWithMarketDataMock =
    TokenService.fetchPriceWithMarketData as jest.Mock
  const getSimplePriceMock = TokenService.getSimplePrice as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    watchlistService = new WatchlistService(mockAggregatedClient)
  })

  it('should return all merged price data from cache + simple price API', async () => {
    fetchPriceWithMarketDataMock.mockResolvedValue(WATCHLIST_PRICE)
    getSimplePriceMock.mockResolvedValue(ADDITIONAL_WATCHLIST_PRICE)

    const result = await watchlistService.getPrices(
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
    expect(Object.keys(result)).toHaveLength(5)
  })

  it('should return only cached price data when all IDs exist in cache', async () => {
    fetchPriceWithMarketDataMock.mockResolvedValue(WATCHLIST_PRICE)
    getSimplePriceMock.mockResolvedValue(ADDITIONAL_WATCHLIST_PRICE)

    const result = await watchlistService.getPrices(
      ['test-aave', 'test'],
      'usd'
    )

    expect(fetchPriceWithMarketDataMock).toHaveBeenCalledTimes(1)
    expect(getSimplePriceMock).not.toHaveBeenCalled()
    expect(Object.keys(result)).toHaveLength(2)
  })
})

describe('tokenSearch', () => {
  let watchlistService: WatchlistService
  const getTokenSearchMock = TokenService.getTokenSearch as jest.Mock
  const getMarketsMock = TokenService.getMarkets as jest.Mock
  const getSimplePriceMock = TokenService.getSimplePrice as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    watchlistService = new WatchlistService(mockAggregatedClient)
  })

  it('should return tokens, prices, and charts for a valid query', async () => {
    // 1. Mock search results
    getTokenSearchMock.mockResolvedValue([
      { id: 'test', symbol: 'TEST', name: 'Test Token' },
      { id: 'test-aave', symbol: 'AAVE', name: 'Aave Test' }
    ])

    // 2. Mock markets returned by getMarketsByCoinIds()
    getMarketsMock.mockResolvedValue([
      {
        id: 'test',
        symbol: 'TEST',
        name: 'Test Token',
        image: 'test.png',
        price_change_24h: 1,
        price_change_percentage_24h: 2,
        sparkline_in_7d: { price: [1, 2, 3] }
      },
      {
        id: 'test-aave',
        symbol: 'AAVE',
        name: 'Aave Test',
        image: 'aave.png',
        sparkline_in_7d: null
      }
    ])

    // 3. Mock prices returned by getSimplePrice()
    getSimplePriceMock.mockResolvedValue({
      test: {
        usd: { price: 100, change24: 1, marketCap: 999, vol24: 200 }
      },
      'test-aave': {
        usd: { price: 50, change24: -1, marketCap: 500, vol24: 120 }
      }
    })
    ;(transformSparklineData as jest.Mock).mockReturnValue([10, 20, 30])

    const result = await watchlistService.tokenSearch('test', 'usd')
    expect(result).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { tokens, charts, prices } = result!

    // TOKENS
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({
      marketType: 'SEARCH',
      id: 'search:test',
      coingeckoId: 'test',
      symbol: 'TEST',
      name: 'Test Token',
      currentPrice: 100
    })

    expect(tokens[1]).toMatchObject({
      id: 'search:test-aave',
      currentPrice: 50
    })

    // CHARTS (only first has sparkline)
    expect(charts.test).toEqual([10, 20, 30])
    expect(charts['test-aave']).toBeUndefined()

    // PRICES
    expect(prices.test).toEqual({
      priceInCurrency: 100,
      change24: 1,
      marketCap: 999,
      vol24: 200
    })
  })

  it('should return undefined when search yields no results', async () => {
    getTokenSearchMock.mockResolvedValue([])

    const result = await watchlistService.tokenSearch('unknown', 'usd')
    expect(result).toBeUndefined()
  })
})
