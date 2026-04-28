import {
  clamp,
  commitDraftText,
  formatNumberForInput,
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
  it('snaps to nearest step from min', () => {
    expect(snapToStep(5.03, 0, 0.01)).toBeCloseTo(5.03, 2)
    expect(snapToStep(5.034, 0, 0.01)).toBeCloseTo(5.03, 2)
    expect(snapToStep(5.036, 0, 0.01)).toBeCloseTo(5.04, 2)
  })
  it('handles non-power-of-10 steps without rounding drift', () => {
    expect(snapToStep(1.25, 1, 0.25)).toBe(1.25)
    expect(snapToStep(1.37, 1, 0.25)).toBe(1.25)
    expect(snapToStep(1.39, 1, 0.25)).toBe(1.5)
  })
})

describe('progressToPoint', () => {
  it('returns the left end at progress 0', () => {
    const { x, y } = progressToPoint(0, 100, 100, 50)
    expect(x).toBeCloseTo(50)
    expect(y).toBeCloseTo(100)
  })
  it('returns the top at progress 0.5', () => {
    const { x, y } = progressToPoint(0.5, 100, 100, 50)
    expect(x).toBeCloseTo(100)
    expect(y).toBeCloseTo(50)
  })
  it('returns the right end at progress 1', () => {
    const { x, y } = progressToPoint(1, 100, 100, 50)
    expect(x).toBeCloseTo(150)
    expect(y).toBeCloseTo(100)
  })
})

describe('valueToProgress', () => {
  it('maps value to progress linearly', () => {
    expect(valueToProgress(0, 0, 100)).toBe(0)
    expect(valueToProgress(50, 0, 100)).toBe(0.5)
    expect(valueToProgress(100, 0, 100)).toBe(1)
  })
  it('clamps out-of-range values', () => {
    expect(valueToProgress(-10, 0, 100)).toBe(0)
    expect(valueToProgress(110, 0, 100)).toBe(1)
  })
  it('returns 0 when range is degenerate', () => {
    expect(valueToProgress(5, 10, 10)).toBe(0)
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
    expect(validateRange({ min: 0, max: 100, step: 0.01 })).toEqual({
      min: 0,
      max: 100,
      step: 0.01,
      isValid: true
    })
  })
  it('flags invalid when min >= max', () => {
    const r = validateRange({ min: 100, max: 0, step: 1 })
    expect(r.isValid).toBe(false)
  })
  it('normalizes a non-positive step to 0.01', () => {
    const r = validateRange({ min: 0, max: 100, step: 0 })
    expect(r.step).toBe(0.01)
  })
  it('normalizes a step larger than range to 0.01', () => {
    const r = validateRange({ min: 0, max: 5, step: 10 })
    expect(r.step).toBe(0.01)
  })
})

describe('shouldSyncExternalValue', () => {
  const base = { min: 0, max: 100, step: 1 }
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
  it('clamps the target into [min, max]', () => {
    const r = shouldSyncExternalValue({
      ...base,
      value: 500,
      currentValue: 10,
      isActive: false
    })
    expect(r).toEqual({ sync: true, target: 100 })
  })
})

describe('formatNumberForInput', () => {
  it('formats with the given decimal count', () => {
    expect(formatNumberForInput(4.5, 2)).toBe('4.50')
    expect(formatNumberForInput(4.567, 2)).toBe('4.57')
  })
  it('returns a rounded integer when decimals is 0', () => {
    expect(formatNumberForInput(4.6, 0)).toBe('5')
    expect(formatNumberForInput(4.4, 0)).toBe('4')
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
  const base = { min: 0, max: 100 }
  it('returns null for empty draft', () => {
    expect(commitDraftText('', base)).toBeNull()
  })
  it('returns null for non-numeric drafts', () => {
    expect(commitDraftText('abc', base)).toBeNull()
    expect(commitDraftText('.', base)).toBeNull()
  })
  it('clamps to range without snapping to step', () => {
    expect(commitDraftText('-50', base)).toBe(0)
    expect(commitDraftText('500', base)).toBe(100)
    // Manual input preserves the typed precision regardless of step.
    expect(commitDraftText('4.567', base)).toBe(4.567)
    expect(commitDraftText('9999.42', { min: 0, max: 10000 })).toBe(9999.42)
  })
})
