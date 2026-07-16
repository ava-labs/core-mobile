import { HYPERLIQUID_PERPS_BUILDER_FEE_MAX_TENTHS_BPS } from '@avalabs/perps-sdk'

// The hook module imports the app networking stack at load; stub it so the pure
// `markrFeeToHyperliquidTenthsBps` helper can be exercised in isolation.
jest.mock('react-native-nitro-fetch', () => ({ fetch: jest.fn() }))
jest.mock('react-native-config', () => ({ __esModule: true, default: {} }))

import { markrFeeToHyperliquidTenthsBps } from './useMarkrPartnerInfo'

describe('markrFeeToHyperliquidTenthsBps', () => {
  it('rounds a valid fee to the nearest tenths-bps', () => {
    expect(markrFeeToHyperliquidTenthsBps(45)).toBe(45)
    expect(markrFeeToHyperliquidTenthsBps(45.4)).toBe(45)
    expect(markrFeeToHyperliquidTenthsBps(45.6)).toBe(46)
  })

  it('returns 0 for NaN / infinite / negative payloads', () => {
    expect(markrFeeToHyperliquidTenthsBps(Number.NaN)).toBe(0)
    expect(markrFeeToHyperliquidTenthsBps(Number.POSITIVE_INFINITY)).toBe(0)
    expect(markrFeeToHyperliquidTenthsBps(-1)).toBe(0)
  })

  it('caps at Hyperliquid’s protocol max so a bad payload can’t overcharge', () => {
    expect(markrFeeToHyperliquidTenthsBps(1000)).toBe(
      HYPERLIQUID_PERPS_BUILDER_FEE_MAX_TENTHS_BPS
    )
    expect(
      markrFeeToHyperliquidTenthsBps(
        HYPERLIQUID_PERPS_BUILDER_FEE_MAX_TENTHS_BPS + 50
      )
    ).toBe(HYPERLIQUID_PERPS_BUILDER_FEE_MAX_TENTHS_BPS)
  })

  it('leaves a fee at exactly the max untouched', () => {
    expect(
      markrFeeToHyperliquidTenthsBps(
        HYPERLIQUID_PERPS_BUILDER_FEE_MAX_TENTHS_BPS
      )
    ).toBe(HYPERLIQUID_PERPS_BUILDER_FEE_MAX_TENTHS_BPS)
  })
})
