import { formatFrequency, formatFrequencyShort } from './formatFrequency'

describe('formatFrequency', () => {
  it('returns "Set" placeholder when undefined', () => {
    expect(formatFrequency(undefined)).toBe('Set')
  })

  it('pluralizes correctly for value > 1', () => {
    expect(formatFrequency({ unit: 'week', value: 4 })).toBe('Every 4 weeks')
    expect(formatFrequency({ unit: 'month', value: 2 })).toBe('Every 2 months')
  })

  it('drops the "1" for value === 1', () => {
    expect(formatFrequency({ unit: 'day', value: 1 })).toBe('Every day')
    expect(formatFrequency({ unit: 'hour', value: 1 })).toBe('Every hour')
    expect(formatFrequency({ unit: 'minute', value: 1 })).toBe('Every minute')
    expect(formatFrequency({ unit: 'week', value: 1 })).toBe('Every week')
    expect(formatFrequency({ unit: 'month', value: 1 })).toBe('Every month')
  })
})

describe('formatFrequencyShort', () => {
  it('drops the "Every" prefix', () => {
    expect(formatFrequencyShort({ unit: 'week', value: 4 })).toBe('4 weeks')
  })

  it('drops the "1" for value === 1', () => {
    expect(formatFrequencyShort({ unit: 'hour', value: 1 })).toBe('hour')
    expect(formatFrequencyShort({ unit: 'day', value: 1 })).toBe('day')
  })
})
