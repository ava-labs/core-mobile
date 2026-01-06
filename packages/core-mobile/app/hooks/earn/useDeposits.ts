import { useAvailableMarkets } from 'features/deposit/hooks/useAvailableMarkets'
import { DefiMarket } from 'features/deposit/types'
import { useMemo } from 'react'

export const useDeposits = (): {
  deposits: DefiMarket[]
  isLoading: boolean
} => {
  const { data, isLoading } = useAvailableMarkets()

  const deposits = useMemo(() => {
    return (
      data?.filter(
        market => market.asset.mintTokenBalance.balance > BigInt(0)
      ) ?? []
    )
  }, [data])

  return { deposits, isLoading }
}
