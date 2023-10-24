import { DeFiProtocolInformation } from 'services/inAppBrowser/types'
import MOCK_PROTOCOL_INFORMATION_DATA from 'tests/fixtures/inAppBrowser/protocolInformationListData.json'
import {
  getTopDefiProtocolInformationList,
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
