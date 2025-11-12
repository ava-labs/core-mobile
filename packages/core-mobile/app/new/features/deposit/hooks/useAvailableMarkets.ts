import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Address } from 'viem'
import { DefiMarket } from '../types'
import { useAaveAvailableMarkets } from './aave/useAaveAvailableMarkets'
import { useBenqiAvailableMarkets } from './benqi/useBenqiAvailableMarkets'
import { useCChainTokensWithBalance } from './useCChainTokensWithBalance'

export const useAvailableMarkets = (filter?: {
  symbol: string
  contractAddress: Address | undefined
}): {
  data: DefiMarket[]
  error: Error | null
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
  refetch: () => void
} => {
  const dispatch = useDispatch()
  const {
    isRefetching: isRefetchingBalances,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
    isPending: isPendingBalances
  } = useCChainTokensWithBalance()
  const {
    data: aaveMarkets,
    isLoading: isLoadingAaveMarkets,
    error: errorAaveMarkets,
    isPending: isPendingAaveMarkets,
    isFetching: isFetchingAave,
    refetch: refetchAaveMarkets
  } = useAaveAvailableMarkets()
  const {
    data: benqiMarkets,
    isLoading: isLoadingBenqiMarkets,
    error: errorBenqiMarkets,
    isPending: isPendingBenqiMarkets,
    isFetching: isFetchingBenqi,
    refetch: refetchBenqiMarkets
  } = useBenqiAvailableMarkets()

  const safeMarkets = useMemo(() => {
    const safeAave = aaveMarkets ?? []
    const safeBenqi = benqiMarkets ?? []
    let mergedSafely = [...safeAave, ...safeBenqi]
    if (filter) {
      mergedSafely = mergedSafely.filter(market => {
        if (filter.contractAddress) {
          return (
            market.asset.contractAddress?.toLowerCase() ===
            filter.contractAddress.toLowerCase()
          )
        }
        return market.asset.symbol.toLowerCase() === filter.symbol.toLowerCase()
      })
    }
    return mergedSafely.sort((a, b) => b.supplyApyPercent - a.supplyApyPercent)
  }, [aaveMarkets, benqiMarkets, filter])

  const refetch = useCallback(async () => {
    // 1. Refetch balances first
    dispatch(refetchBalances())
    // await refetchBalances(chainInfo)
    // 2. Refetch markets next. Parallel requests are fine.
    await Promise.all([refetchAaveMarkets(), refetchBenqiMarkets()])
  }, [dispatch, refetchAaveMarkets, refetchBenqiMarkets, refetchBalances])

  return {
    data: safeMarkets,
    error: errorAaveMarkets || errorBenqiMarkets,
    isLoading:
      isLoadingAaveMarkets || isLoadingBenqiMarkets || isLoadingBalances,
    isPending:
      isPendingAaveMarkets || isPendingBenqiMarkets || isPendingBalances,
    isFetching: isFetchingAave || isFetchingBenqi || isRefetchingBalances,
    refetch
  }
}
