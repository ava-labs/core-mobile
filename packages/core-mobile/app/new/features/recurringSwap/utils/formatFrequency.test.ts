import { formatFrequency, formatFrequencyShort } from './formatFrequency'

describe('formatFrequency', () => {
  it('returns "Set" placeholder when undefined', () => {
    expect(formatFrequency(undefined)).toBe('Set')
  })

  it('pluralizes correctly for value > 1', () => {
    expect(formatFrequency({ unit: 'week', value: 4 })).toBe('Every 4 weeks')
    expect(formatFrequency({ unit: 'month', value: 2 })).toBe('Every 2 months')
  })

  it('uses singular for value === 1', () => {
    expect(formatFrequency({ unit: 'day', value: 1 })).toBe('Every 1 day')
  })
})

describe('formatFrequencyShort', () => {
  it('drops the "Every" prefix', () => {
    expect(formatFrequencyShort({ unit: 'week', value: 4 })).toBe('4 weeks')
    expect(formatFrequencyShort({ unit: 'hour', value: 1 })).toBe('1 hour')
  })
})
