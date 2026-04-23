import {
  clamp,
  isMajorTick,
  resolvePreset,
  snapToStep,
  validateRange
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
})

describe('resolvePreset', () => {
  it('returns min for "min"', () => {
    expect(resolvePreset('min', 1, 40)).toBe(1)
  })
  it('returns max for "max"', () => {
    expect(resolvePreset('max', 1, 40)).toBe(40)
  })
  it('returns the number as-is for numeric presets', () => {
    expect(resolvePreset(5, 1, 40)).toBe(5)
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
