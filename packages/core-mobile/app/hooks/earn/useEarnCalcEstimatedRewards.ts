import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { selectAvaxPrice } from 'store/balance/slice'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { pvm } from '@avalabs/avalanchejs'
import { Seconds } from 'types/siUnits'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'

export type useEarnCalcEstimatedRewardsProps = {
  amountNanoAvax: bigint
  duration: Seconds
  delegationFee: number
}

/**
 *
 * @param amountNanoAvax nAVAX
 * @param duration between current datetime to validator end time
 * @param delegationFee
 * @returns
 */
export const useEarnCalcEstimatedRewards = ({
  amountNanoAvax,
  duration,
  delegationFee
}: useEarnCalcEstimatedRewardsProps): UseQueryResult<
  {
    estimatedTokenReward: TokenUnit
    estimatedRewardInCurrency: string
  },
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxPrice = useSelector(selectAvaxPrice)
  const provider = useAvalancheXpProvider(isDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  return useQuery({
    queryKey: ['currentSupply', provider],
    queryFn: async () => {
      if (provider === undefined) {
        throw new Error('Avalanche provider is not available')
      }
      return EarnService.getCurrentSupply(provider)
    },
    select: ({ supply: currentSupply }: pvm.GetCurrentSupplyResponse) => {
      const reward = EarnService.calcReward(
        amountNanoAvax,
        duration,
        new TokenUnit(
          currentSupply,
          networkToken.decimals,
          networkToken.symbol
        ),
        delegationFee,
        isDeveloperMode
      )
      return {
        estimatedTokenReward: reward,
        estimatedRewardInCurrency: reward
          .mul(avaxPrice)
          .toDisplay({ fixedDp: 2 })
      }
    }
  })
}
