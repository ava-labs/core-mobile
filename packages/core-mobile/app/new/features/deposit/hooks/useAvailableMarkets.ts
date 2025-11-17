import { useMemo } from 'react'
import { Network } from '@avalabs/core-chains-sdk'
import { PublicClient } from 'viem'
import { LocalTokenWithBalance } from 'store/balance'
import { DefiMarket } from '../types'
import { useAaveAvailableMarkets } from './aave/useAaveAvailableMarkets'
import { useBenqiAvailableMarkets } from './benqi/useBenqiAvailableMarkets'

export const useAvailableMarkets = ({
  network,
  networkClient,
  tokensWithBalance
}: {
  network: Network | undefined
  networkClient: PublicClient | undefined
  tokensWithBalance: LocalTokenWithBalance[]
}): {
  data: DefiMarket[]
  error: Error | null
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
} => {
  const {
    data: aaveMarkets,
    isLoading: isLoadingAaveMarkets,
    error: errorAaveMarkets,
    isPending: isPendingAaveMarkets,
    isFetching: isFetchingAave
  } = useAaveAvailableMarkets({ network, networkClient, tokensWithBalance })
  const {
    data: benqiMarkets,
    isLoading: isLoadingBenqiMarkets,
    error: errorBenqiMarkets,
    isPending: isPendingBenqiMarkets,
    isFetching: isFetchingBenqi
  } = useBenqiAvailableMarkets({ network, networkClient, tokensWithBalance })

  const safeMarkets = useMemo(() => {
    const safeAave = aaveMarkets ?? []
    const safeBenqi = benqiMarkets ?? []
    const mergedSafely = [...safeAave, ...safeBenqi]
    return mergedSafely.sort((a, b) => b.supplyApyPercent - a.supplyApyPercent)
  }, [aaveMarkets, benqiMarkets])

  return {
    data: safeMarkets,
    error: errorAaveMarkets || errorBenqiMarkets,
    isLoading: isLoadingAaveMarkets || isLoadingBenqiMarkets,
    isPending: isPendingAaveMarkets || isPendingBenqiMarkets,
    isFetching: isFetchingAave || isFetchingBenqi
  }
}
