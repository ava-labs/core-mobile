import { feeSettingToTier, mapFeeSettingToGasSettings } from './quickSwapsFee'

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
