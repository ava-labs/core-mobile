import { transformMartketChartRawPrices } from 'services/token/utils'
import { MarketType } from 'store/watchlist/types'
import {
  applyExchangeRateToTrendingTokens,
  transformTrendingTokens
} from './transform'

jest.mock('services/token/utils', () => ({
  transformMartketChartRawPrices: jest.fn()
}))

const mockTransformChart = transformMartketChartRawPrices as jest.Mock

const BASE_TOKEN = {
  address: '0x123',
  decimals: 18,
  internalId: 'avax',
  coingeckoId: 'avalanche-2',
  platforms: { 'eip155:43114': '0x123' },
  name: 'Avalanche',
  symbol: 'AVAX',
  logoURI: 'https://example.com/avax.png',
  price: 30,
  price24hChangePercent: -2,
  marketcap: 10000,
  fdv: 12000,
  volume24hUSD: 5000,
  volume24hChangePercent: 1,
  liquidity: 1000,
  rank: 1,
  website: '',
  twitter: '',
  discord: '',
  medium: '',
  verified: null,
  sparkline: null,
  isNative: true,
  lastUpdated: ''
}

describe('transformTrendingTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps token fields to MarketToken correctly', () => {
    const { tokens } = transformTrendingTokens([BASE_TOKEN])

    expect(tokens.avax).toEqual({
      marketType: MarketType.TRENDING,
      id: 'avax',
      coingeckoId: 'avalanche-2',
      platforms: { 'eip155:43114': '0x123' },
      symbol: 'AVAX',
      name: 'Avalanche',
      logoUri: 'https://example.com/avax.png',
      currentPrice: 30,
      priceChange24h: 0,
      priceChangePercentage24h: -2
    })
  })

  it('maps price data to prices correctly', () => {
    const { prices } = transformTrendingTokens([BASE_TOKEN])

    expect(prices.avax).toEqual({
      priceInCurrency: 30,
      change24: 0,
      marketCap: 10000,
      vol24: 5000
    })
  })

  it('builds chart from sparkline and uses diffValue for priceChange24h', () => {
    const mockChartResult = {
      ranges: {
        diffValue: 1.5,
        percentChange: -3,
        minDate: 0,
        maxDate: 0,
        minPrice: 0,
        maxPrice: 0
      },
      dataPoints: []
    }
    mockTransformChart.mockReturnValue(mockChartResult)

    const token = {
      ...BASE_TOKEN,
      sparkline: [
        { unixTime: 1000, value: 28 },
        { unixTime: 2000, value: 30 }
      ]
    }

    const { tokens, charts, prices } = transformTrendingTokens([token])

    expect(mockTransformChart).toHaveBeenCalledWith([
      [1000000, 28],
      [2000000, 30]
    ])
    expect(charts.avax).toBe(mockChartResult)
    expect(tokens.avax?.priceChange24h).toBe(1.5)
    expect(tokens.avax?.priceChangePercentage24h).toBe(-3)
    expect(prices.avax?.change24).toBe(1.5)
  })

  it('falls back to token.price24hChangePercent when no sparkline', () => {
    const { tokens } = transformTrendingTokens([BASE_TOKEN])

    expect(tokens.avax?.priceChangePercentage24h).toBe(-2)
  })

  it('does not add a chart entry when sparkline is null', () => {
    const { charts } = transformTrendingTokens([BASE_TOKEN])

    expect(charts).toEqual({})
  })

  it('falls back to empty platforms when token.platforms is null', () => {
    const { tokens } = transformTrendingTokens([
      { ...BASE_TOKEN, platforms: null }
    ])

    expect(tokens.avax?.platforms).toEqual({})
  })

  it('returns undefined logoUri when logoURI is null', () => {
    const { tokens } = transformTrendingTokens([
      {
        ...BASE_TOKEN,
        logoURI: null
      }
    ])

    expect(tokens.avax?.logoUri).toBeUndefined()
  })

  it('returns undefined currentPrice when price is null', () => {
    const { tokens } = transformTrendingTokens([{ ...BASE_TOKEN, price: null }])

    expect(tokens.avax?.currentPrice).toBeUndefined()
  })

  it('handles an empty array', () => {
    const { tokens, charts, prices } = transformTrendingTokens([])

    expect(tokens).toEqual({})
    expect(charts).toEqual({})
    expect(prices).toEqual({})
  })

  it('handles multiple tokens', () => {
    const second = {
      ...BASE_TOKEN,
      internalId: 'eth',
      symbol: 'ETH',
      name: 'Ethereum'
    }

    const { tokens } = transformTrendingTokens([BASE_TOKEN, second])

    expect(Object.keys(tokens)).toEqual(['avax', 'eth'])
  })
})

describe('applyExchangeRateToTrendingTokens', () => {
  it('scales all numeric price fields by the exchange rate', () => {
    const converted = applyExchangeRateToTrendingTokens([BASE_TOKEN], 0.85)

    expect(converted[0]?.price).toBe(25.5)
    expect(converted[0]?.marketcap).toBe(8500)
    expect(converted[0]?.fdv).toBe(10200)
    expect(converted[0]?.volume24hUSD).toBe(4250)
    expect(converted[0]?.liquidity).toBe(850)
  })

  it('scales sparkline values', () => {
    const token = {
      ...BASE_TOKEN,
      sparkline: [
        { unixTime: 1000, value: 10 },
        { unixTime: 2000, value: 9.5 }
      ]
    }
    const converted = applyExchangeRateToTrendingTokens([token], 0.85)

    expect(converted[0]?.sparkline?.[0]?.value).toBe(8.5)
    expect(converted[0]?.sparkline?.[1]?.value).toBe(8.075)
  })

  it('leaves null/undefined numeric fields unchanged', () => {
    const token = {
      ...BASE_TOKEN,
      price: null,
      volume24hUSD: null,
      marketcap: null,
      fdv: undefined,
      sparkline: null
    }
    const converted = applyExchangeRateToTrendingTokens([token], 0.85)

    expect(converted[0]?.price).toBeNull()
    expect(converted[0]?.volume24hUSD).toBeNull()
    expect(converted[0]?.marketcap).toBeNull()
    expect(converted[0]?.fdv).toBeUndefined()
    expect(converted[0]?.sparkline).toBeNull()
  })

  it('handles an empty array', () => {
    expect(applyExchangeRateToTrendingTokens([], 0.85)).toEqual([])
  })
})
