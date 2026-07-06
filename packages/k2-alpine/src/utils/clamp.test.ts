import { clamp } from './clamp'

describe('clamp', () => {
  it('returns value when inside range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('returns min when below', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })
  it('returns max when above', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
  it('returns the boundary when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })
  it('returns the boundary when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })
})
