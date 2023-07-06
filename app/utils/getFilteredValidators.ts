import Big from 'big.js'
import { bnToBig, bnToLocaleString } from '@avalabs/utils-sdk'
import BN from 'bn.js'
import { getUnixTime } from 'date-fns'
import { NodeValidators } from 'screens/earn/SelectNode'
import { getStakingConfig } from './getStakingConfig'
import { calculateMaxWeight } from './Utils'

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
  validators: NodeValidators,
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
