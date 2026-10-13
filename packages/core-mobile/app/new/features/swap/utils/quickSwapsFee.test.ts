import type { NetworkFees } from '@avalabs/vm-module-types'
import {
  buildFusionGasSettings,
  feeSettingToTier,
  mapFeeSettingToGasSettings
} from './quickSwapsFee'

describe('feeSettingToTier', () => {
  it.each([
    ['low', 'slow'],
    ['medium', 'normal'],
    ['high', 'fast']
  ] as const)('maps %s -> %s', (input, expected) => {
    expect(feeSettingToTier(input)).toBe(expected)
  })
})

describe('mapFeeSettingToGasSettings', () => {
  const fees = {
    slow: { maxFeePerGas: 100n, maxPriorityFeePerGas: 1n },
    normal: { maxFeePerGas: 200n, maxPriorityFeePerGas: 2n },
    fast: { maxFeePerGas: 500n, maxPriorityFeePerGas: 5n }
  }

  it.each([
    ['low', 'slow'],
    ['medium', 'normal'],
    ['high', 'fast']
  ] as const)('returns the %s tier when level is %s', (level, tier) => {
    expect(mapFeeSettingToGasSettings(level, fees)).toEqual(fees[tier])
  })

  it('returns undefined when suggestedFees is missing', () => {
    expect(mapFeeSettingToGasSettings('medium', undefined)).toBeUndefined()
  })

  it('returns undefined when the picked tier is missing', () => {
    expect(
      mapFeeSettingToGasSettings('high', { slow: fees.slow })
    ).toBeUndefined()
  })
})

describe('buildFusionGasSettings', () => {
  const networkFees: NetworkFees = {
    low: { maxFeePerGas: 100n, maxPriorityFeePerGas: 1n },
    medium: { maxFeePerGas: 200n, maxPriorityFeePerGas: 2n },
    high: { maxFeePerGas: 500n, maxPriorityFeePerGas: 5n },
    isFixedFee: false
  }

  it('layers the EIP-1559 tier override on when applyTierOverride is true', () => {
    expect(
      buildFusionGasSettings({
        networkFees,
        feeSetting: 'medium',
        estimateGasMarginBps: 300,
        applyTierOverride: true
      })
    ).toEqual({
      estimateGasMarginBps: 300,
      maxFeePerGas: 200n,
      maxPriorityFeePerGas: 2n
    })
  })

  it('honors the selected fee tier (high -> fast/high)', () => {
    expect(
      buildFusionGasSettings({
        networkFees,
        feeSetting: 'high',
        estimateGasMarginBps: 300,
        applyTierOverride: true
      })
    ).toEqual({
      estimateGasMarginBps: 300,
      maxFeePerGas: 500n,
      maxPriorityFeePerGas: 5n
    })
  })

  it('returns margin-only settings when applyTierOverride is false', () => {
    expect(
      buildFusionGasSettings({
        networkFees,
        feeSetting: 'medium',
        estimateGasMarginBps: 300,
        applyTierOverride: false
      })
    ).toEqual({ estimateGasMarginBps: 300 })
  })

  // Cold start: networkFees not loaded yet. Falls back to margin-only, which
  // is exactly the case that trips the recurring batch guard — documented so a
  // regression here is understood as "recurring goes sequential until fees load".
  it('returns margin-only settings when networkFees is undefined', () => {
    expect(
      buildFusionGasSettings({
        networkFees: undefined,
        feeSetting: 'medium',
        estimateGasMarginBps: 300,
        applyTierOverride: true
      })
    ).toEqual({ estimateGasMarginBps: 300 })
  })
})
