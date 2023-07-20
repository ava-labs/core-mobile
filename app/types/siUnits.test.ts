import {
  convertToMilliSeconds,
  convertToSeconds,
  MilliSeconds,
  Seconds
} from 'types/siUnits'

describe('siUnits', () => {
  it('converts seconds to milliseconds', () => {
    expect(convertToMilliSeconds(100n as Seconds)).toBe(100000n)
  })
  it('converts milliseconds to seconds', () => {
    expect(convertToSeconds(1000n as MilliSeconds)).toBe(1n)
  })
})
