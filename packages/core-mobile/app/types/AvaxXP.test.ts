import { AvaxXP } from 'types/AvaxXP'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { AvaxC } from 'types/AvaxC'

describe('AvaxXP', () => {
  it('should create an instance from nanoAVAX using fromNanoAvax', () => {
    const value = BigInt(1e9)
    const avaxXP = AvaxXP.fromNanoAvax(value)

    expect(avaxXP).toBeInstanceOf(AvaxXP)
    expect(avaxXP).toBeInstanceOf(TokenUnit)
    expect(avaxXP.toNanoAvax()).toBe(value)
    expect(avaxXP.toSubUnit()).toBe(BigInt(1e9))
    expect(avaxXP.toDisplay()).toBe('1')
  })

  it('should handle various accepted input types correctly', () => {
    const values: Array<{ input: any; expected: bigint }> = [
      { input: '1000000000', expected: 1000000000n }, // string input
      { input: 1000000000, expected: 1000000000n }, // number input
      { input: 1000000000n, expected: 1000000000n } // bigint input
    ]

    values.forEach(({ input, expected }) => {
      const avaxXP = AvaxXP.fromNanoAvax(input)
      expect(avaxXP.toNanoAvax()).toBe(expected)
    })
  })

  it('should add with different denomination correctly', () => {
    const value = BigInt(1e9)
    const avaxXP = AvaxXP.fromNanoAvax(value)
    expect(avaxXP.toDisplay()).toBe('1')

    const value2 = BigInt(1e18)
    const avaxC = AvaxC.fromWei(value2)
    expect(avaxC.toDisplay()).toBe('1')

    expect(avaxC.add(avaxXP).toDisplay()).toBe('2')
  })
})
