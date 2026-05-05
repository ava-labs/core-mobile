import Big from 'big.js'
import { isAmountOverLimit } from './quickSwapsLimits'

describe('isAmountOverLimit', () => {
  it('returns false for unlimited regardless of amount', () => {
    expect(isAmountOverLimit(new Big('1000000'), 'unlimited')).toBe(false)
    expect(isAmountOverLimit(new Big('0'), 'unlimited')).toBe(false)
    expect(isAmountOverLimit(undefined, 'unlimited')).toBe(false)
  })

  it('returns true when amount > limit', () => {
    expect(isAmountOverLimit(new Big('1000.01'), '1000')).toBe(true)
    expect(isAmountOverLimit(new Big('5500'), '5000')).toBe(true)
  })

  it('returns false when amount equals the limit (boundary)', () => {
    expect(isAmountOverLimit(new Big('1000'), '1000')).toBe(false)
    expect(isAmountOverLimit(new Big('5000.0'), '5000')).toBe(false)
  })

  it('returns false when amount is below the limit', () => {
    expect(isAmountOverLimit(new Big('999'), '1000')).toBe(false)
    expect(isAmountOverLimit(new Big('0'), '1000')).toBe(false)
  })

  it('returns true when amountUsd is undefined (fail-safe)', () => {
    expect(isAmountOverLimit(undefined, '1000')).toBe(true)
    expect(isAmountOverLimit(undefined, '50000')).toBe(true)
  })

  it('respects Big.js precision', () => {
    expect(isAmountOverLimit(new Big('1000.000000001'), '1000')).toBe(true)
  })
})
