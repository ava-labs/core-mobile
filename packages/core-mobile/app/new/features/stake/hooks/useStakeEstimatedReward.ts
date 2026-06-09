import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { Seconds } from 'types/siUnits'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useCallback, useEffect, useState } from 'react'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'

type EstimatedReward = {
  estimatedTokenReward: TokenUnit
}

export type UseStakeEstimatedRewardResult = {
  /** `undefined` until the first successful estimate resolves. */
  data: EstimatedReward | undefined
  isLoading: boolean
  /**
   * `true` when the latest estimate attempt failed (almost always a
   * `getCurrentSupply` network error). Stays `true` until a retry succeeds or
   * the inputs change. Lets callers surface a retry affordance instead of
   * leaving a fee-gated CTA permanently — and silently — disabled.
   */
  isError: boolean
  /** Re-run the estimate (e.g. from a user-tapped "Retry"). */
  refetch: () => void
}

/**
 *
 * @param amount nAVAX
 * @param duration between current datetime to validator end time
 * @param delegationFee
 */
export const useStakeEstimatedReward = ({
  amount,
  duration,
  delegationFee
}: {
  amount: TokenUnit
  duration?: Seconds
  delegationFee: number
}): UseStakeEstimatedRewardResult => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avalancheProvider = useAvalancheXpProvider(isDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const [data, setData] = useState<EstimatedReward>()
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  // Bumped by `refetch` to re-trigger the estimate effect.
  const [retryToken, setRetryToken] = useState(0)

  const refetch = useCallback(() => {
    setRetryToken(token => token + 1)
  }, [])

  const calculate = useCallback(
    async (
      stakingDuration: Seconds,
      provider: Avalanche.JsonRpcProvider,
      isCancelled: () => boolean
    ): Promise<void> => {
      setIsLoading(true)
      setIsError(false)
      try {
        const { supply } = await EarnService.getCurrentSupply(provider)

        const reward = EarnService.calcReward(
          amount.toSubUnit(),
          stakingDuration,
          new TokenUnit(supply, networkToken.decimals, networkToken.symbol),
          delegationFee,
          isDeveloperMode
        )

        if (isCancelled()) return
        setData({ estimatedTokenReward: reward })
      } catch (error) {
        if (isCancelled()) return
        Logger.error('failed to estimate staking reward', error)
        setIsError(true)
      } finally {
        if (!isCancelled()) setIsLoading(false)
      }
    },
    [amount, delegationFee, networkToken, isDeveloperMode]
  )

  useEffect(() => {
    if (!duration || !avalancheProvider) {
      return undefined
    }

    let cancelled = false
    calculate(duration, avalancheProvider, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [calculate, duration, avalancheProvider, retryToken])

  return { data, isLoading, isError, refetch }
}
