import { getPvmApi } from 'utils/network/pvm'
import BN from 'bn.js'
import { Account } from 'store/account'
import { exportC } from 'services/earn/exportC'
import { importP } from 'services/earn/importP'
import Big from 'big.js'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'
import { bnToBig } from '@avalabs/utils-sdk'
import { importC } from 'services/earn/importC'
import { exportP } from 'services/earn/exportP'

class EarnService {
  getCurrentValidators = (isTestnet: boolean) => {
    return getPvmApi(isTestnet).getCurrentValidators()
  }

  /**
   * @param cChainBalance in nAvax
   * @param requiredAmount in nAvax
   * @param activeAccount
   * @param isDevMode
   */
  async collectTokensForStaking(
    cChainBalance: BN,
    requiredAmount: BN,
    activeAccount: Account,
    isDevMode: boolean
  ): Promise<boolean> {
    return (
      (await exportC({
        cChainBalance,
        requiredAmount,
        activeAccount,
        isDevMode
      })) &&
      (await importP({
        activeAccount,
        isDevMode
      }))
    )
  }

  /**
   * @param pChainBalance in nAvax
   * @param requiredAmount in nAvax
   * @param activeAccount
   * @param isDevMode
   */
  async claimRewards(
    pChainBalance: BN,
    requiredAmount: BN,
    activeAccount: Account,
    isDevMode: boolean
  ): Promise<boolean> {
    return (
      (await exportP({
        pChainBalance,
        requiredAmount,
        activeAccount,
        isDevMode
      })) &&
      (await importC({
        activeAccount,
        isDevMode
      }))
    )
  }

  /**
   *
   * @param amount
   * @param duration in s
   * @param currentSupply
   * @param delegationFee in percent
   * @param isDeveloperMode
   */
  calcReward(
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
}

export default new EarnService()
