import { Avax } from 'types/Avax'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useMemo } from 'react'

export const useGetAmountForCrossChainTransfer = (
  stakingAmount: Avax
): Avax | undefined => {
  const claimableBalance = useGetClaimableBalance()

  const amountForCrossChainTransfer = useMemo(() => {
    if (claimableBalance === undefined) {
      return undefined
    }
    if (claimableBalance.gt(stakingAmount)) {
      return Avax.fromBase(0)
    } else {
      return stakingAmount.sub(claimableBalance)
    }
  }, [claimableBalance, stakingAmount])

  return amountForCrossChainTransfer
}
