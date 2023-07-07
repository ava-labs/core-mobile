import Big from 'big.js'
import { calculateMaxWeight } from './utils'

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
