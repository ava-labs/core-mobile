/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceType } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'
import { shouldShowAvalancheCctTwoTxNotice } from './shouldShowAvalancheCctTwoTxNotice'

const cctQuote = (amountIn: bigint): Quote =>
  ({ serviceType: ServiceType.AVALANCHE_CCT, amountIn } as any)

describe('shouldShowAvalancheCctTwoTxNotice', () => {
  it('is true for a CCT quote with non-zero amountIn on a non-seedless wallet', () => {
    expect(
      shouldShowAvalancheCctTwoTxNotice({
        quote: cctQuote(1n),
        isSeedlessWallet: false
      })
    ).toBe(true)
  })

  it('is false for a CCT recovery quote (amountIn === 0n)', () => {
    expect(
      shouldShowAvalancheCctTwoTxNotice({
        quote: cctQuote(0n),
        isSeedlessWallet: false
      })
    ).toBe(false)
  })

  it('is false on a seedless wallet — Seedless abstracts the dual signing', () => {
    expect(
      shouldShowAvalancheCctTwoTxNotice({
        quote: cctQuote(1n),
        isSeedlessWallet: true
      })
    ).toBe(false)
  })

  it('is false for non-CCT quotes', () => {
    expect(
      shouldShowAvalancheCctTwoTxNotice({
        quote: { serviceType: ServiceType.MARKR, amountIn: 1n } as any,
        isSeedlessWallet: false
      })
    ).toBe(false)
  })

  it('is false when quote is null or undefined', () => {
    expect(
      shouldShowAvalancheCctTwoTxNotice({
        quote: null,
        isSeedlessWallet: false
      })
    ).toBe(false)
    expect(
      shouldShowAvalancheCctTwoTxNotice({
        quote: undefined,
        isSeedlessWallet: false
      })
    ).toBe(false)
  })
})
