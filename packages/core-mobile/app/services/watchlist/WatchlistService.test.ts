import TokenService from 'services/token/TokenService'
import { transformSparklineData } from 'services/token/utils'
import { MarketType } from 'store/watchlist'
import { getV1WatchlistMarkets } from 'utils/api/generated/tokenAggregator/aggregatorApi.client/sdk.gen'
import WatchlistService from './WatchlistService'

jest.mock('services/token/utils', () => ({
  transformSparklineData: jest.fn()
}))

jest.mock('services/token/TokenService', () => ({
  getTokenSearch: jest.fn(),
  getSimplePrice: jest.fn(),
  getMarkets: jest.fn(),
  fetchPriceWithMarketData: jest.fn()
}))

// Mock the generated SDK function
jest.mock(
  'utils/api/generated/tokenAggregator/aggregatorApi.client/sdk.gen',
  () => ({
    getV1WatchlistMarkets: jest.fn()
  })
)

describe('getTopMarkets', () => {
  const getV1WatchlistMarketsMock = getV1WatchlistMarkets as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call token aggregator API with correct params', async () => {
    getV1WatchlistMarketsMock.mockResolvedValue({ data: [] })

    await WatchlistService.getTopTokens('USD')

    expect(getV1WatchlistMarketsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { currency: 'usd', topMarkets: true }
      })
    )
  })

  it('should return correctly mapped markets', async () => {
    getV1WatchlistMarketsMock.mockResolvedValue({
      data: [
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
      ]
    })

    const result = await WatchlistService.getTopTokens('USD')
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
    getV1WatchlistMarketsMock.mockResolvedValue({
      data: [
        {
          internalId: 'avax',
          sparkline_in_7d: { price: [1, 2, 3] }
        }
      ]
    })
    ;(transformSparklineData as jest.Mock).mockReturnValue([10, 20, 30])

    const { charts } = await WatchlistService.getTopTokens('USD')

    expect(transformSparklineData).toHaveBeenCalledWith([1, 2, 3])
    expect(charts.avax).toEqual([10, 20, 30])
  })

  it('should NOT add chart entry when sparkline is missing', async () => {
    getV1WatchlistMarketsMock.mockResolvedValue({
      data: [
        {
          internalId: 'avax',
          sparkline_in_7d: null
        }
      ]
    })

    const { charts } = await WatchlistService.getTopTokens('USD')
    expect(charts).toEqual({})
  })

  it('should return empty markets and charts when API returns empty array', async () => {
    getV1WatchlistMarketsMock.mockResolvedValue({ data: [] })

    const result = await WatchlistService.getTopTokens('USD')

    expect(result.tokens).toEqual({})
    expect(result.charts).toEqual({})
  })

  it('should return correctly mapped prices', async () => {
    getV1WatchlistMarketsMock.mockResolvedValue({
      data: [
        {
          internalId: 'avax',
          current_price: 35,
          price_change_24h: 1.2,
          price_change_percentage_24h: -3.4,
          market_cap: 2000000000,
          total_volume: 1000000000
        }
      ]
    })

    const result = await WatchlistService.getTopTokens('USD')

    expect(result.prices.avax).toEqual({
      priceInCurrency: 35,
      change24: 1.2,
      marketCap: 2000000000,
      vol24: 1000000000
    })
  })

  it('should handle missing optional fields gracefully', async () => {
    getV1WatchlistMarketsMock.mockResolvedValue({
      data: [
        {
          internalId: 'test',
          symbol: 'TST',
          name: 'TestToken'
          // everything else undefined
        }
      ]
    })

    const { tokens } = await WatchlistService.getTopTokens('USD')

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

describe('tokenSearch', () => {
  const getTokenSearchMock = TokenService.getTokenSearch as jest.Mock
  const getMarketsMock = TokenService.getMarkets as jest.Mock
  const getSimplePriceMock = TokenService.getSimplePrice as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
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

    const result = await WatchlistService.tokenSearch('test', 'usd')
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

    const result = await WatchlistService.tokenSearch('unknown', 'usd')
    expect(result).toBeUndefined()
  })
})
