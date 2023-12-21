import { DeFiProtocolInformation } from 'services/browser/types'
import MOCK_PROTOCOL_INFORMATION_DATA from 'tests/fixtures/browser/protocolInformationListData.json'
import {
  getTopDefiProtocolInformationList,
  isValidHttpUrl,
  isValidUrl,
  normalizeUrlWithHttps,
  removeProtocol,
  sortDeFiProtocolInformationListByTvl
} from './utils'

describe('sortDeFiProtocolInformationListByTvl', () => {
  it('should have returned item with highest tvl value', () => {
    const sorted = sortDeFiProtocolInformationListByTvl(
      MOCK_PROTOCOL_INFORMATION_DATA as unknown as DeFiProtocolInformation[]
    )
    expect(sorted[0]?.tvl).toStrictEqual(139422539.71763813)
  })
})

describe('getTopDefiProtocolInformationList', () => {
  it('should have returned first 8 items from sorted list', () => {
    const firstEightItems = getTopDefiProtocolInformationList(
      MOCK_PROTOCOL_INFORMATION_DATA as unknown as DeFiProtocolInformation[]
    )
    expect(firstEightItems.length).toStrictEqual(8)
  })

  it('should have returned first 10 items from sorted list', () => {
    const firstEightItems = getTopDefiProtocolInformationList(
      MOCK_PROTOCOL_INFORMATION_DATA as unknown as DeFiProtocolInformation[],
      10
    )
    expect(firstEightItems.length).toStrictEqual(10)
  })
})

describe('removeProtocol', () => {
  it('should have returned url without protocol', () => {
    const url = 'https://core.app/'
    const result = removeProtocol(url)
    expect(result).toStrictEqual('core.app/')
  })
})

describe('normalizeUrlWithHttps', () => {
  it('should have returned url with https:// protocol', () => {
    const url = 'core.app'
    const result = normalizeUrlWithHttps(url)
    expect(result).toStrictEqual('https://core.app')
  })
})

describe('isValidUrl', () => {
  it('should have returned true with https:// protocol', () => {
    const url = 'https://core.app'
    const result = isValidUrl(url)
    expect(result).toStrictEqual(true)
  })

  it('should have returned false without protocol', () => {
    const url = 'core.app'
    const result = isValidUrl(url)
    expect(result).toStrictEqual(false)
  })
})

describe('isValidHttpUrl', () => {
  it('should have returned true with https:// protocol', () => {
    const url = 'https://core.app'
    const result = isValidHttpUrl(url)
    expect(result).toStrictEqual(true)
  })

  it('should have returned true with http:// protocol', () => {
    const url = 'http://core.app'
    const result = isValidHttpUrl(url)
    expect(result).toStrictEqual(true)
  })

  it('should have returned false without protocol', () => {
    const url = 'core.app'
    const result = isValidHttpUrl(url)
    expect(result).toStrictEqual(false)
  })

  it('should have returned false with non-http protocol', () => {
    const url = 'core://stake'
    const result = isValidHttpUrl(url)
    expect(result).toStrictEqual(false)
  })
})
