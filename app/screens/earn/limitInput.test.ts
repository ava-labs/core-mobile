import limitInput from 'screens/earn/limitInput'
import { BaseAvax } from 'types/BaseAvax'

describe('limitInput', () => {
  it('should not limit whole number portion', () => {
    expect(limitInput(BaseAvax.fromBase(123))).toEqual(BaseAvax.fromBase(123))
    expect(limitInput(BaseAvax.fromBase(1234567890))).toEqual(
      BaseAvax.fromBase(1234567890)
    )
    expect(limitInput(BaseAvax.fromBase('1234567890.123'))).toEqual(
      BaseAvax.fromBase('1234567890')
    )
  })

  it('should trim decimals to total of 7 digits (combined with whole part)', () => {
    expect(limitInput(BaseAvax.fromBase('123.456'))).toEqual(
      BaseAvax.fromBase('123.456')
    )
    expect(limitInput(BaseAvax.fromBase('123.4567'))).toEqual(
      BaseAvax.fromBase('123.4567')
    )
    expect(limitInput(BaseAvax.fromBase('123.45678'))).toEqual(
      BaseAvax.fromBase('123.4567')
    )
    expect(limitInput(BaseAvax.fromBase('123.4567890'))).toEqual(
      BaseAvax.fromBase('123.4567')
    )
    expect(limitInput(BaseAvax.fromBase('1234567.4567890'))).toEqual(
      BaseAvax.fromBase('1234567')
    )
    expect(limitInput(BaseAvax.fromBase('12345678.4567890'))).toEqual(
      BaseAvax.fromBase('12345678')
    )
  })

  it('should return undefined if input is undefined', () => {
    expect(limitInput(undefined)).toEqual(undefined)
  })
})
