import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { zeroAvaxPChain } from 'utils/units/zeroValues'

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
  claimableBalance?: TokenUnit
): TokenUnit => {
  if (claimableBalance?.gt(stakingAmount)) {
    return zeroAvaxPChain()
  } else {
    return claimableBalance
      ? stakingAmount.sub(claimableBalance)
      : stakingAmount
  }
}
/**
 * Calculates how much Avax we need to transfer from C to P
 */
export const calculateAmountForCrossChainTransferBigint = (
  stakingAmount: bigint,
  claimableBalance?: bigint
): bigint => {
  if (claimableBalance !== undefined && claimableBalance > stakingAmount) {
    return 0n
  } else {
    return claimableBalance !== undefined
      ? stakingAmount - claimableBalance
      : stakingAmount
  }
}
