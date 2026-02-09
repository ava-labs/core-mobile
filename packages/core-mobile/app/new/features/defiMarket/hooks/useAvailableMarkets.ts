import { useCallback, useMemo, useState } from 'react'
import { createPublicClient, http } from 'viem'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getViemChain } from 'utils/getViemChain/getViemChain'
import { DefiMarket } from '../types'
import { useAaveAvailableMarkets } from './aave/useAaveAvailableMarkets'
import { useBenqiAvailableMarkets } from './benqi/useBenqiAvailableMarkets'

export const useAvailableMarkets = (): {
  data: DefiMarket[]
  error: Error | null
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
  isRefreshing: boolean
  refresh: () => void
} => {
  const cChainNetwork = useCChainNetwork()
  const networkClient = useMemo(() => {
    if (!cChainNetwork) {
      return undefined
    }

    const cChain = getViemChain(cChainNetwork)

    return createPublicClient({ chain: cChain, transport: http() })
  }, [cChainNetwork])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: aaveMarkets,
    isLoading: isLoadingAaveMarkets,
    error: errorAaveMarkets,
    isPending: isPendingAaveMarkets,
    isFetching: isFetchingAave,
    refetch: refetchAave
  } = useAaveAvailableMarkets({
    network: cChainNetwork,
    networkClient
  })
  const {
    data: benqiMarkets,
    isLoading: isLoadingBenqiMarkets,
    error: errorBenqiMarkets,
    isPending: isPendingBenqiMarkets,
    isFetching: isFetchingBenqi,
    refetch: refetchBenqi
  } = useBenqiAvailableMarkets({
    network: cChainNetwork,
    networkClient
  })

  const safeMarkets = useMemo(() => {
    const safeAave = aaveMarkets ?? []
    const safeBenqi = benqiMarkets ?? []
    const mergedSafely = [...safeAave, ...safeBenqi]
    return mergedSafely.sort((a, b) => b.supplyApyPercent - a.supplyApyPercent)
  }, [aaveMarkets, benqiMarkets])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetchAave()
    await refetchBenqi()
    setIsRefreshing(false)
  }, [refetchAave, refetchBenqi])

  return {
    data: safeMarkets,
    error: errorAaveMarkets || errorBenqiMarkets,
    isLoading: isLoadingAaveMarkets || isLoadingBenqiMarkets,
    isPending: isPendingAaveMarkets || isPendingBenqiMarkets,
    isFetching: isFetchingAave || isFetchingBenqi,
    isRefreshing,
    refresh
  }
}
