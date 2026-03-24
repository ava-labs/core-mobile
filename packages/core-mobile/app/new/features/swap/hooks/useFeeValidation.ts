import { TokenType } from '@avalabs/vm-module-types'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
import { useMemo } from 'react'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { LocalTokenWithBalance } from 'store/balance'
import { FusionQuoteError, fusionErrors } from '../utils/fusionErrors'
import type { Quote } from '../types'
import { getTotalAdditiveSourceFee } from '../utils/getTotalAdditiveSourceFee'
import { useFeeEstimation } from './useFeeEstimation'

/**
 * Validates whether the user's balance is sufficient to cover the swap amount
 * plus gas and additive fees.
 *
 * For native tokens: checks fromToken.balance >= amount + bufferedGasFee + bufferedAdditiveFee
 * (no extra safety buffer — 0% safetyBps — since the Max value already
 * absorbs fee fluctuations via useMaxSwapAmount's route-based buffer).
 *
 * For non-native tokens: checks nativeTokenBalance >= bufferedGasFee (gas is
 * paid in the chain's native asset) and fromToken.balance >= amount +
 * bufferedAdditiveFee (additive fees denominated in the source token).
 *
 * Returns a FusionQuoteError when the balance is insufficient, or
 * undefined when the amount is valid (or the check cannot yet be performed).
 */
export const useFeeValidation = ({
  fromToken,
  nativeTokenBalance,
  amount,
  quote
}: {
  fromToken: LocalTokenWithBalance | undefined
  nativeTokenBalance: bigint | undefined
  amount: bigint | undefined
  quote: Quote | null
}): {
  error: FusionQuoteError | undefined
  isValidating: boolean
  rawAdditiveFee: bigint
  bufferedAdditiveFee: bigint
  rawGasFee: bigint | undefined
  bufferedGasFee: bigint | undefined
} => {
  const { getNetwork } = useNetworks()

  const isNative = fromToken?.type === TokenType.NATIVE

  const fromNetwork = useMemo(
    () => (fromToken ? getNetwork(fromToken.networkChainId) : undefined),
    [fromToken, getNetwork]
  )

  // No buffer here — validation uses raw live fees. The buffer in
  // useMaxSwapAmount already makes the Max value conservative enough to
  // absorb normal bridge fee fluctuations between quote calls.
  const { buffered: bufferedAdditiveFee, raw: rawAdditiveFee } = useMemo(
    () => getTotalAdditiveSourceFee(fromToken, quote, 0),
    [fromToken, quote]
  )

  const {
    gasFee: bufferedGasFee,
    rawGasFee,
    error,
    isFetching
  } = useFeeEstimation({ quote, fromNetwork })

  const validationError = useMemo(() => {
    if (error && !isFetching) {
      return fusionErrors.gasEstimationFailed()
    }

    if (!fromToken || bufferedGasFee === undefined) return undefined

    if (isNative) {
      if (
        amount !== undefined &&
        fromToken.balance < amount + bufferedGasFee + bufferedAdditiveFee
      )
        return fusionErrors.insufficientBalanceForFees()
      return undefined
    }

    if (nativeTokenBalance !== undefined && nativeTokenBalance < bufferedGasFee)
      return fusionErrors.insufficientBalanceForFees()

    // Check additive fee coverage for ERC20/SPL tokens
    if (
      amount !== undefined &&
      bufferedAdditiveFee > 0n &&
      'decimals' in fromToken &&
      fromToken.balance < amount + bufferedAdditiveFee
    ) {
      const maxSwappable = fromToken.balance - bufferedAdditiveFee
      const formattedMax =
        maxSwappable > 0n
          ? `${formatTokenAmount(
              bigintToBig(maxSwappable, fromToken.decimals),
              fromToken.decimals
            )} ${fromToken.symbol}`
          : `0 ${fromToken.symbol}`
      return fusionErrors.insufficientBalanceForAdditiveFee(formattedMax)
    }

    return undefined
  }, [
    isNative,
    error,
    isFetching,
    fromToken,
    nativeTokenBalance,
    amount,
    bufferedGasFee,
    bufferedAdditiveFee
  ])

  return {
    error: validationError,
    isValidating: isFetching,
    rawAdditiveFee,
    bufferedAdditiveFee,
    rawGasFee,
    bufferedGasFee
  }
}
