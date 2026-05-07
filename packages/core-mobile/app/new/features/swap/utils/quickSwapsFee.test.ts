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

  it('returns the slow tier for "low"', () => {
    expect(mapFeeSettingToGasSettings('low', fees)).toEqual(fees.slow)
  })

  it('returns the normal tier for "medium"', () => {
    expect(mapFeeSettingToGasSettings('medium', fees)).toEqual(fees.normal)
  })

  it('returns the fast tier for "high"', () => {
    expect(mapFeeSettingToGasSettings('high', fees)).toEqual(fees.fast)
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
