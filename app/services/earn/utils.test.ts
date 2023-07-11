import Big from 'big.js'
import { stringToBN } from '@avalabs/utils-sdk'
import { NodeValidators } from 'screens/earn/SelectNode'
import mockValidators from 'tests/fixtures/pvm/validators.json'
import {
  calculateMaxWeight,
  getFilteredValidators,
  getRandomValidator,
  getSimpleSortedValidators
} from './utils'

describe('calculateMaxWeight', () => {
  it('returns the correct maxWeight and maxDelegation', () => {
    const maxValidatorStake = new Big(3000000e9)
    const stakeAmount = new Big('1900264376785214')

    const expectedMaxWeight = {
      maxDelegation: new Big('1099735623214786'),
      maxWeight: new Big(3000000e9)
    }
    expect(calculateMaxWeight(maxValidatorStake, stakeAmount)).toStrictEqual(
      expectedMaxWeight
    )
  })

  it('returns the correct maxWeight when stakeWeight is less than maxValidatorStake', () => {
    const maxValidatorStake = new Big(2000000e9)
    const stakeAmount = new Big('4376785214')

    const expectedMaxWeight = {
      maxDelegation: new Big('17507140856'),
      maxWeight: new Big('21883926070')
    }
    expect(calculateMaxWeight(maxValidatorStake, stakeAmount)).toStrictEqual(
      expectedMaxWeight
    )
  })
})

describe('getFilteredValidators function', () => {
  it('should return empty array when the validators input is empty', () => {
    const result = getFilteredValidators({
      validators: [] as unknown as NodeValidators,
      stakingAmount: stringToBN('1', 18),
      isDeveloperMode: true,
      stakingEndTime: new Date('1900-07-05T16:52:40.723Z'),
      minUpTime: 99.9999
    })
    expect(result.length).toBe(0)
  })
  it('should return filtered validators that meet the selected uptime', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: stringToBN('1', 18),
      isDeveloperMode: true,
      stakingEndTime: new Date('1900-07-05T16:52:40.723Z'),
      minUpTime: 99.9999
    })
    expect(result.length).toBe(5)
  })

  it('should return filtered validators that meet the selected staking duration', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: stringToBN('1', 18),
      isDeveloperMode: true,
      stakingEndTime: new Date('2122-07-05T16:57:10.140Z')
    })
    expect(result.length).toBe(1)
  })

  it('should return filtered validators that meet the selected staking amount', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: stringToBN('100', 18),
      isDeveloperMode: true,
      stakingEndTime: new Date()
    })
    expect(result.length).toBe(31)
  })
})

describe('getSimpleSortedValidators function', () => {
  it('should return validator that has uptime > 98 from top 5 sorted choices', () => {
    const result = getSimpleSortedValidators(
      mockValidators.validators as unknown as NodeValidators
    )
    // @ts-ignore
    expect(Number(result.at(0).uptime)).toBeGreaterThan(98)
  })

  it('should return undefined if validators prop is empty', () => {
    const result = getSimpleSortedValidators([])
    expect(result.length).toBe(0)
  })
})

describe('getRandomValidator function', () => {
  it('should randomly return validator that has uptime > 98 from top 5 sorted choices', () => {
    const sorted = getSimpleSortedValidators(
      mockValidators.validators as unknown as NodeValidators
    )
    const result = getRandomValidator(sorted)
    expect(Number(result?.uptime)).toBeGreaterThan(98)
  })

  it('should return undefined if validators prop is empty', () => {
    const result = getRandomValidator([])
    expect(result).toBe(undefined)
  })
})
