import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import { buildAvailableFields } from './buildAvailableFields'

describe('buildAvailableFields', () => {
  it('returns an empty object when balanceData is undefined', () => {
    expect(buildAvailableFields(undefined, 9, 'AVAX')).toEqual({})
  })

  it('returns an empty object for a token without an available field (EVM)', () => {
    const balanceData = {
      type: TokenType.NATIVE,
      balance: 5n
    } as unknown as LocalTokenWithBalance
    expect(buildAvailableFields(balanceData, 18, 'AVAX')).toEqual({})
  })

  it('returns an empty object when available is present but not a bigint', () => {
    const balanceData = {
      type: TokenType.NATIVE,
      balance: 5n,
      available: undefined
    } as unknown as LocalTokenWithBalance
    expect(buildAvailableFields(balanceData, 9, 'AVAX')).toEqual({})
  })

  it('carries available and recomputes availableDisplayValue at the given decimals', () => {
    const balanceData = {
      type: TokenType.NATIVE,
      balance: 10_000_000_000n,
      available: 3_000_000_000n,
      availableInCurrency: 150,
      availableCurrencyDisplayValue: '$150.00',
      balancePerType: { unlockedUnstaked: 3_000_000_000n }
    } as unknown as LocalTokenWithBalance

    const result = buildAvailableFields(balanceData, 9, 'AVAX')

    expect(result.available).toBe(3_000_000_000n)
    expect(result.availableDisplayValue).toBe('3') // 3e9 at 9 decimals
    expect(result.availableInCurrency).toBe(150)
    expect(result.availableCurrencyDisplayValue).toBe('$150.00')
    expect(result.balancePerType).toEqual({ unlockedUnstaked: 3_000_000_000n })
  })
})
