import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { Avax } from 'types/Avax'

export const useGetClaimableBalance = (): Avax | undefined => {
  const pChainBalance = usePChainBalance()
  const pChainBalanceNAvax = pChainBalance.data?.unlockedUnstaked[0]?.amount

  const claimableBalance = useMemo(() => {
    if (pChainBalanceNAvax) {
      return Avax.fromNanoAvax(pChainBalanceNAvax)
    }
    return undefined
  }, [pChainBalanceNAvax])

  return claimableBalance
}
