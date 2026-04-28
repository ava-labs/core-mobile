import {
  clamp,
  commitDraftText,
  getStepDecimals,
  progressToPoint,
  sanitizeDecimalInput,
  shouldSyncExternalValue,
  snapToStep,
  validateRange,
  valueToProgress
} from './helpers'

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 1, 10)).toBe(5)
  })
  it('clamps below min', () => {
    expect(clamp(-3, 1, 10)).toBe(1)
  })
  it('clamps above max', () => {
    expect(clamp(99, 1, 10)).toBe(10)
  })
})

describe('getStepDecimals', () => {
  it('returns 0 for integer steps', () => {
    expect(getStepDecimals(1)).toBe(0)
    expect(getStepDecimals(10)).toBe(0)
  })
  it('returns decimals for power-of-10 fractional steps', () => {
    expect(getStepDecimals(0.1)).toBe(1)
    expect(getStepDecimals(0.01)).toBe(2)
    expect(getStepDecimals(0.001)).toBe(3)
  })
  it('returns decimals for non-power-of-10 fractional steps', () => {
    expect(getStepDecimals(0.25)).toBe(2)
    expect(getStepDecimals(0.125)).toBe(3)
  })
  it('guards against bad inputs', () => {
    expect(getStepDecimals(0)).toBe(0)
    expect(getStepDecimals(-1)).toBe(0)
    expect(getStepDecimals(Number.NaN)).toBe(0)
  })
})

describe('snapToStep', () => {
  it('snaps to nearest step', () => {
    expect(snapToStep(5.03, 0.01)).toBeCloseTo(5.03, 2)
    expect(snapToStep(5.034, 0.01)).toBeCloseTo(5.03, 2)
    expect(snapToStep(5.036, 0.01)).toBeCloseTo(5.04, 2)
  })
  it('handles non-power-of-10 steps without rounding drift', () => {
    expect(snapToStep(0.25, 0.25)).toBe(0.25)
    expect(snapToStep(0.37, 0.25)).toBe(0.25)
    expect(snapToStep(0.39, 0.25)).toBe(0.5)
  })
})

describe('progressToPoint', () => {
  const arc = { cx: 100, cy: 100, radius: 50 }
  it('returns the left end at progress 0', () => {
    const { x, y } = progressToPoint({ ...arc, progress: 0 })
    expect(x).toBeCloseTo(50)
    expect(y).toBeCloseTo(100)
  })
  it('returns the top at progress 0.5', () => {
    const { x, y } = progressToPoint({ ...arc, progress: 0.5 })
    expect(x).toBeCloseTo(100)
    expect(y).toBeCloseTo(50)
  })
  it('returns the right end at progress 1', () => {
    const { x, y } = progressToPoint({ ...arc, progress: 1 })
    expect(x).toBeCloseTo(150)
    expect(y).toBeCloseTo(100)
  })
})

describe('valueToProgress', () => {
  it('maps value to progress linearly', () => {
    expect(valueToProgress(0, 100)).toBe(0)
    expect(valueToProgress(50, 100)).toBe(0.5)
    expect(valueToProgress(100, 100)).toBe(1)
  })
  it('clamps out-of-range values', () => {
    expect(valueToProgress(-10, 100)).toBe(0)
    expect(valueToProgress(110, 100)).toBe(1)
  })
  it('returns 0 for non-positive max', () => {
    expect(valueToProgress(5, 0)).toBe(0)
  })
})

describe('validateRange', () => {
  // Suppress warnings during tests so failing cases don't pollute output.
  let warn: jest.SpyInstance
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    warn.mockRestore()
  })

  it('accepts a well-formed range unchanged', () => {
    expect(validateRange({ max: 100, step: 0.01 })).toEqual({
      max: 100,
      step: 0.01,
      isValid: true
    })
  })
  it('flags invalid when max <= 0', () => {
    expect(validateRange({ max: 0, step: 1 }).isValid).toBe(false)
    expect(validateRange({ max: -5, step: 1 }).isValid).toBe(false)
  })
  it('normalizes a non-positive step to 0.01', () => {
    expect(validateRange({ max: 100, step: 0 }).step).toBe(0.01)
  })
  it('normalizes a step larger than max to 0.01', () => {
    expect(validateRange({ max: 5, step: 10 }).step).toBe(0.01)
  })
})

describe('shouldSyncExternalValue', () => {
  const base = { max: 100, step: 1 }
  it('skips when active', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 50,
      currentValue: 10,
      isActive: true
    })
    expect(r.sync).toBe(false)
  })
  it('skips when diff is within one step (echo)', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 10,
      currentValue: 10,
      isActive: false
    })
    expect(r.sync).toBe(false)
  })
  it('syncs when the external value is clearly different', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 80,
      currentValue: 10,
      isActive: false
    })
    expect(r).toEqual({ sync: true, target: 80 })
  })
  it('clamps the target into [0, max]', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 500,
      currentValue: 10,
      isActive: false
    })
    expect(r).toEqual({ sync: true, target: 100 })
  })
})

describe('sanitizeDecimalInput', () => {
  it('strips non-digit/non-dot characters', () => {
    expect(sanitizeDecimalInput('abc1.5xyz', 100)).toBe('1.5')
    expect(sanitizeDecimalInput('$4.50', 100)).toBe('4.50')
  })
  it('collapses multiple dots to the first', () => {
    expect(sanitizeDecimalInput('1.2.3', 100)).toBe('1.23')
  })
  it('caps the value at max', () => {
    expect(sanitizeDecimalInput('999', 100)).toBe('100')
  })
  it('keeps partial "." during typing', () => {
    expect(sanitizeDecimalInput('.', 100)).toBe('.')
    expect(sanitizeDecimalInput('4.', 100)).toBe('4.')
  })
  it('returns empty for empty input', () => {
    expect(sanitizeDecimalInput('', 100)).toBe('')
  })
})

describe('commitDraftText', () => {
  it('returns null for empty draft', () => {
    expect(commitDraftText('', 100)).toBeNull()
  })
  it('returns null for non-numeric drafts', () => {
    expect(commitDraftText('abc', 100)).toBeNull()
    expect(commitDraftText('.', 100)).toBeNull()
  })
  it('clamps to [0, max] without snapping to step', () => {
    expect(commitDraftText('-50', 100)).toBe(0)
    expect(commitDraftText('500', 100)).toBe(100)
    // Manual input preserves the typed precision regardless of step.
    expect(commitDraftText('4.567', 100)).toBe(4.567)
    expect(commitDraftText('9999.42', 10000)).toBe(9999.42)
  })
})
