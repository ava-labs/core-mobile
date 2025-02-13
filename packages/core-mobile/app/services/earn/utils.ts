import {
  add,
  addYears,
  fromUnixTime,
  getUnixTime,
  isSameDay,
  subDays
} from 'date-fns'
import { AdvancedSortFilter, NodeValidator, NodeValidators } from 'types/earn'
import { random } from 'lodash'
import { FujiParams, MainnetParams, StakingConfig } from 'utils/NetworkParams'
import { MAX_VALIDATOR_WEIGHT_FACTOR } from 'consts/earn'
import Logger from 'utils/Logger'
import { valid, compare } from 'semver'
import { Peer } from '@avalabs/avalanchejs/dist/info/model'
import { PChainTransaction } from '@avalabs/glacier-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { UTCDate } from '@date-fns/utc'
import EarnService from './EarnService'

// the max num of times we should check transaction status
export const maxTransactionStatusCheckRetries = 8 // ~ 4 minutes
export const maxTransactionCreationRetries = 7 // ~ 2 minute
export const maxBalanceCheckRetries = 10
export const maxGetAtomicUTXOsRetries = 10

/**
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#primary-network-parameters-on-mainnet
 * for more info on this harcoded parameter.
 */
export const getStakingConfig = (isDeveloperMode: boolean): StakingConfig => {
  return isDeveloperMode
    ? FujiParams.stakingConfig
    : MainnetParams.stakingConfig
}

export const getMinimumStakeDurationMs = (isDeveloperMode: boolean): number => {
  const oneDay = 24 * 60 * 60 * 1000
  const twoWeeks = 14 * 24 * 60 * 60 * 1000
  return isDeveloperMode ? oneDay : twoWeeks
}

export const getMinimumStakeEndTime = (
  isDeveloperMode: boolean,
  stakeStartTime: UTCDate
): UTCDate => {
  return isDeveloperMode
    ? add(stakeStartTime, { hours: 24 })
    : add(stakeStartTime, { weeks: 2 })
}

export const getMaximumStakeEndDate = (): UTCDate => {
  return addYears(new UTCDate(), 1)
}

/**
 * Calculates the maximum weight (validator's owned stake plus delegator stake) of a validator
 *
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#delegators-weight-checks
 * for more information on how max validator weight is calculated.
 * @param maxValidatorStake - Max validator stake for subnet as defined in `stakingConfig`
 * @param validatorWeight weight of validator (validator's owned stake only) in nAvax
 * @returns the maximum weight in nAvax
 */
export const calculateMaxWeight = (
  maxValidatorStake: TokenUnit,
  validatorWeight: TokenUnit
): TokenUnit => {
  const stakeWeight = validatorWeight.mul(MAX_VALIDATOR_WEIGHT_FACTOR)
  return stakeWeight.lt(maxValidatorStake) ? stakeWeight : maxValidatorStake
}

export const randomColor = (): string => {
  const hexString = '0123456789abcdef'
  let hexCode = '#'
  for (let i = 0; i < 6; i++) {
    hexCode += hexString[Math.floor(Math.random() * hexString.length)]
  }
  return hexCode
}

export const generateGradient = (): {
  colorFrom: string
  colorTo: string
} => {
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

/**
 * Calculates the total amount of AVAX that can still be delegated to the validator.
 *
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#delegators-weight-checks
 * for more information on how max validator weight is calculated.
 * @param isDeveloperMode
 * @param validatorWeight weight of validator (validator's owned stake only) in nAvax
 * @param delegatorWeight weight of deligator (delegator stake) in nAvax
 * @returns the available delegation weight in nAvax
 */
export const getAvailableDelegationWeight = ({
  isDeveloperMode,
  validatorWeight,
  delegatorWeight
}: {
  isDeveloperMode: boolean
  validatorWeight: TokenUnit
  delegatorWeight: TokenUnit
}): TokenUnit => {
  const nAvax = getStakingConfig(isDeveloperMode).MaxValidatorStake
  const maxValidatorStake = new TokenUnit(nAvax, 9, 'AVAX')
  const maxWeight = calculateMaxWeight(maxValidatorStake, validatorWeight)

  return maxWeight.sub(validatorWeight).sub(delegatorWeight)
}

type getFilteredValidatorsProps = {
  validators: NodeValidators
  stakingAmount: TokenUnit
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
}: getFilteredValidatorsProps): NodeValidators => {
  const lowerCasedSearchText = searchText?.toLocaleLowerCase()
  const stakingEndTimeUnix = getUnixTime(stakingEndTime) // timestamp in seconds

  return validators.filter(
    ({
      endTime,
      weight,
      uptime,
      delegationFee,
      delegatorWeight,
      nodeID,
      connected,
      startTime
    }) => {
      const availableDelegationWeight = getAvailableDelegationWeight({
        isDeveloperMode,
        validatorWeight: new TokenUnit(weight, 9, 'AVAX'),
        delegatorWeight: new TokenUnit(delegatorWeight, 9, 'AVAX')
      })
      const filterByMinimumStakingTime = (): boolean => {
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
        availableDelegationWeight.gt(stakingAmount) &&
        filterByMinimumStakingTime() &&
        Number(uptime) >= minUpTime &&
        (maxFee ? Number(delegationFee) <= maxFee : true) &&
        connected === true &&
        fromUnixTime(Number(startTime)) <= subDays(new Date(), 7)
      )
    }
  )
}

/**
 *
 * @param validators input to sort by staking uptime and delegation fee,
 * @param isEndTimeOverOneYear boolean indicating if the stake end time is over one year
 * @param peers Record of <string, peers> to sort by version
 * @returns sorted validators
 */
export const getSimpleSortedValidators = (
  validators: NodeValidators,
  peers?: Record<string, Peer>,
  isEndTimeOverOneYear = false
): NodeValidators => {
  if (isEndTimeOverOneYear) {
    return getSortedValidatorsByEndTime(validators)
  }
  return [...validators].sort(
    (a, b): number =>
      Number(a.delegationFee) - Number(b.delegationFee) ||
      Number(b.uptime) - Number(a.uptime) ||
      (peers === undefined
        ? 0
        : comparePeerVersion(
            peers[b.nodeID]?.version,
            peers[a.nodeID]?.version
          ))
  )
}

/**
 *
 * @param validators input sorted by delegationFee, uptime and node version to take random item from,
 * @param isEndTimeOverOneYear boolean indicating if the stake end time is over one year
 * @returns random item from either top 5 items in the array or all of the items in the array
 */
export const getRandomValidator = (
  validators: NodeValidators,
  isEndTimeOverOneYear = false
): NodeValidator => {
  if (isEndTimeOverOneYear) {
    // get the first item in the array sorted by end time
    return validators.at(0) as NodeValidator
  }

  // get the validators with lowest delegation fee
  const validatorsWithLowestFee = validators.filter(
    validator => validator.delegationFee === validators[0]?.delegationFee
  )

  // if there is only one validator with the lowest fee, return it
  if (validatorsWithLowestFee.length === 1) {
    return validatorsWithLowestFee[0] as NodeValidator
  }

  // if there are more than 2 validators with the lowest fee, return a random one between the 2-5 validators
  const endIndex =
    validatorsWithLowestFee.length >= 5 ? 4 : validators.length - 1
  const randomIndex = random(0, endIndex)
  const matchedValidator = validators.at(randomIndex)

  return matchedValidator as NodeValidator
}

/**
 *
 * @param validators NodeValidators
 * @param sortFilter filter to sort validators by uptime, fee, or duration
 * @param peers Record of <string, peers> to sort by version
 * @returns sorted validators
 */
export const getAdvancedSortedValidators = (
  validators: NodeValidators,
  sortFilter: AdvancedSortFilter,
  peers?: Record<string, Peer>
): NodeValidators => {
  const clonedValidators = [...validators]
  switch (sortFilter) {
    case AdvancedSortFilter.UpTimeLowToHigh:
      return clonedValidators.sort(
        (a, b): number => Number(a.uptime) - Number(b.uptime)
      )
    case AdvancedSortFilter.FeeHighToLow:
      return clonedValidators.sort(
        (a, b): number => Number(b.delegationFee) - Number(a.delegationFee)
      )
    case AdvancedSortFilter.FeeLowToHigh:
      return clonedValidators.sort(
        (a, b): number => Number(a.delegationFee) - Number(b.delegationFee)
      )
    case AdvancedSortFilter.DurationHighToLow:
      return clonedValidators.sort(
        (a, b): number => Number(b.endTime) - Number(a.endTime)
      )
    case AdvancedSortFilter.DurationLowToHigh:
      return clonedValidators.sort(
        (a, b): number => Number(a.endTime) - Number(b.endTime)
      )
    case AdvancedSortFilter.VersionHighToLow:
      if (peers === undefined) return clonedValidators
      return clonedValidators.sort((a, b): number =>
        comparePeerVersion(peers[b.nodeID]?.version, peers[a.nodeID]?.version)
      )
    case AdvancedSortFilter.VersionLowToHigh:
      if (peers === undefined) return clonedValidators
      return clonedValidators.sort((a, b): number =>
        comparePeerVersion(peers[a.nodeID]?.version, peers[b.nodeID]?.version)
      )
    case AdvancedSortFilter.UpTimeHighToLow:
    default:
      return clonedValidators.sort(
        (a, b): number => Number(b.uptime) - Number(a.uptime)
      )
  }
}

export const isEndTimeOverOneYear = (stakingEndTime: Date): boolean => {
  return (
    stakingEndTime >= addYears(new Date(), 1) ||
    isSameDay(stakingEndTime, addYears(new Date(), 1))
  )
}

export const getSortedValidatorsByEndTime = (
  validators: NodeValidators
): NodeValidators => {
  return validators.sort(
    (a, b): number => Number(b.endTime) - Number(a.endTime)
  )
}

export const getTransformedTransactions = async (
  addresses: string[],
  isTestnet: boolean
): Promise<
  (PChainTransaction & { index: number; isDeveloperMode: boolean })[]
> => {
  try {
    const stakes = await EarnService.getAllStakes({
      isTestnet,
      addresses
    })

    return stakes.map(transaction => {
      const pAddr = transaction.emittedUtxos.find(utxo => utxo.staked === true)
        ?.addresses[0]
      const matchedPAddress = addresses
        .map((addr, index) => {
          return { addr, index }
        })
        .find(mapped => {
          return mapped.addr === `P-${pAddr}`
        })
      return {
        ...transaction,
        index: matchedPAddress?.index ?? 0,
        isDeveloperMode: isTestnet
      }
    })
  } catch (error) {
    Logger.error('getTransformedTransactions failed: ', error)
    throw error
  }
}

export const comparePeerVersion = (
  first?: string,
  second?: string
): 0 | 1 | -1 => {
  const v1 = valid(first?.split('/')[1]) ?? '0.0.0'
  const v2 = valid(second?.split('/')[1]) ?? '0.0.0'
  return compare(v1, v2)
}
