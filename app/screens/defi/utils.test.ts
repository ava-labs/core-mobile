import { DeFiPortfolioItem } from 'services/defi/types'
import MOCK_DATA from 'tests/fixtures/protocolDetailsData.json'
import { mapPortfolioItems } from './utils'

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
