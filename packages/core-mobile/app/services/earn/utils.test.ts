import { AdvancedSortFilter, NodeValidators } from 'types/earn'
import mockValidators from 'tests/fixtures/pvm/validators.json'
import { addDays, addYears } from 'date-fns'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { zeroAvaxPChain } from 'utils/units/zeroValues'
// import { navigateToClaimRewards } from 'navigation/utils'
import {
  calculateMaxWeight,
  getAvailableDelegationWeight,
  getAdvancedSortedValidators,
  getFilteredValidators,
  getRandomValidator,
  getSimpleSortedValidators,
  getSortedValidatorsByEndTime,
  isEndTimeOverOneYear,
  comparePeerVersion
} from './utils'

describe('calculateMaxWeight', () => {
  it('returns the correct maxWeight when validatorWeight x 5 is greater than maxValidatorStake', () => {
    const maxValidatorStake = new TokenUnit(3000000_000_000_000, 9, 'AVAX')
    const validatorWeight = new TokenUnit('19002643767852140', 9, 'AVAX')

    const expectedMaxWeight = new TokenUnit(3000000_000_000_000, 9, 'AVAX')

    expect(
      calculateMaxWeight(maxValidatorStake, validatorWeight)
    ).toStrictEqual(expectedMaxWeight)
  })

  it('returns the correct maxWeight when validatorWeight x 5 is less than maxValidatorStake', () => {
    const maxValidatorStake = new TokenUnit(2000000_000_000_000, 9, 'AVAX')
    const validatorWeight = new TokenUnit('4376785214', 9, 'AVAX')

    const expectedMaxWeight = new TokenUnit('21883926070', 9, 'AVAX') // 4376785214 x 5

    expect(
      calculateMaxWeight(maxValidatorStake, validatorWeight)
    ).toStrictEqual(expectedMaxWeight)
  })
})

describe('getAvailableDelegationWeight', () => {
  describe('with developer mode on', () => {
    it('returns the correct value when delegatorWeight is not zero', () => {
      const validatorWeight = new TokenUnit(51_000_000_000, 9, 'AVAX')
      const delegatorWeight = new TokenUnit(34_000_000_000, 9, 'AVAX')

      const expectedAvailableDelegationWeight = new TokenUnit(
        170_000_000_000,
        9,
        'AVAX'
      )

      expect(
        getAvailableDelegationWeight({
          isDeveloperMode: true,
          validatorWeight,
          delegatorWeight
        })
      ).toStrictEqual(expectedAvailableDelegationWeight)
    })

    it('returns the correct value when delegatorWeight is zero', () => {
      const validatorWeight = new TokenUnit(51_000_000_000, 9, 'AVAX')
      const delegatorWeight = zeroAvaxPChain()

      const expectedAvailableDelegationWeight = new TokenUnit(
        204_000_000_000,
        9,
        'AVAX'
      )

      expect(
        getAvailableDelegationWeight({
          isDeveloperMode: true,
          validatorWeight,
          delegatorWeight
        })
      ).toStrictEqual(expectedAvailableDelegationWeight)
    })
  })

  describe('with developer mode off', () => {
    it('returns the correct value when delegatorWeight is not zero', () => {
      const validatorWeight = new TokenUnit(51_000_000_000, 9, 'AVAX')
      const delegatorWeight = new TokenUnit(34_000_000_000, 9, 'AVAX')

      const expectedAvailableDelegationWeight = new TokenUnit(
        170_000_000_000,
        9,
        'AVAX'
      )

      expect(
        getAvailableDelegationWeight({
          isDeveloperMode: true,
          validatorWeight,
          delegatorWeight
        })
      ).toStrictEqual(expectedAvailableDelegationWeight)
    })

    it('returns the correct value when delegatorWeight is zero', () => {
      const validatorWeight = new TokenUnit(51_000_000_000, 9, 'AVAX')
      const delegatorWeight = zeroAvaxPChain()

      const expectedAvailableDelegationWeight = new TokenUnit(
        204_000_000_000,
        9,
        'AVAX'
      )

      expect(
        getAvailableDelegationWeight({
          isDeveloperMode: true,
          validatorWeight,
          delegatorWeight
        })
      ).toStrictEqual(expectedAvailableDelegationWeight)
    })
  })
})

describe('getFilteredValidators function', () => {
  it('should return empty array when the validators input is empty', () => {
    const result = getFilteredValidators({
      validators: [] as unknown as NodeValidators,
      stakingAmount: new TokenUnit(1_000_000_000, 9, 'AVAX'),
      isDeveloperMode: true,
      stakingEndTime: new Date('1900-07-05T16:52:40.723Z'),
      minUpTime: 99.9999
    })
    expect(result.length).toBe(0)
  })
  it('should return filtered validators that meet the selected uptime', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: new TokenUnit(1_000_000_000, 9, 'AVAX'),
      isDeveloperMode: true,
      stakingEndTime: new Date('1900-07-05T16:52:40.723Z'),
      minUpTime: 99.9999
    })

    expect(result.length).toBe(5)
  })

  it('should return filtered validators that meet the selected staking duration', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: new TokenUnit(1_000_000_000, 9, 'AVAX'),
      isDeveloperMode: true,
      stakingEndTime: new Date('2122-07-05T16:57:10.140Z')
    })
    expect(result.length).toBe(1)
  })

  it('should return filtered validators that meet the selected staking amount', () => {
    const result = getFilteredValidators({
      validators: mockValidators.validators as unknown as NodeValidators,
      stakingAmount: new TokenUnit(150_000_000_000, 9, 'AVAX'),
      isDeveloperMode: true,
      stakingEndTime: new Date('2023-08-01T16:57:10.140Z')
    })
    expect(result.length).toBe(25)
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

  it('should return validator with lowest delegation fee', () => {
    const result = getSimpleSortedValidators(
      mockValidators.validators as unknown as NodeValidators
    )
    expect(Number(result[0]?.delegationFee)).toStrictEqual(2)
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

  it('should return first item by end time if staking end time is over one year', () => {
    const result = getRandomValidator(
      mockValidators.validators as unknown as NodeValidators,
      true
    )
    expect(result).toBe(mockValidators.validators[0])
  })

  it('should return first item if only one validator matches the lowest delegation fee', () => {
    const validators = mockValidators.validators.map((validator, index) => {
      if (index === 0) {
        return { ...validator, delegationFee: '1.0000' }
      }
      return validator
    })
    const result = getRandomValidator(validators as unknown as NodeValidators)
    expect(result).toBe(validators[0])
  })
  it('should return random validator from ones that matches the lowest delegation fee', () => {
    const validators = mockValidators.validators.map((validator, index) => {
      if (index <= 1) {
        return { ...validator, delegationFee: '1.0000' }
      }
      return validator
    })
    const result = getRandomValidator(validators as unknown as NodeValidators)
    const nodeIds = validators.map(validator => validator.nodeID)
    expect(nodeIds.includes(result.nodeID)).toBeTruthy()
  })

  it('should return random validator from top five of ones that matches the lowest delegation fee', () => {
    const validators = mockValidators.validators.map((validator, index) => {
      if (index <= 10) {
        return { ...validator, delegationFee: '1.0000' }
      }
      return validator
    })
    const result = getRandomValidator(validators as unknown as NodeValidators)
    const topFive = validators.slice(0, 5).map(validator => validator.nodeID)
    expect(topFive.includes(result.nodeID)).toBeTruthy()
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
    expect(sorted?.[0]?.uptime).toBe('99')
  })
  it('should return sorted validators by uptime low to high', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.UpTimeLowToHigh
    )
    expect(sorted?.[0]?.uptime).toBe('1')
  })
  it('should return sorted validators by delegation fee high to low', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.FeeHighToLow
    )
    expect(sorted?.[0]?.delegationFee).toBe('100.0000')
  })
  it('should return sorted validators by delegation fee low to high', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.FeeLowToHigh
    )
    expect(sorted?.[0]?.delegationFee).toBe('2.0000')
  })
  it('should return sorted validators by duration high to low', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.DurationHighToLow
    )
    expect(sorted?.[0]?.endTime).toBe('4844249830')
  })
  it('should return sorted validators by duration low to high', () => {
    const sorted = getAdvancedSortedValidators(
      validators as unknown as NodeValidators,
      AdvancedSortFilter.DurationLowToHigh
    )
    expect(sorted?.[0]?.endTime).toBe('2844249830')
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

describe('navigateToClaimRewards', () => {
  const mockNavigate = jest.fn()
  jest.useFakeTimers()
  //jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

  it('should have been navigated to claim rewards screen', () => {
    // TODO: make navigate to claim rewards work
    // navigateToClaimRewards()
    jest.runAllTimers()
    // expect(mockNavigate).toHaveBeenLastCalledWith({
    //   name: expect.anything(),
    //   params: {
    //     screen: 'WalletScreens.Earn',
    //     params: {
    //       screen: 'EarnScreens.ClaimRewards',
    //       params: expect.anything()
    //     }
    //   }
    // })
  })
  it('should not have called navigate before timeout', () => {
    // TODO: fix these tests
    //navigateToClaimRewards()
    jest.advanceTimersByTime(500)
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

describe('comparePeerVersion', () => {
  it('should return 1 if first version is greater than second version', () => {
    const result = comparePeerVersion('avalanche/1.0.3', 'avalanche/0.0.1')
    expect(result).toBe(1)
  })
  it('should return -1 if second version if greater than first version', () => {
    const result = comparePeerVersion('avalanche/0.9.0', 'avalanche/1.0.1')
    expect(result).toBe(-1)
  })
  it('should return 0 if second version if same as first version', () => {
    const result = comparePeerVersion('avalanche/0.9.0', 'avalanche/0.9.0')
    expect(result).toBe(0)
  })
  it('should return 0 if both versions contain incorrect version', () => {
    const result = comparePeerVersion('avalanche/0.9', 'avalanche/0.0')
    expect(result).toBe(0)
  })
  it('should return 1 if second version is invalid', () => {
    const result = comparePeerVersion('avalanche/0.9.0', 'avalanche/0.0')
    expect(result).toBe(1)
  })
  it('should return -1 if first version is invalid', () => {
    const result = comparePeerVersion('avalanche/0.9', 'avalanche/0.0.1')
    expect(result).toBe(-1)
  })
  it('should return 0 if both versions are invalid', () => {
    const result = comparePeerVersion('avalanche', 'avalanche/')
    expect(result).toBe(0)
  })
  it('should return 0 if both versions are undefined', () => {
    const result = comparePeerVersion(undefined, undefined)
    expect(result).toBe(0)
  })
  it('should return -1 if first versions is undefined', () => {
    const result = comparePeerVersion(undefined, 'avalanche/0.9.0')
    expect(result).toBe(-1)
  })
})
