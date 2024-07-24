import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { transformSimplePriceResponse } from './utils'

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
