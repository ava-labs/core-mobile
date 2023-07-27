import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { Avax } from 'types/Avax'

export const useGetClaimableBalance = (): Avax | undefined => {
  const pChainBalance = usePChainBalance()

  const claimableBalance = useMemo(() => {
    const hasErrors = pChainBalance.error || !pChainBalance.data
    if (!pChainBalance.isLoading && !hasErrors) {
      return Avax.fromNanoAvax(
        pChainBalance.data.unlockedUnstaked[0]?.amount || 0
      )
    }
    return undefined
  }, [pChainBalance.data, pChainBalance.error, pChainBalance.isLoading])

  return claimableBalance
}
