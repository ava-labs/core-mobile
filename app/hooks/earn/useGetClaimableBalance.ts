import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { Avax } from 'types/Avax'

export const useGetClaimableBalance = (): Avax | undefined => {
  const pChainBalance = usePChainBalance()
  const pChainBalanceNAvax = pChainBalance.data?.unlockedUnstaked[0]?.amount
  const hasErrors = pChainBalance.error || !pChainBalance.data
  const dataReady = !pChainBalance.isLoading && !hasErrors

  const claimableBalance = useMemo(() => {
    if (dataReady) {
      return Avax.fromNanoAvax(pChainBalanceNAvax || 0)
    }
    return undefined
  }, [dataReady, pChainBalanceNAvax])

  return claimableBalance
}
