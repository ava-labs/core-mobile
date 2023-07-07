import { bnToBig, bnToLocaleString } from '@avalabs/utils-sdk'
import Big from 'big.js'
import BN from 'bn.js'
import { getUnixTime } from 'date-fns'
import { NodeValidator, NodeValidators } from 'screens/earn/SelectNode'
import { random } from 'lodash'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'

export const MAX_VALIDATOR_WEIGHT_FACTOR = 5
const N_AVAX_PER_AVAX = 1_000_000_000

export const getStakingConfig = (isDeveloperMode: boolean) => {
  return isDeveloperMode
    ? FujiParams.stakingConfig
    : MainnetParams.stakingConfig
}

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
}
/**
 *
 * @param validators
 * @param stakingAmount  nAVAX with denomination 18
 * @param isDeveloperMode
 * @param stakingEndTime
 * @param minUpTime
 * @returns
 */
export const getFilteredValidators = ({
  validators,
  stakingAmount,
  isDeveloperMode,
  stakingEndTime,
  minUpTime = 0
}: getFilteredValidatorsProps) => {
  const stackingEndTimeUnix = getUnixTime(stakingEndTime) // timestamp in seconds
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
      hasMinimumStakingTime(Number(endTime), stackingEndTimeUnix) &&
      Number(uptime) >= minUpTime
    )
  })
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
