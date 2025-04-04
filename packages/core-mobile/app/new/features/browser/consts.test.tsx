import { DeFiProtocolInformation } from 'services/browser/types'
import MOCK_PROTOCOL_INFORMATION_DATA from '../../../../tests/fixtures/browser/protocolInformationListData.json'
import {
  getNextFavColor,
  getTopDefiProtocolInformationList,
  isValidHttpUrl,
  isValidUrl,
  normalizeUrlWithHttps,
  removeProtocol,
  removeTrailingSlash,
  sortDeFiProtocolInformationListByTvl
} from './consts'

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

  it('should return same input if result is not valid url', () => {
    let url = 'core app'
    let result = normalizeUrlWithHttps(url)
    expect(result).toEqual(url)

    url = 'coreapp'
    result = normalizeUrlWithHttps(url)
    expect(result).toEqual(url)

    url = 'http://coreapp'
    result = normalizeUrlWithHttps(url)
    expect(result).toEqual(url)
  })

  it('should convert http to https', () => {
    const url = 'http://core.app'
    const result = normalizeUrlWithHttps(url)
    expect(result).toEqual('https://core.app')
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

describe('getNextFavColor', () => {
  it('should get color in order', () => {
    const favIds = ['fav1', 'fav2', 'fav3']
    const controlFavColors = ['#003F5C', '#00628F', '#2F4B7C']
    const testFavColors = favIds.map(id => getNextFavColor(id))
    expect(testFavColors).toEqual(controlFavColors)
  })
  it('should get same color for same id', () => {
    const favIds = ['fav1', 'fav2', 'fav3', 'fav1']
    const controlFavColors = ['#003F5C', '#00628F', '#2F4B7C', '#003F5C']
    const testFavColors = favIds.map(id => getNextFavColor(id))
    expect(testFavColors).toEqual(controlFavColors)
  })
})

describe('removeTrailingSlash', () => {
  it('should remove trailing slash', () => {
    const url = 'https://core.app/'
    const result = removeTrailingSlash(url)
    expect(result).toStrictEqual('https://core.app')
  })

  it('should not remove trailing slash if it is not there', () => {
    const url = 'https://core.app'
    const result = removeTrailingSlash(url)
    expect(result).toStrictEqual('https://core.app')
  })
})
