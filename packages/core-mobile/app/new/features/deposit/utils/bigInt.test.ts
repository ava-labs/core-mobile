import Big from 'big.js'
import { bigIntToBig, bigToBigInt } from './bigInt'

describe('bigToBigInt', () => {
  // Test that the function 'bigToBigInt' correctly converts a negative Big number to a negative bigint.
  it('should convert a negative Big number to a negative bigint', () => {
    const big = new Big('-123.456')
    const result = bigToBigInt(big)
    expect(result).toBe(BigInt('-123'))
  })

  // Test that the function 'bigToBigInt' correctly converts a positive Big number to a positive bigint
  it('should convert a positive Big number to a positive bigint', () => {
    const big = new Big(123.456)
    const result = bigToBigInt(big)
    expect(result).toBe(BigInt(123))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with decimal places to a bigint by rounding down
  it('should convert a Big number with decimal places to a bigint by rounding down', () => {
    const bigNumber = new Big(123.456)
    const result = bigToBigInt(bigNumber)
    expect(result).toBe(BigInt(123))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with a value of 0 to a bigint.
  it('should convert a Big number with a value of 0 to a bigint', () => {
    const big = new Big(0)
    const result = bigToBigInt(big)
    expect(result).toBe(BigInt(0))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with decimal places to a bigint by rounding up
  it('should convert a Big number with decimal places to a bigint by rounding up', () => {
    const bigNumber = new Big(10.5)
    const result = bigToBigInt(bigNumber)
    expect(result).toBe(BigInt(11))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with a value greater than Number.MAX_SAFE_INTEGER to a bigint
  it('should convert a Big number with a value greater than Number.MAX_SAFE_INTEGER to a bigint', () => {
    const bigNumber = new Big('9007199254740993')
    const result = bigToBigInt(bigNumber)
    expect(result).toBe(BigInt('9007199254740993'))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with a value less than Number.MIN_SAFE_INTEGER to a bigint
  it('should convert a Big number with a value less than Number.MIN_SAFE_INTEGER to a bigint', () => {
    const bigNumber = new Big(-9_007_199_254_740_992)
    const result = bigToBigInt(bigNumber)
    expect(result).toBe(BigInt(-9_007_199_254_740_992))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with a value of Number.MAX_SAFE_INTEGER to a bigint
  it('should convert a Big number with a value of Number.MAX_SAFE_INTEGER to a bigint', () => {
    const bigNumber = new Big(Number.MAX_SAFE_INTEGER)
    const result = bigToBigInt(bigNumber)
    expect(result).toBe(BigInt(Number.MAX_SAFE_INTEGER))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with a value of Number.MIN_SAFE_INTEGER to a bigint.
  it('should convert a Big number with a value of Number.MIN_SAFE_INTEGER to a bigint', () => {
    const bigNumber = new Big(Number.MIN_SAFE_INTEGER)
    const result = bigToBigInt(bigNumber)
    expect(result).toBe(BigInt(Number.MIN_SAFE_INTEGER))
  })

  // Test that the function 'bigToBigInt' correctly converts a Big number with a value of Number.EPSILON to a bigint
  it('should convert Number.EPSILON to a bigint', () => {
    const bigNumber = new Big(Number.EPSILON)
    const result = bigToBigInt(bigNumber)
    expect(result).toBe(BigInt(0))
  })
})

describe('bigIntToBig', () => {
  // Test that the function correctly converts a positive bigint to a Big object.
  it('should convert a positive bigint to a Big object', () => {
    const bigInt = BigInt(1_234_567_890)
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('1234567890')
  })

  // Test that the function 'bigIntToBig' correctly converts the bigint 0 to a Big object.
  it('should convert bigint 0 to a Big object', () => {
    const result = bigIntToBig(BigInt(0))
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('0')
  })

  // Test that the function 'bigIntToBig' correctly converts a negative bigint to a Big object.
  it('should correctly convert a negative bigint to a Big object', () => {
    const bigInt = BigInt(-123_456_789)
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('-123456789')
  })

  // Test that the function 'bigIntToBig' correctly converts the smallest possible positive bigint to a Big object.
  it('should convert the smallest possible positive bigint to a Big object', () => {
    const result = bigIntToBig(BigInt(1))
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('1')
  })

  // Test that the function 'bigIntToBig' correctly converts the largest possible positive bigint to a Big object.
  it('should correctly convert the largest possible positive bigint to a Big object', () => {
    const bigInt = BigInt(Number.MAX_SAFE_INTEGER)
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe(bigInt.toString())
  })

  // Test that the function 'bigIntToBig' correctly converts the smallest possible negative bigint to a Big object.
  it('should convert the smallest possible negative bigint to a Big object', () => {
    const bigInt = BigInt('-9223372036854775808')
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('-9223372036854775808')
  })

  // Test that the function 'bigIntToBig' correctly converts the largest possible negative bigint to a Big object.
  it('should convert the largest possible negative bigint to a Big object', () => {
    const bigInt = BigInt(Number.MIN_SAFE_INTEGER)
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe(bigInt.toString())
  })

  // Test that the function correctly converts a bigint with leading/trailing whitespace to a Big object.
  it('should convert bigint with leading/trailing whitespace to Big object', () => {
    const bigInt = BigInt(' 1234567890 ')
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('1234567890')
  })

  // Test that the function correctly converts a bigint with leading zeros to a Big object.
  it('should convert bigint with leading zeros to Big object', () => {
    const bigInt = BigInt('000123456789')
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('123456789')
  })

  // Test that the function correctly converts a bigint with a leading plus sign to a Big object.
  it('should correctly convert a bigint with a leading plus sign to a Big object', () => {
    const bigInt = BigInt('+1234567890')
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('1234567890')
  })

  // Test that the function correctly converts a bigint with a leading minus sign to a Big object.
  it('should convert a bigint with a leading minus sign to a Big object', () => {
    const bigInt = BigInt('-1234567890')
    const result = bigIntToBig(bigInt)
    expect(result).toBeInstanceOf(Big)
    expect(result.toString()).toBe('-1234567890')
  })
})
