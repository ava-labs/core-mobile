import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { Seconds } from 'types/siUnits'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useCallback, useEffect, useState } from 'react'
import { Avalanche } from '@avalabs/core-wallets-sdk'

/**
 *
 * @param amountNanoAvax nAVAX
 * @param duration between current datetime to validator end time
 * @param delegationFee
 * @returns
 */
export const useStakeEstimatedReward = ({
  amount,
  duration,
  delegationFee
}: {
  amount: TokenUnit
  duration?: Seconds
  delegationFee: number
}): Return | undefined => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avalancheProvider = useAvalancheXpProvider(isDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const [estimatedReward, setEstimatedReward] = useState<Return>()

  const calculate = useCallback(
    async (
      stakingDuration: Seconds,
      provider: Avalanche.JsonRpcProvider
    ): Promise<void> => {
      const { supply } = await EarnService.getCurrentSupply(provider)

      const reward = EarnService.calcReward(
        amount.toSubUnit(),
        stakingDuration,
        new TokenUnit(supply, networkToken.decimals, networkToken.symbol),
        delegationFee,
        isDeveloperMode
      )

      setEstimatedReward({
        estimatedTokenReward: reward
      })
    },
    [amount, delegationFee, networkToken, isDeveloperMode]
  )

  useEffect(() => {
    if (!duration || !avalancheProvider) {
      return undefined
    }

    calculate(duration, avalancheProvider)
  }, [calculate, duration, avalancheProvider])

  return estimatedReward
}

type Return = {
  estimatedTokenReward: TokenUnit
}
