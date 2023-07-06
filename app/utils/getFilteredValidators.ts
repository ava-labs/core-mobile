import { GetCurrentValidatorsResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/pvm'
import Big from 'big.js'
import { bnToBig, bnToLocaleString } from '@avalabs/utils-sdk'
import BN from 'bn.js'
import { getUnixTime } from 'date-fns'
import { calculateMaxWeight } from './calculateMaxWeight'
import { getStakingConfig } from './getStakingConfig'

export type Validators = GetCurrentValidatorsResponse['validators']
export type Validator = GetCurrentValidatorsResponse['validators'][0]

const N_AVAX_PER_AVAX = 1_000_000_000

const hasMinimumStakingTime = (
  endTime: number,
  stakingDuration: number
): boolean => {
  return endTime > stakingDuration
}

const getAvailableDelegationWeight = (
  isDeveloperMode: boolean,
  weight: string
) => {
  const maxValidatorStake = getStakingConfig(isDeveloperMode).MaxValidatorStake
  const maxWeight = calculateMaxWeight(
    bnToBig(maxValidatorStake),
    new Big(weight)
  )
  return Number(maxWeight.maxDelegation) / N_AVAX_PER_AVAX
}

export const getFilteredValidators = (
  validators: Validators,
  stakingAmount: BN,
  isDeveloperMode: boolean,
  stakingDuration: Date,
  minUpTime = 0
) => {
  const stackingDurationUnixTime = getUnixTime(stakingDuration)
  const stakingAmountNumber = Number(
    bnToLocaleString(stakingAmount.div(new BN(1e9)))
  )

  const filtered = validators.filter(({ endTime, weight, uptime }) => {
    const availableDelegationWeight = getAvailableDelegationWeight(
      isDeveloperMode,
      weight
    )
    return (
      availableDelegationWeight > stakingAmountNumber &&
      hasMinimumStakingTime(Number(endTime), stackingDurationUnixTime) &&
      Number(uptime) >= minUpTime
    )
  })
  return filtered
}
