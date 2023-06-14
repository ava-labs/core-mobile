import BN from 'bn.js'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'
import Big from 'big.js'
import { bnToBig } from '@avalabs/utils-sdk'

export const useEarnCalcEstimatedRewards = (
  amount: Big,
  duration: number,
  currentSupply: Big
): BN => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const rewardStr = calcReward(
    amount,
    duration,
    currentSupply,
    2,
    isDeveloperMode
  )
  return new BN(rewardStr)
}

export const PERCENT_PERMILLION_FACTOR = 10_000 // This converts percents into permillions.
export const PERMILLION_MIN = 0
export const PERMILLION_MAX = 100 * PERCENT_PERMILLION_FACTOR

/**
 *
 * @param amount
 * @param duration in s
 * @param currentSupply
 * @param delegationFee in percent
 * @param isDeveloperMode
 */
export function calcReward(
  amount: Big,
  duration: number,
  currentSupply: Big,
  delegationFee: number,
  isDeveloperMode: boolean
): string {
  const defPlatformVals = isDeveloperMode ? FujiParams : MainnetParams
  const minConsumptionRateRatio = new Big(
    defPlatformVals.stakingConfig.RewardConfig.MinConsumptionRate
  )
  const maxConsumptionRateRatio = new Big(
    defPlatformVals.stakingConfig.RewardConfig.MaxConsumptionRate
  )
  const stakingPeriodOverMintingPeriod = new Big(duration).div(
    new Big(defPlatformVals.stakingConfig.RewardConfig.MintingPeriod)
  )
  const effectiveConsumptionRate = minConsumptionRateRatio
    .mul(new Big(1).minus(stakingPeriodOverMintingPeriod))
    .add(maxConsumptionRateRatio.mul(stakingPeriodOverMintingPeriod))

  const stakeOverSupply = amount.div(currentSupply)
  const supplyCap = bnToBig(
    defPlatformVals.stakingConfig.RewardConfig.SupplyCap
  )
  const unmintedSupply = supplyCap.sub(currentSupply)
  const fullReward = unmintedSupply
    .mul(stakeOverSupply)
    .mul(stakingPeriodOverMintingPeriod)
    .mul(effectiveConsumptionRate)

  const delegationFeeRatio = new Big(delegationFee).div(100)
  const rewardsMinusDelegationFee = fullReward.mul(
    new Big(1).minus(delegationFeeRatio)
  )

  return rewardsMinusDelegationFee.toFixed(0)
}
