import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { Avax } from 'types/Avax'

export const useGetClaimableBalance = (): Avax | undefined => {
  const pChainBalance = usePChainBalance()
  const pChainBalanceAvax = pChainBalance.data?.balancePerType.unlockedUnstaked
  const hasErrors = pChainBalance.error || !pChainBalance.data
  const dataReady = !pChainBalance.isLoading && !hasErrors

  return useMemo(() => {
    if (dataReady) {
      return Avax.fromBase(pChainBalanceAvax || 0)
    }
    return undefined
  }, [dataReady, pChainBalanceAvax])
}
