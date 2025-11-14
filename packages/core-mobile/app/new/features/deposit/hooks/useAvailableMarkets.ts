import { useMemo } from 'react'
import { Address } from 'viem'
import { DefiMarket } from '../types'
import { useAaveAvailableMarkets } from './aave/useAaveAvailableMarkets'
import { useBenqiAvailableMarkets } from './benqi/useBenqiAvailableMarkets'

export const useAvailableMarkets = (filter?: {
  symbol: string
  contractAddress: Address | undefined
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
  } = useAaveAvailableMarkets()
  const {
    data: benqiMarkets,
    isLoading: isLoadingBenqiMarkets,
    error: errorBenqiMarkets,
    isPending: isPendingBenqiMarkets,
    isFetching: isFetchingBenqi
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

  return {
    data: safeMarkets,
    error: errorAaveMarkets || errorBenqiMarkets,
    isLoading: isLoadingAaveMarkets || isLoadingBenqiMarkets,
    isPending: isPendingAaveMarkets || isPendingBenqiMarkets,
    isFetching: isFetchingAave || isFetchingBenqi
  }
}
