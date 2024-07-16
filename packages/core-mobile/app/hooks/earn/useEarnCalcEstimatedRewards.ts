import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { selectAvaxPrice } from 'store/balance/slice'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { pvm } from '@avalabs/avalanchejs'
import { Seconds } from 'types/siUnits'
import { Avax } from 'types/Avax'

export type useEarnCalcEstimatedRewardsProps = {
  amount: Avax
  duration: Seconds
  delegationFee: number
}

/**
 *
 * @param amount nAVAX
 * @param duration between current datetime to validator end time
 * @param delegationFee
 * @returns
 */
export const useEarnCalcEstimatedRewards = ({
  amount,
  duration,
  delegationFee
}: useEarnCalcEstimatedRewardsProps): UseQueryResult<
  {
    estimatedTokenReward: Avax
    estimatedRewardInCurrency: string
  },
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxPrice = useSelector(selectAvaxPrice)

  return useQuery({
    queryKey: ['currentSupply', isDeveloperMode],
    queryFn: async () => EarnService.getCurrentSupply(isDeveloperMode),
    select: ({ supply: currentSupply }: pvm.GetCurrentSupplyResponse) => {
      const reward = EarnService.calcReward(
        amount,
        duration,
        Avax.fromNanoAvax(currentSupply),
        delegationFee,
        isDeveloperMode
      )
      return {
        estimatedTokenReward: reward,
        estimatedRewardInCurrency: reward.mul(avaxPrice).toFixed(2)
      }
    }
  })
}
