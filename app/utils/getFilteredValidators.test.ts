import mockValidators from 'tests/fixtures/pvm/validators.json'
import { stringToBN } from '@avalabs/utils-sdk'
import { NodeValidators } from 'screens/earn/SelectNode'
import { getFilteredValidators } from './getFilteredValidators'

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
