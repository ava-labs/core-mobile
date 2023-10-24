import { Avax } from 'types/Avax'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useMemo } from 'react'

/**
 * Wrapper hook for calculateAmountForCrossChainTransfer
 */
export const useGetAmountForCrossChainTransfer = (
  stakingAmount: Avax
): Avax | undefined => {
  const claimableBalance = useGetClaimableBalance()

  return useMemo(() => {
    if (claimableBalance === undefined) {
      return undefined
    }
    return calculateAmountForCrossChainTransfer(stakingAmount, claimableBalance)
  }, [claimableBalance, stakingAmount])
}

/**
 * Calculates how much Avax we need to transfer from C to P
 */
export const calculateAmountForCrossChainTransfer = (
  stakingAmount: Avax,
  claimableBalance: Avax
): Avax => {
  if (claimableBalance.gt(stakingAmount)) {
    return Avax.fromBase(0)
  } else {
    return stakingAmount.sub(claimableBalance)
  }
}
