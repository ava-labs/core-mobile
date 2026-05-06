import { getStepDecimals } from '../../utils/getStepDecimals'
import {
  commitDraftText,
  formatNumber,
  isMajorTick,
  sanitizeTypedText,
  shouldSyncExternalValue,
  snapToStep,
  validateRange
} from './helpers'

describe('snapToStep', () => {
  it('snaps to the nearest step from min', () => {
    expect(snapToStep(1.3, 1, 0.2)).toBeCloseTo(1.4)
  })
  it('returns min when value equals min', () => {
    expect(snapToStep(1, 1, 0.2)).toBe(1)
  })
  it('handles integer steps', () => {
    expect(snapToStep(4.6, 1, 1)).toBe(5)
  })
  it('rounds halves up', () => {
    expect(snapToStep(1.5, 1, 1)).toBe(2)
  })
  it('handles non-power-of-10 steps (0.25) without rounding drift', () => {
    expect(snapToStep(1.25, 1, 0.25)).toBe(1.25)
    expect(snapToStep(1.37, 1, 0.25)).toBe(1.25)
    expect(snapToStep(1.39, 1, 0.25)).toBe(1.5)
  })
  it('handles 0.125 step precision', () => {
    expect(snapToStep(1.125, 1, 0.125)).toBe(1.125)
    expect(snapToStep(1.2, 1, 0.125)).toBe(1.25)
  })
})

describe('getStepDecimals', () => {
  it('returns 0 for integer steps', () => {
    expect(getStepDecimals(1)).toBe(0)
    expect(getStepDecimals(2)).toBe(0)
    expect(getStepDecimals(10)).toBe(0)
  })
  it('returns decimals for power-of-10 fractional steps', () => {
    expect(getStepDecimals(0.1)).toBe(1)
    expect(getStepDecimals(0.01)).toBe(2)
    expect(getStepDecimals(0.001)).toBe(3)
  })
  it('returns decimals for non-power-of-10 fractional steps', () => {
    expect(getStepDecimals(0.2)).toBe(1)
    expect(getStepDecimals(0.25)).toBe(2)
    expect(getStepDecimals(0.125)).toBe(3)
    expect(getStepDecimals(0.0625)).toBe(4)
  })
  it('guards against bad inputs', () => {
    expect(getStepDecimals(0)).toBe(0)
    expect(getStepDecimals(-1)).toBe(0)
    expect(getStepDecimals(Number.NaN)).toBe(0)
    expect(getStepDecimals(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('isMajorTick', () => {
  it('is major at every step when step >= 1', () => {
    expect(isMajorTick(5, 1)).toBe(true)
    expect(isMajorTick(10, 5)).toBe(true)
  })
  it('is major only at integers when step < 1', () => {
    expect(isMajorTick(2, 0.2)).toBe(true)
    expect(isMajorTick(2.4, 0.2)).toBe(false)
  })
})

describe('validateRange', () => {
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('accepts a valid range', () => {
    const r = validateRange({ min: 1, max: 40, step: 0.2 })
    expect(r).toEqual({ min: 1, max: 40, step: 0.2, isValid: true })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('marks invalid when min >= max', () => {
    const r = validateRange({ min: 5, max: 5, step: 1 })
    expect(r.isValid).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('falls back step to 1 when step <= 0', () => {
    const r = validateRange({ min: 1, max: 10, step: 0 })
    expect(r.step).toBe(1)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('falls back step to 1 when step > range', () => {
    const r = validateRange({ min: 1, max: 10, step: 100 })
    expect(r.step).toBe(1)
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('formatNumber', () => {
  it('returns integer form when decimals is 0', () => {
    expect(formatNumber(3, 0)).toBe('3')
    expect(formatNumber(40, 0)).toBe('40')
  })
  it('pads trailing zeros when decimals > 0', () => {
    expect(formatNumber(3, 1)).toBe('3.0')
    expect(formatNumber(3.2, 1)).toBe('3.2')
    expect(formatNumber(17.4, 1)).toBe('17.4')
  })
  it('truncates extra decimals to the requested precision', () => {
    expect(formatNumber(3.456, 1)).toBe('3.5')
    expect(formatNumber(3.456, 2)).toBe('3.46')
  })
})

describe('sanitizeTypedText', () => {
  const opts = { integersOnly: false, max: 40 }
  const intOpts = { integersOnly: true, max: 40 }

  it('passes plain digit input through unchanged', () => {
    expect(sanitizeTypedText('15', opts)).toBe('15')
  })
  it('allows a trailing dot during typing when decimals are enabled', () => {
    expect(sanitizeTypedText('1.', opts)).toBe('1.')
  })
  it('caps the text at max when parsed value exceeds max', () => {
    expect(sanitizeTypedText('45', opts)).toBe('40')
    expect(sanitizeTypedText('100', opts)).toBe('40')
  })
  it('keeps values below max unchanged', () => {
    expect(sanitizeTypedText('39.8', opts)).toBe('39.8')
  })
  it('does not clamp values below min (user may still be typing)', () => {
    expect(sanitizeTypedText('0', opts)).toBe('0')
  })
  it('strips non-digit characters when integersOnly', () => {
    expect(sanitizeTypedText('1.4', intOpts)).toBe('14')
    expect(sanitizeTypedText('a2b3', intOpts)).toBe('23')
  })
  it('caps after stripping when integersOnly', () => {
    expect(sanitizeTypedText('4.5', intOpts)).toBe('40') // "45" after strip, capped
  })
  it('returns empty when text is empty', () => {
    expect(sanitizeTypedText('', opts)).toBe('')
    expect(sanitizeTypedText('', intOpts)).toBe('')
  })
})

describe('commitDraftText', () => {
  const range = { min: 1, max: 40, step: 0.2 }

  it('returns null for empty draft', () => {
    expect(commitDraftText('', range)).toBeNull()
    expect(commitDraftText('   ', range)).toBeNull()
  })
  it('returns null for non-numeric drafts', () => {
    expect(commitDraftText('abc', range)).toBeNull()
  })
  it('clamps to min when draft is below range', () => {
    expect(commitDraftText('0.5', range)).toBe(1)
    expect(commitDraftText('-5', range)).toBe(1)
  })
  it('clamps to max when draft is above range', () => {
    expect(commitDraftText('100', range)).toBe(40)
  })
  it('snaps to the nearest step inside the range', () => {
    expect(commitDraftText('3.3', range)).toBeCloseTo(3.2)
    expect(commitDraftText('3.5', range)).toBeCloseTo(3.6)
  })
  it('handles integer step', () => {
    expect(commitDraftText('17.4', { min: 1, max: 40, step: 1 })).toBe(17)
    expect(commitDraftText('17.6', { min: 1, max: 40, step: 1 })).toBe(18)
  })
  it('accepts a partial decimal and commits to nearest snap', () => {
    expect(commitDraftText('3.', range)).toBe(3)
  })
})

describe('shouldSyncExternalValue', () => {
  const base = { min: 1, max: 40, step: 1 }

  it('skips while the wheel is active (drag/decay/settle)', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 10,
      currentValue: 2,
      isActive: true
    })
    expect(r.sync).toBe(false)
  })

  it('skips when the incoming value is within one step (own echo)', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 2,
      currentValue: 1.5,
      isActive: false
    })
    expect(r.sync).toBe(false)
  })

  it('also skips at exactly one step away (stale onChange echo)', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 3,
      currentValue: 2,
      isActive: false
    })
    expect(r.sync).toBe(false)
  })

  it('syncs when the external value is clearly different', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 10,
      currentValue: 2,
      isActive: false
    })
    expect(r).toEqual({ sync: true, target: 10 })
  })

  it('clamps the target into [min, max]', () => {
    const below = shouldSyncExternalValue({
      ...base,
      value: -10,
      currentValue: 20,
      isActive: false
    })
    expect(below).toEqual({ sync: true, target: 1 })
    const above = shouldSyncExternalValue({
      ...base,
      value: 100,
      currentValue: 2,
      isActive: false
    })
    expect(above).toEqual({ sync: true, target: 40 })
  })

  it('skips when clamped target is within step of currentValue', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 100, // clamped → 40
      currentValue: 39,
      isActive: false
    })
    expect(r.sync).toBe(false)
  })
})
