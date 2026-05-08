import {
  computeMaxTravel,
  normalizeThreshold,
  crossedThreshold,
  activeSide
} from './helpers'

describe('computeMaxTravel', () => {
  it('subtracts thumb size and padding from track width', () => {
    // 300 track, 50 thumb, 7 padding each side → 300 - 50 - 14 = 236
    expect(
      computeMaxTravel({ trackWidth: 300, thumbSize: 50, padding: 7 })
    ).toBe(236)
  })
  it('returns 0 when track is smaller than thumb + padding', () => {
    expect(
      computeMaxTravel({ trackWidth: 40, thumbSize: 50, padding: 7 })
    ).toBe(0)
  })
})

describe('normalizeThreshold', () => {
  it('defaults to 0.9 when undefined', () => {
    expect(normalizeThreshold(undefined)).toBe(0.9)
  })
  it('clamps below 0 to 0', () => {
    expect(normalizeThreshold(-0.5)).toBe(0)
  })
  it('clamps above 1 to 1', () => {
    expect(normalizeThreshold(1.5)).toBe(1)
  })
  it('passes through valid values', () => {
    expect(normalizeThreshold(0.75)).toBe(0.75)
  })
})

describe('crossedThreshold', () => {
  it('is true when |translateX| / maxTravel >= threshold', () => {
    expect(
      crossedThreshold({ translateX: 90, maxTravel: 100, threshold: 0.9 })
    ).toBe(true)
  })
  it('is true for negative translate at same magnitude (bidirectional)', () => {
    expect(
      crossedThreshold({ translateX: -95, maxTravel: 100, threshold: 0.9 })
    ).toBe(true)
  })
  it('is false when below threshold', () => {
    expect(
      crossedThreshold({ translateX: 50, maxTravel: 100, threshold: 0.9 })
    ).toBe(false)
  })
  it('is false when maxTravel is 0', () => {
    expect(
      crossedThreshold({ translateX: 0, maxTravel: 0, threshold: 0.9 })
    ).toBe(false)
  })
  it('is false when maxTravel is negative', () => {
    expect(
      crossedThreshold({ translateX: 10, maxTravel: -5, threshold: 0.5 })
    ).toBe(false)
  })
  it('is true at exactly the threshold boundary', () => {
    expect(
      crossedThreshold({ translateX: 100, maxTravel: 100, threshold: 1 })
    ).toBe(true)
  })
})

describe('activeSide', () => {
  it('returns "right" for positive translate', () => {
    expect(activeSide(10)).toBe('right')
  })
  it('returns "left" for negative translate', () => {
    expect(activeSide(-10)).toBe('left')
  })
  it('returns null for zero', () => {
    expect(activeSide(0)).toBe(null)
  })
})
