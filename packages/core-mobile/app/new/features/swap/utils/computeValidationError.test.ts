import { LocalTokenWithBalance } from 'store/balance'
import { computeValidationError } from './computeValidationError'

const avax = {
  decimals: 9,
  symbol: 'AVAX',
  balance: 10_000_000_000n
} as unknown as LocalTokenWithBalance

describe('computeValidationError', () => {
  it('returns null while the amount is still undefined (token just changed)', () => {
    expect(
      computeValidationError({
        fromTokenValue: undefined,
        debouncedFromTokenValue: undefined,
        minimumTransferAmount: null,
        fromToken: avax,
        feeValidationError: null
      })
    ).toBeNull()
  })

  it('errors with "enter an amount" for a 0 amount', () => {
    const error = computeValidationError({
      fromTokenValue: 0n,
      debouncedFromTokenValue: 0n,
      minimumTransferAmount: null,
      fromToken: avax,
      feeValidationError: null
    })
    expect(error?.message).toBe('Please enter an amount')
  })

  it('allows a 0 amount when allowZeroAmount is set (CCT recovery)', () => {
    expect(
      computeValidationError({
        fromTokenValue: 0n,
        debouncedFromTokenValue: 0n,
        minimumTransferAmount: null,
        fromToken: avax,
        feeValidationError: null,
        allowZeroAmount: true
      })
    ).toBeNull()
  })

  it('flags exceeding balance', () => {
    const error = computeValidationError({
      fromTokenValue: 99_000_000_000n,
      debouncedFromTokenValue: 99_000_000_000n,
      minimumTransferAmount: null,
      fromToken: avax,
      feeValidationError: null
    })
    expect(error).not.toBeNull()
  })
})
