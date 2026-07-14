/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceType } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'
import { shouldShowRecoveredFundsNotice } from './shouldShowRecoveredFundsNotice'

const cctQuote = (recoveredAmountOut: bigint | undefined): Quote =>
  ({ serviceType: ServiceType.AVALANCHE_CCT, recoveredAmountOut } as any)

describe('shouldShowRecoveredFundsNotice', () => {
  it('is true when recoveredAmountOut is positive (stuck funds swept in)', () => {
    expect(shouldShowRecoveredFundsNotice({ quote: cctQuote(500n) })).toBe(true)
  })

  it('is false when recoveredAmountOut is 0n (nothing recovered)', () => {
    expect(shouldShowRecoveredFundsNotice({ quote: cctQuote(0n) })).toBe(false)
  })

  it('is false when recoveredAmountOut is absent', () => {
    expect(shouldShowRecoveredFundsNotice({ quote: cctQuote(undefined) })).toBe(
      false
    )
  })

  it('is false when quote is null or undefined', () => {
    expect(shouldShowRecoveredFundsNotice({ quote: null })).toBe(false)
    expect(shouldShowRecoveredFundsNotice({ quote: undefined })).toBe(false)
  })

  it('is false for a non-CCT quote even when recoveredAmountOut is set', () => {
    expect(
      shouldShowRecoveredFundsNotice({
        quote: {
          serviceType: ServiceType.MARKR,
          recoveredAmountOut: 500n
        } as any
      })
    ).toBe(false)
  })
})
