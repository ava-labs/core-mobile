import { CurrencyItem, DetailItemType } from '@avalabs/vm-module-types'
import { getDetailItemLabel } from './getDetailItemLabel'

const currencyItem = (overrides: Partial<CurrencyItem>): CurrencyItem => ({
  type: DetailItemType.CURRENCY,
  label: 'Fee Amount',
  value: 1n,
  maxDecimals: 9,
  symbol: 'AVAX',
  ...overrides
})

describe('getDetailItemLabel', () => {
  it('keeps the casing of asset labels', () => {
    expect(
      getDetailItemLabel(currencyItem({ label: 'AVAX', isAssetLabel: true }))
    ).toBe('AVAX')
    expect(
      getDetailItemLabel(
        currencyItem({ label: 'USDC Token', isAssetLabel: true })
      )
    ).toBe('USDC Token')
  })

  it('returns other currency labels in sentence case', () => {
    expect(getDetailItemLabel(currencyItem({}))).toBe('Fee amount')
  })

  it('returns labels of other items in sentence case', () => {
    expect(
      getDetailItemLabel({
        type: DetailItemType.DATE,
        label: 'Start Date',
        value: '0'
      })
    ).toBe('Start date')
  })
})
