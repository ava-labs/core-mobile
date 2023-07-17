import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { selectAvaxPrice } from 'store/balance'
import { useQuery } from '@tanstack/react-query'
import { GetCurrentSupplyResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/pvm'
import { BigAvax, BigIntNavax } from 'types/denominations'
import Big from 'big.js'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { Seconds } from 'types/siUnits'

export type useEarnCalcEstimatedRewardsProps = {
  amount: BigIntNavax
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
}: useEarnCalcEstimatedRewardsProps) => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxPrice = useSelector(selectAvaxPrice)

  return useQuery({
    queryKey: ['currentSupply', isDeveloperMode],
    queryFn: async () => EarnService.getCurrentSupply(isDeveloperMode),
    select: ({ supply: currentSupply }: GetCurrentSupplyResponse) => {
      const reward = EarnService.calcReward(
        amount,
        duration,
        currentSupply,
        delegationFee,
        isDeveloperMode
      )
      return {
        estimatedTokenReward: bigintToBig(reward, 9) as BigAvax,
        estimatedRewardInCurrency: bigintToBig(reward, 9)
          .mul(Big(avaxPrice))
          .toFixed(2)
      }
    }
  })
}
