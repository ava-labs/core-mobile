import { AdvancedSortFilter, NodeValidators } from 'types/earn'
import mockValidators from 'tests/fixtures/pvm/validators.json'
import { Avax } from 'types/Avax'
import { addDays, addYears } from 'date-fns'
import {
  calculateMaxWeight,
  getAdvancedSortedValidators,
  getFilteredValidators,
  getRandomValidator,
  getSimpleSortedValidators,
  getSortedValidatorsByEndTime,
  isEndTimeOverOneYear
} from './utils'

describe('calculateMaxWeight', () => {
  it('returns the correct maxWeight and maxDelegation', () => {
    const maxValidatorStake = Avax.fromBase(3000000)
    const stakeAmount = Avax.fromNanoAvax('1900264376785214')

    const expectedMaxWeight = {
      maxDelegation: Avax.fromNanoAvax('1099735623214786'),
      maxWeight: Avax.fromBase(3000000)
    }
    expect(calculateMaxWeight(maxValidatorStake, stakeAmount)).toStrictEqual(
      expectedMaxWeight
    )
  })

  it('returns the correct maxWeight when stakeWeight is less than maxValidatorStake', () => {
    const maxValidatorStake = Avax.fromBase(2000000)
    const stakeAmount = Avax.fromNanoAvax('4376785214')

    const expectedMaxWeight = {
      maxDelegation: Avax.fromNanoAvax('17507140856'),
      maxWeight: Avax.fromNanoAvax('21883926070')
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
      stakingAmount: Avax.fromBase(1),
      isDeveloperMode: true,
      stakingEndTime: new Date('1900-07-05T16:52:40.723Z'),
      minUpTime: 99.9999
    })
    expect(result.length).toBe(0)
  })
  it('should return filtered validators that meet the selected uptime', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: Avax.fromBase(1),
      isDeveloperMode: true,
      stakingEndTime: new Date('1900-07-05T16:52:40.723Z'),
      minUpTime: 99.9999
    })
    expect(result.length).toBe(5)
  })

  it('should return filtered validators that meet the selected staking duration', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: Avax.fromBase(1),
      isDeveloperMode: true,
      stakingEndTime: new Date('2122-07-05T16:57:10.140Z')
    })
    expect(result.length).toBe(1)
  })

  it('should return filtered validators that meet the selected staking amount', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: Avax.fromBase(100),
      isDeveloperMode: true,
      stakingEndTime: new Date()
    })
    expect(result.length).toBeGreaterThan(0)
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

describe('getAdvancedSortedValidators function', () => {
  const validators = [
    { uptime: '50', delegationFee: '10.0000', endTime: '3844249830' },
    { uptime: '99', delegationFee: '2.0000', endTime: '4844249830' },
    { uptime: '1', delegationFee: '100.0000', endTime: '2844249830' }
  ]
  it('should return sorted validators by uptime high to low', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.UpTimeHighToLow
    )
    expect(sorted[0]?.uptime).toBe('99')
  })
  it('should return sorted validators by uptime low to high', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.UpTimeLowToHigh
    )
    expect(sorted[0]?.uptime).toBe('1')
  })
  it('should return sorted validators by delegation fee high to low', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.FeeHighToLow
    )
    expect(sorted[0]?.delegationFee).toBe('100.0000')
  })
  it('should return sorted validators by delegation fee low to high', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.FeeLowToHigh
    )
    expect(sorted[0]?.delegationFee).toBe('2.0000')
  })
  it('should return sorted validators by duration high to low', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.DurationHighToLow
    )
    expect(sorted[0]?.endTime).toBe('4844249830')
  })
  it('should return sorted validators by duration low to high', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.DurationLowToHigh
    )
    expect(sorted[0]?.endTime).toBe('2844249830')
  })
})

describe('isEndTimeOverOneYear', () => {
  it('returns true if end time if more than one year from now', () => {
    const overOneYearFromNow = addYears(new Date(), 2)
    const result = isEndTimeOverOneYear(overOneYearFromNow)
    expect(result).toBeTruthy()
  })
  it('returns true if end time if exactly one year from now', () => {
    const oneYearFromNow = addYears(new Date(), 1)
    const result = isEndTimeOverOneYear(oneYearFromNow)
    expect(result).toBeTruthy()
  })
  it('returns false if end time if less than one year from now', () => {
    const lessThanOneYearFromNow = addDays(new Date(), 364)
    const result = isEndTimeOverOneYear(lessThanOneYearFromNow)
    expect(result).toBeFalsy()
  })
})

describe('getSortedValidatorsByEndTime', () => {
  const validators = [
    { uptime: '50', delegationFee: '10.0000', endTime: '3844249830' },
    { uptime: '99', delegationFee: '2.0000', endTime: '4844249830' },
    { uptime: '1', delegationFee: '100.0000', endTime: '2844249830' }
  ]
  it('returns sorted validator sort descending by end time', () => {
    const result = getSortedValidatorsByEndTime(validators as NodeValidators)
    expect(result[0]?.endTime).toEqual('4844249830')
  })
  it('returns empty array when input is empty array', () => {
    const result = getSortedValidatorsByEndTime([])
    expect(result).toEqual([])
  })
})
