import { useAvailableMarkets } from 'features/defiMarket/hooks/useAvailableMarkets'
import { DefiMarket } from 'features/defiMarket/types'
import { useMemo } from 'react'

export const useDeposits = (): {
  deposits: DefiMarket[]
  isLoading: boolean
  isFetching: boolean
  refresh: () => void
  isRefreshing: boolean
} => {
  const { data, isLoading, isFetching, refresh, isRefreshing } =
    useAvailableMarkets()

  const deposits = useMemo(() => {
    return (
      data?.filter(
        market => market.asset.mintTokenBalance.balance > BigInt(0)
      ) ?? []
    )
  }, [data])

  return { deposits, isLoading, isFetching, refresh, isRefreshing }
}
