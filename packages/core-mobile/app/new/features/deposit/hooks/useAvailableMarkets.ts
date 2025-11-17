import { useMemo } from 'react'
import { createPublicClient, http } from 'viem'
import { LocalTokenWithBalance } from 'store/balance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getViemChain } from 'utils/getViemChain/getViemChain'
import { DefiMarket } from '../types'
import { useAaveAvailableMarkets } from './aave/useAaveAvailableMarkets'
import { useBenqiAvailableMarkets } from './benqi/useBenqiAvailableMarkets'

export const useAvailableMarkets = ({
  tokensWithBalance = []
}: {
  tokensWithBalance?: LocalTokenWithBalance[]
}): {
  data: DefiMarket[]
  error: Error | null
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
} => {
  const cChainNetwork = useCChainNetwork()
  const networkClient = useMemo(() => {
    if (!cChainNetwork) {
      return undefined
    }

    const cChain = getViemChain(cChainNetwork)

    return createPublicClient({ chain: cChain, transport: http() })
  }, [cChainNetwork])

  const {
    data: aaveMarkets,
    isLoading: isLoadingAaveMarkets,
    error: errorAaveMarkets,
    isPending: isPendingAaveMarkets,
    isFetching: isFetchingAave
  } = useAaveAvailableMarkets({
    network: cChainNetwork,
    networkClient,
    tokensWithBalance
  })
  const {
    data: benqiMarkets,
    isLoading: isLoadingBenqiMarkets,
    error: errorBenqiMarkets,
    isPending: isPendingBenqiMarkets,
    isFetching: isFetchingBenqi
  } = useBenqiAvailableMarkets({
    network: cChainNetwork,
    networkClient,
    tokensWithBalance
  })

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
