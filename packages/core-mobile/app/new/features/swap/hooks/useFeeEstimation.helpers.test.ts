import type { Quote } from '../types'
import {
  getFingerprintForFeeEstimationError,
  isQuoteUsable
} from './useFeeEstimation.helpers'

describe('isQuoteUsable', () => {
  const buildQuote = (expiresAt: number): Quote => ({ expiresAt } as Quote)

  it('returns true when expiresAt is comfortably in the future', () => {
    const future = Math.floor(Date.now() / 1000) + 60
    expect(isQuoteUsable(buildQuote(future))).toBe(true)
  })

  it('returns false when expiresAt has already passed', () => {
    const past = Math.floor(Date.now() / 1000) - 60
    expect(isQuoteUsable(buildQuote(past))).toBe(false)
  })

  it('returns false when expiresAt equals current second (matches SDK throw condition `<=`)', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(isQuoteUsable(buildQuote(now))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isQuoteUsable(null)).toBe(false)
  })

  it('returns false when expiresAt is 0 (epoch — long past)', () => {
    expect(isQuoteUsable(buildQuote(0))).toBe(false)
  })

  it('returns false when expiresAt is negative', () => {
    expect(isQuoteUsable(buildQuote(-1))).toBe(false)
  })

  it('returns false when expiresAt is NaN', () => {
    expect(isQuoteUsable(buildQuote(Number.NaN))).toBe(false)
  })
})

describe('getFingerprintForFeeEstimationError', () => {
  it('returns details.data when present', () => {
    const error = { details: { data: '0xeda86850' } } // TargetCallFailed
    expect(getFingerprintForFeeEstimationError(error)).toEqual([
      'useFeeEstimation',
      '0xeda86850'
    ])
  })

  it('falls back to default grouping when details is missing', () => {
    expect(getFingerprintForFeeEstimationError({})).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when details.data is missing', () => {
    expect(getFingerprintForFeeEstimationError({ details: {} })).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when details is null', () => {
    expect(getFingerprintForFeeEstimationError({ details: null })).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when details.data is not a string', () => {
    expect(
      getFingerprintForFeeEstimationError({ details: { data: 1234 } })
    ).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when error is null', () => {
    expect(getFingerprintForFeeEstimationError(null)).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when error is a primitive', () => {
    expect(getFingerprintForFeeEstimationError('oops')).toEqual([
      '{{ default }}'
    ])
  })
})
