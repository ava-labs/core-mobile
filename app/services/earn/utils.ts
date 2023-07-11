import { bnToBig, bnToLocaleString } from '@avalabs/utils-sdk'
import Big from 'big.js'
import BN from 'bn.js'
import { add, addYears, getUnixTime } from 'date-fns'
import {
  AdvancedSortFilter,
  NodeValidator,
  NodeValidators
} from 'types/earn.types'
import { random } from 'lodash'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'

export const MAX_VALIDATOR_WEIGHT_FACTOR = 5
const N_AVAX_PER_AVAX = 1_000_000_000

/**
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#primary-network-parameters-on-mainnet
 * for more info on this harcoded parameter.
 */
export const getStakingConfig = (isDeveloperMode: boolean) => {
  return isDeveloperMode
    ? FujiParams.stakingConfig
    : MainnetParams.stakingConfig
}

export const getMinimumStakeEndDate = (isDeveloperMode: boolean) => {
  return isDeveloperMode
    ? add(new Date(), { hours: 24 })
    : add(new Date(), { weeks: 2 })
}

export const getMaximumStakeEndDate = () => {
  return addYears(new Date(), 1)
}

/**
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#delegators-weight-checks
 * for more information on how max validator weight is calculated.
 * @param maxValidatorStake - Max validator stake for subnet as defined in `stakingConfig`
 * @param stakeAmount - Stake amount in nAvax
 * @returns maxWeight - The maximum validator weight in nAvax
 * @returns maxDelegation - The maximum delegation in nAvax (`maxWeight` - `stakeAmount`)
 */
export const calculateMaxWeight = (
  maxValidatorStake: Big,
  stakeAmount: Big
): { maxWeight: Big; maxDelegation: Big } => {
  const stakeWeight = stakeAmount.mul(MAX_VALIDATOR_WEIGHT_FACTOR)
  const maxValidatorStakeBig = new Big(maxValidatorStake.valueOf())
  const maxWeight = stakeWeight.lt(maxValidatorStakeBig)
    ? stakeWeight
    : maxValidatorStakeBig
  const maxDelegation = maxWeight.sub(stakeAmount)

  return {
    maxWeight,
    maxDelegation
  }
}

export const randomColor = () => {
  const hexString = '0123456789abcdef'
  let hexCode = '#'
  for (let i = 0; i < 6; i++) {
    hexCode += hexString[Math.floor(Math.random() * hexString.length)]
  }
  return hexCode
}

export const generateGradient = () => {
  const colorFrom = randomColor()
  const colorTo = randomColor()
  return { colorFrom, colorTo }
}

/**
 *
 * @param validatorEndTime
 * @param delegationEndTime
 * @returns boolean indicating if the selected delegation end time
 * is before the validator end time
 */
const hasMinimumStakingTime = (
  validatorEndTime: number,
  delegationEndTime: number
): boolean => {
  return validatorEndTime > delegationEndTime
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

type getFilteredValidatorsProps = {
  validators: NodeValidators
  stakingAmount: BN
  isDeveloperMode: boolean
  stakingEndTime: Date
  minUpTime?: number
  maxFee?: number
  searchText?: string
}
/**
 *
 * @param validators
 * @param stakingAmount  nAVAX with denomination 18
 * @param isDeveloperMode
 * @param stakingEndTime
 * @param minUpTime
 * @param maxFee
 * @param searchText  search text for nodeID
 * @returns filtered list of validators that match the following filter criteria
 * - stakingAmount
 * - stakingEndTime
 * - minUpTime: minimum validator up time
 * - weight: has avaialble delegation weight for the validator
 */
export const getFilteredValidators = ({
  validators,
  stakingAmount,
  isDeveloperMode,
  stakingEndTime,
  minUpTime = 0,
  maxFee = 20,
  searchText
}: getFilteredValidatorsProps) => {
  const stakingEndTimeUnix = getUnixTime(stakingEndTime) // timestamp in seconds
  const stakingAmountNumber = Number(
    bnToLocaleString(stakingAmount.div(new BN(1e9)))
  )

  const filtered = validators.filter(
    ({ endTime, weight, uptime, delegationFee, nodeID }) => {
      const availableDelegationWeight = getAvailableDelegationWeight(
        isDeveloperMode,
        weight
      )
      return (
        availableDelegationWeight > stakingAmountNumber &&
        hasMinimumStakingTime(Number(endTime), stakingEndTimeUnix) &&
        Number(uptime) >= minUpTime &&
        Number(delegationFee) <= maxFee &&
        nodeID.includes(searchText ?? '')
      )
    }
  )
  return filtered
}

/**
 *
 * @param validators input to sort by staking uptime and delegation fee,
 * @returns sorted validators
 */
export const getSimpleSortedValidators = (validators: NodeValidators) => {
  return validators.sort((a, b): number => {
    return (
      Number(b.uptime) - Number(a.uptime) ||
      Number(b.delegationFee) - Number(a.delegationFee)
    )
  })
}

/**
 *
 * @param validators input to take random item from,
 * @returns random item from either top 5 items in the array or all of the items in the array
 */
export const getRandomValidator = (validators: NodeValidators) => {
  const endIndex = validators.length >= 5 ? 4 : validators.length - 1
  const randomIndex = random(0, endIndex)
  const matchedValidator = validators.at(randomIndex)
  return matchedValidator as NodeValidator
}

/**
 *
 * @param validators,
 * @param advancedSortFilter filter to sort validators by uptime, fee, or duration
 * @returns sorted validators
 */
export const getAdvancedSortedValidators = (
  validators: NodeValidators,
  sortFilter: AdvancedSortFilter
) => {
  switch (sortFilter) {
    case AdvancedSortFilter.UpTimeHighToLow:
      return validators.sort(
        (a, b): number => Number(b.uptime) - Number(a.uptime)
      )
    case AdvancedSortFilter.UpTimeLowToHigh:
      return validators.sort(
        (a, b): number => Number(a.uptime) - Number(b.uptime)
      )
    case AdvancedSortFilter.FeeHighToLow:
      return validators.sort(
        (a, b): number => Number(b.delegationFee) - Number(a.delegationFee)
      )
    case AdvancedSortFilter.FeeLowToHigh:
      return validators.sort(
        (a, b): number => Number(a.delegationFee) - Number(b.delegationFee)
      )
    case AdvancedSortFilter.DurationHighToLow:
      return validators.sort(
        (a, b): number => Number(b.endTime) - Number(a.endTime)
      )
    case AdvancedSortFilter.DurationLowToHigh:
      return validators.sort(
        (a, b): number => Number(a.endTime) - Number(b.endTime)
      )
  }
}
