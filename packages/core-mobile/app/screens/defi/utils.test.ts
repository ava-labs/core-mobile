import { DeFiPortfolioItem, DeFiProtocolInformation } from 'services/defi/types'
import MOCK_DATA from 'tests/fixtures/defi/protocolDetailsData.json'
import MOCK_PROTOCOL_INFORMATION_DATA from 'tests/fixtures/defi/protocolInformationListData.json'
import {
  getTopDefiProtocolInformationList,
  mapPortfolioItems,
  sortDeFiProtocolInformationListByTvl
} from './utils'

describe('mapPortfolioItems', () => {
  it('should have returned item with highest net usd value from sorted item group', () => {
    const groupedItem = mapPortfolioItems(
      MOCK_DATA as unknown as DeFiPortfolioItem[]
    )
    expect(groupedItem[0]?.totalUsdValue).toStrictEqual(1.803)
  })
  it('should have returned correct count of grouped items', () => {
    const groupedItem = mapPortfolioItems(
      MOCK_DATA as unknown as DeFiPortfolioItem[]
    )
    expect(groupedItem.length).toStrictEqual(4)
  })
  it('should have return correct number of grouped Liquidity Pool items', () => {
    const groupedItem = mapPortfolioItems(
      MOCK_DATA as unknown as DeFiPortfolioItem[]
    )
    expect(groupedItem[0]?.name).toStrictEqual('Liquidity Pool')
    expect(groupedItem[0]?.items.length).toStrictEqual(2)
  })
})

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
