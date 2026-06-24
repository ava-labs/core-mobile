/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceType } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'
import { shouldShowAvalancheCctTwoTxNotice } from './shouldShowAvalancheCctTwoTxNotice'

const cctQuote = (amountIn: bigint): Quote =>
  ({ serviceType: ServiceType.AVALANCHE_CCT, amountIn } as any)

describe('shouldShowAvalancheCctTwoTxNotice', () => {
  it('is true for a CCT quote with non-zero amountIn', () => {
    expect(shouldShowAvalancheCctTwoTxNotice({ quote: cctQuote(1n) })).toBe(
      true
    )
  })

  it('is true regardless of wallet type — mobile prompts per leg for every wallet, including Seedless', () => {
    // Seedless used to be carved out (mirroring core-web). On mobile both legs
    // still go through the in-app approval pipeline, so the notice must show.
    expect(shouldShowAvalancheCctTwoTxNotice({ quote: cctQuote(1n) })).toBe(
      true
    )
  })

  it('is false for a CCT recovery quote (amountIn === 0n)', () => {
    expect(shouldShowAvalancheCctTwoTxNotice({ quote: cctQuote(0n) })).toBe(
      false
    )
  })

  it('is false for non-CCT quotes', () => {
    expect(
      shouldShowAvalancheCctTwoTxNotice({
        quote: { serviceType: ServiceType.MARKR, amountIn: 1n } as any
      })
    ).toBe(false)
  })

  it('is false when quote is null or undefined', () => {
    expect(shouldShowAvalancheCctTwoTxNotice({ quote: null })).toBe(false)
    expect(shouldShowAvalancheCctTwoTxNotice({ quote: undefined })).toBe(false)
  })
})
