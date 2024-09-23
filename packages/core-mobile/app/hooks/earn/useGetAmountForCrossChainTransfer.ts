import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { getZeroAvaxPChain } from 'utils/units/zeroValues'

/**
 * Wrapper hook for calculateAmountForCrossChainTransfer
 */
export const useGetAmountForCrossChainTransfer = (
  stakingAmount: TokenUnit
): TokenUnit | undefined => {
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
  stakingAmount: TokenUnit,
  claimableBalance: TokenUnit
): TokenUnit => {
  if (claimableBalance.gt(stakingAmount)) {
    return getZeroAvaxPChain()
  } else {
    return stakingAmount.sub(claimableBalance)
  }
}
