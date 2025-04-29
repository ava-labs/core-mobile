// write test for getCoingeckoId
import { TokenInfoData } from '@avalabs/core-bridge-sdk'
import { getCoingeckoId } from './getCoingeckoId'

describe('getCoingeckoId', () => {
  it('should return undefined if symbol is undefined', () => {
    expect(getCoingeckoId('', undefined)).toBeUndefined()
  })

  it('should return undefined if tokenInfoData is undefined', () => {
    expect(getCoingeckoId('AVAX')).toBeUndefined()
  })

  it('should return coingeckoId from tokenInfoData', () => {
    const tokenInfoData = {
      ABC: { coingeckoId: 'abc' }
    } as unknown as TokenInfoData
    expect(getCoingeckoId('ABC', tokenInfoData)).toEqual('abc')
  })

  it('should return coingeckoId from KNOWN_IDS', () => {
    const tokenInfoData = {}
    expect(getCoingeckoId('AVAX', tokenInfoData)).toEqual('avalanche-2')
  })
})
