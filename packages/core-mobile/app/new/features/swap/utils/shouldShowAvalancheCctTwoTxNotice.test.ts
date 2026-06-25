/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceType } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'
import { shouldShowAvalancheCctTwoTxNotice } from './shouldShowAvalancheCctTwoTxNotice'

const cctQuote = (amountIn: bigint): Quote =>
  ({ serviceType: ServiceType.AVALANCHE_CCT, amountIn } as any)

describe('shouldShowAvalancheCctTwoTxNotice', () => {
  it('is true for a CCT quote with non-zero amountIn (every wallet type, incl. Seedless)', () => {
    // Seedless used to be carved out (mirroring core-web), but on mobile both
    // legs go through the in-app approval pipeline, so the notice must show
    // regardless of wallet type — hence no wallet param.
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
