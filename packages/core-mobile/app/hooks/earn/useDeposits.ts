import { useAvailableMarkets } from 'features/defiMarket/hooks/useAvailableMarkets'
import { DefiMarket } from 'features/defiMarket/types'
import { useMemo } from 'react'

export const useDeposits = (): {
  deposits: DefiMarket[]
  isLoading: boolean
  refresh: () => void
  isRefreshing: boolean
} => {
  const { data, isLoading, refresh, isRefreshing } = useAvailableMarkets()

  const deposits = useMemo(() => {
    return (
      data?.filter(
        market => market.asset.mintTokenBalance.balance > BigInt(0)
      ) ?? []
    )
  }, [data])

  return { deposits, isLoading, refresh, isRefreshing }
}
