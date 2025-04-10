import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { selectAvaxPrice } from 'store/balance/slice'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { pvm } from '@avalabs/avalanchejs'
import { convertToSeconds, MilliSeconds } from 'types/siUnits'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import {
  DurationOptionWithDays,
  getStakeDuration
} from 'services/earn/getStakeEndDate'

/**
 *
 * @param amountNanoAvax nAVAX
 * @param durations between current datetime to validator end time
 * @param delegationFee
 * @returns
 */
export const useStakeEstimatedRewards = ({
  amount,
  durations,
  delegationFee
}: {
  amount: TokenUnit
  durations: DurationOptionWithDays[]
  delegationFee: number
}): UseQueryResult<
  {
    duration: DurationOptionWithDays
    estimatedTokenReward: TokenUnit
    estimatedRewardInCurrency: string
  }[],
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
      return durations.map(duration => {
        const stakeDurationUnixMs = getStakeDuration(
          duration.stakeDurationFormat,
          duration.stakeDurationValue,
          isDeveloperMode
        )
        const durationInSecond = convertToSeconds(
          BigInt(stakeDurationUnixMs) as MilliSeconds
        )

        const reward = EarnService.calcReward(
          amount.toSubUnit(),
          durationInSecond,
          new TokenUnit(
            currentSupply,
            networkToken.decimals,
            networkToken.symbol
          ),
          delegationFee,
          isDeveloperMode
        )
        return {
          duration,
          estimatedTokenReward: reward,
          estimatedRewardInCurrency: reward
            .mul(avaxPrice)
            .toDisplay({ fixedDp: 2 })
        }
      })
    }
  })
}
