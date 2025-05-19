import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import {
  transformSimplePriceResponse,
  applyExchangeRateToTrendingTokens
} from './utils'

const MOCK_DATA = {
  bitcoin: {
    usd: 1,
    usd_24h_change: 2,
    usd_market_cap: 3,
    usd_24h_vol: 4,
    aud: 5,
    aud_24h_change: 6,
    aud_market_cap: 7,
    aud_24h_vol: 8
  }
}

describe('transformSimplePriceResponse', () => {
  it('should transform raw data to SimplePriceResponse', () => {
    const result = transformSimplePriceResponse(MOCK_DATA, [
      VsCurrencyType.USD,
      VsCurrencyType.AUD
    ])
    expect(result.bitcoin?.usd).toEqual({
      price: 1,
      change24: 2,
      marketCap: 3,
      vol24: 4
    })
    expect(result.bitcoin?.aud).toEqual({
      price: 5,
      change24: 6,
      marketCap: 7,
      vol24: 8
    })
  })
  it('should return empty object', () => {
    const result = transformSimplePriceResponse(MOCK_DATA, ['unknown'] as never)
    expect(result.bitcoin?.unknown).toEqual({})
  })
})

describe('applyExchangeRateToTrendingTokens', () => {
  it('should correctly convert all numeric values using the exchange rate', () => {
    const trendingTokens = [
      {
        address: '0x123',
        decimals: 18,
        liquidity: 1000,
        logoURI: 'https://example.com/logo.png',
        internalId: '0x123',
        coingeckoId: 'test-coingecko-id',
        platforms: {
          'eip155:43114': '0x123'
        },
        name: 'Test Token',
        symbol: 'TEST',
        volume24hUSD: 5000,
        volume24hChangePercent: -10,
        fdv: 1000000,
        marketcap: 500000,
        rank: 1,
        price: 10,
        price24hChangePercent: -2,
        website: 'https://testtoken.com',
        twitter: '',
        discord: '',
        medium: '',
        verified: null,
        sparkline: [
          { unixTime: 1740498300, value: 10 },
          { unixTime: 1740499200, value: 9.5 }
        ]
      }
    ]

    const exchangeRate = 0.85
    const converted = applyExchangeRateToTrendingTokens(
      trendingTokens,
      exchangeRate
    )

    expect(converted[0]?.price).toBe(8.5)
    expect(converted[0]?.marketcap).toBe(425000)
    expect(converted[0]?.fdv).toBe(850000)
    expect(converted[0]?.volume24hUSD).toBe(4250)
    expect(converted[0]?.liquidity).toBe(850)
    expect(converted[0]?.sparkline?.[0]?.value).toBe(8.5)
    expect(converted[0]?.sparkline?.[1]?.value).toBe(8.075)
  })

  it('should not modify non-numeric values', () => {
    const trendingTokens = [
      {
        address: '0x123',
        decimals: 18,
        liquidity: null,
        logoURI: 'https://example.com/logo.png',
        internalId: '0x123',
        coingeckoId: 'test-coingecko-id',
        platforms: {
          'eip155:43114': '0x123'
        },
        name: 'Test Token',
        symbol: 'TEST',
        volume24hUSD: null,
        marketcap: null,
        rank: 1,
        fdv: undefined,
        price: 10,
        price24hChangePercent: -2,
        website: 'https://testtoken.com',
        twitter: '',
        discord: '',
        medium: '',
        verified: null,
        sparkline: undefined
      }
    ]

    const exchangeRate = 0.85
    const converted = applyExchangeRateToTrendingTokens(
      trendingTokens,
      exchangeRate
    )

    expect(converted[0]?.liquidity).toBe(null)
    expect(converted[0]?.volume24hUSD).toBe(null)
    expect(converted[0]?.marketcap).toBeNull()
    expect(converted[0]?.fdv).toBeUndefined()
    expect(converted[0]?.sparkline).toBeUndefined()
    expect(converted[0]?.price).toBe(8.5)
  })

  it('should handle an empty array gracefully', () => {
    const converted = applyExchangeRateToTrendingTokens([], 0.85)
    expect(converted).toEqual([])
  })
})
