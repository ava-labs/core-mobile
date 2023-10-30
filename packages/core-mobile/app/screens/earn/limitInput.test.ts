import limitInput from 'screens/earn/limitInput'
import { Avax } from 'types/Avax'

describe('limitInput', () => {
  it('should not limit whole number portion', () => {
    expect(limitInput(Avax.fromBase(123))).toEqual(Avax.fromBase(123))
    expect(limitInput(Avax.fromBase(1234567890))).toEqual(
      Avax.fromBase(1234567890)
    )
    expect(limitInput(Avax.fromBase('1234567890.123'))).toEqual(
      Avax.fromBase('1234567890')
    )
  })

  it('should trim decimals to total of 7 digits (combined with whole part)', () => {
    expect(limitInput(Avax.fromBase('123.456'))).toEqual(
      Avax.fromBase('123.456')
    )
    expect(limitInput(Avax.fromBase('123.4567'))).toEqual(
      Avax.fromBase('123.4567')
    )
    expect(limitInput(Avax.fromBase('123.45678'))).toEqual(
      Avax.fromBase('123.4567')
    )
    expect(limitInput(Avax.fromBase('123.4567890'))).toEqual(
      Avax.fromBase('123.4567')
    )
    expect(limitInput(Avax.fromBase('1234567.4567890'))).toEqual(
      Avax.fromBase('1234567')
    )
    expect(limitInput(Avax.fromBase('12345678.4567890'))).toEqual(
      Avax.fromBase('12345678')
    )
  })

  it('should return undefined if input is undefined', () => {
    expect(limitInput(undefined)).toEqual(undefined)
  })
})
