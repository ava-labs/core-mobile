import BN from 'bn.js'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Big from 'big.js'
import EarnService from 'services/earn/EarnService'
import { selectAvaxPrice } from 'store/balance'
import { useQuery } from '@tanstack/react-query'
import { GetCurrentSupplyResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/pvm'

export type StakingRewards = {
  estimatedTokenReward: BN
  estimatedRewardAmount: number
}

export type useEarnCalcEstimatedRewardsProps = {
  amount: Big
  duration: number
  delegationFee: number
}

/**
 *
 * @param amount nAVAX with denomination 18
 * @param duration between current datetime to validator end time
 * @param delegationFee
 * @returns
 */
export const useEarnCalcEstimatedRewards = ({
  amount,
  duration,
  delegationFee
}: useEarnCalcEstimatedRewardsProps) => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxPrice = useSelector(selectAvaxPrice)

  return useQuery({
    queryKey: ['currentSupply', isDeveloperMode],
    queryFn: async () => {
      return await EarnService.getCurrentSupply(isDeveloperMode)
    },
    select: ({ supply }: GetCurrentSupplyResponse) => {
      const currentSupply = new Big(supply.toString())
      const rewardStr = EarnService.calcReward(
        amount,
        duration,
        currentSupply,
        delegationFee,
        isDeveloperMode
      )
      return {
        estimatedTokenReward: rewardStr,
        estimatedRewardAmount: Number(rewardStr) * avaxPrice
      }
    }
  })
}
