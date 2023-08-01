import { add, addYears, getUnixTime, isSameDay } from 'date-fns'
import { AdvancedSortFilter, NodeValidator, NodeValidators } from 'types/earn'
import { random } from 'lodash'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'
import { MAX_VALIDATOR_WEIGHT_FACTOR } from 'consts/earn'
import { Avax } from 'types/Avax'

// the max num of times we should check transaction status
// 7 means ~ 2 minutes
export const maxTransactionStatusCheckRetries = 7

/**
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#primary-network-parameters-on-mainnet
 * for more info on this harcoded parameter.
 */
export const getStakingConfig = (isDeveloperMode: boolean) => {
  return isDeveloperMode
    ? FujiParams.stakingConfig
    : MainnetParams.stakingConfig
}

export const getMinimumStakeDurationMs = (isDeveloperMode: boolean) => {
  const oneDay = 24 * 60 * 60 * 1000
  const twoWeeks = 14 * 24 * 60 * 60 * 1000
  return isDeveloperMode ? oneDay : twoWeeks
}

export const getMinimumStakeEndTime = (
  isDeveloperMode: boolean,
  stakeStartTime: Date
) => {
  return isDeveloperMode
    ? add(stakeStartTime, { hours: 24 })
    : add(stakeStartTime, { weeks: 2 })
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
  maxValidatorStake: Avax,
  stakeAmount: Avax
): { maxWeight: Avax; maxDelegation: Avax } => {
  const stakeWeight = stakeAmount.mul(MAX_VALIDATOR_WEIGHT_FACTOR)
  const maxWeight = stakeWeight.lt(maxValidatorStake)
    ? stakeWeight
    : maxValidatorStake
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
  weight: Avax
): Avax => {
  const maxValidatorStake = Avax.fromNanoAvax(
    getStakingConfig(isDeveloperMode).MaxValidatorStake
  )
  const maxWeight = calculateMaxWeight(maxValidatorStake, weight)
  return maxWeight.maxDelegation
}

type getFilteredValidatorsProps = {
  validators: NodeValidators
  stakingAmount: Avax
  isDeveloperMode: boolean
  stakingEndTime: Date
  minUpTime?: number
  maxFee?: number
  searchText?: string
  isEndTimeOverOneYear?: boolean
}
/**
 *
 * @param validators  list of validators to filter from
 * @param stakingAmount  nAVAX
 * @param isDeveloperMode
 * @param stakingEndTime stake end time to filter by
 * @param minUpTime minimum up time to filter by
 * @param maxFee maximum delegation fee to filter by
 * @param searchText  search text for nodeID
 * @param isEndTimeOverOneYear  boolean indicating if the stake end time is over one year
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
  maxFee,
  searchText,
  isEndTimeOverOneYear = false
}: getFilteredValidatorsProps) => {
  const lowerCasedSearchText = searchText?.toLocaleLowerCase()
  const stakingEndTimeUnix = getUnixTime(stakingEndTime) // timestamp in seconds

  const filtered = validators.filter(
    ({ endTime, weight, uptime, delegationFee, nodeID }) => {
      const availableDelegationWeight = getAvailableDelegationWeight(
        isDeveloperMode,
        Avax.fromNanoAvax(weight)
      )
      const filterByMinimumStakingTime = () => {
        if (isEndTimeOverOneYear) {
          // if chosen duration is over one year,
          // then we don't need to check for minimum staking time
          return true
        }
        return hasMinimumStakingTime(Number(endTime), stakingEndTimeUnix)
      }

      return (
        (lowerCasedSearchText
          ? nodeID.toLocaleLowerCase().includes(lowerCasedSearchText)
          : true) &&
        availableDelegationWeight > stakingAmount &&
        filterByMinimumStakingTime() &&
        Number(uptime) >= minUpTime &&
        (maxFee ? Number(delegationFee) <= maxFee : true)
      )
    }
  )
  return filtered
}

/**
 *
 * @param validators input to sort by staking uptime and delegation fee,
 * @param isEndTimeOverOneYear boolean indicating if the stake end time is over one year
 * @returns sorted validators
 */
export const getSimpleSortedValidators = (
  validators: NodeValidators,
  isEndTimeOverOneYear = false
) => {
  if (isEndTimeOverOneYear) {
    return getSortedValidatorsByEndTime(validators)
  }
  return validators.sort(
    (a, b): number =>
      Number(b.uptime) - Number(a.uptime) ||
      Number(b.delegationFee) - Number(a.delegationFee)
  )
}

/**
 *
 * @param validators input to take random item from,
 * @param isEndTimeOverOneYear boolean indicating if the stake end time is over one year
 * @returns random item from either top 5 items in the array or all of the items in the array
 */
export const getRandomValidator = (
  validators: NodeValidators,
  isEndTimeOverOneYear = false
) => {
  if (isEndTimeOverOneYear) {
    // get the first item in the array sorted by end time
    return validators.at(0) as NodeValidator
  }
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
    case AdvancedSortFilter.UpTimeHighToLow:
    default:
      return validators.sort(
        (a, b): number => Number(b.uptime) - Number(a.uptime)
      )
  }
}

export const isEndTimeOverOneYear = (stakingEndTime: Date) => {
  return (
    stakingEndTime >= addYears(new Date(), 1) ||
    isSameDay(stakingEndTime, addYears(new Date(), 1))
  )
}

export const getSortedValidatorsByEndTime = (validators: NodeValidators) => {
  return validators.sort(
    (a, b): number => Number(b.endTime) - Number(a.endTime)
  )
}
