import mockNodes from 'tests/fixtures/nodes.json'
import { BN } from 'bn.js'
import { Validators } from './getFilteredValidators'
import { getFilteredValidators } from './getFilteredValidators'

describe('getFilteredValidators function', () => {
  it('should return empty array when the validators input is empty', () => {
    const result = getFilteredValidators(
      [] as unknown as Validators,
      new BN(1),
      true,
      new Date('1900-07-05T16:52:40.723Z'),
      99.9999
    )
    expect(result.length).toBe(0)
  })
  it('should return filtered validators that meet the selected uptime', () => {
    const result = getFilteredValidators(
      mockNodes.result.validators as unknown as Validators,
      new BN(1),
      true,
      new Date('1900-07-05T16:52:40.723Z'),
      99.9999
    )
    expect(result.length).toBe(5)
  })

  it('should return filtered validators that meet the selected staking duration', () => {
    const result = getFilteredValidators(
      mockNodes.result.validators as unknown as Validators,
      new BN(1),
      true,
      new Date('2122-07-05T16:57:10.140Z')
    )
    expect(result.length).toBe(1)
  })

  it('should return filtered validators that meet the selected staking amount', () => {
    const result = getFilteredValidators(
      mockNodes.result.validators as unknown as Validators,
      new BN(100000),
      true,
      new Date()
    )
    expect(result.length).toBe(21)
  })
})
