import limitInput from 'screens/earn/limitInput'
import { AvaxXP } from 'types/AvaxXP'

describe('limitInput', () => {
  it('should not limit whole number portion', () => {
    expect(limitInput(AvaxXP.fromNanoAvax(123e9))).toEqual(
      AvaxXP.fromNanoAvax(123e9)
    )
    expect(limitInput(AvaxXP.fromNanoAvax(1234567890e9))).toEqual(
      AvaxXP.fromNanoAvax(1234567890e9)
    )
    expect(limitInput(AvaxXP.fromNanoAvax(1234567890.123e9))).toEqual(
      AvaxXP.fromNanoAvax(1234567890e9)
    )
  })

  it('should trim decimals to total of 7 digits (combined with whole part)', () => {
    expect(limitInput(AvaxXP.fromNanoAvax(123.456e9))).toEqual(
      AvaxXP.fromNanoAvax(123.456e9)
    )
    expect(limitInput(AvaxXP.fromNanoAvax(123.4567e9))).toEqual(
      AvaxXP.fromNanoAvax(123.4567e9)
    )
    expect(limitInput(AvaxXP.fromNanoAvax(123.45678e9))).toEqual(
      AvaxXP.fromNanoAvax(123.4567e9)
    )
    expect(limitInput(AvaxXP.fromNanoAvax(123.456789e9))).toEqual(
      AvaxXP.fromNanoAvax(123.4567e9)
    )
    expect(limitInput(AvaxXP.fromNanoAvax(1234567.456789e9))).toEqual(
      AvaxXP.fromNanoAvax(1234567e9)
    )
    expect(limitInput(AvaxXP.fromNanoAvax(12345678.456789e9))).toEqual(
      AvaxXP.fromNanoAvax(12345678e9)
    )
  })

  it('should return undefined if input is undefined', () => {
    expect(limitInput(undefined)).toEqual(undefined)
  })
})
