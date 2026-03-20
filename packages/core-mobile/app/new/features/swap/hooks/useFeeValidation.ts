import { TokenType } from '@avalabs/vm-module-types'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  selectFusionBridgeFeeSafetyBps,
  selectFusionAdditiveFeesSafetyBps
} from 'store/posthog'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { LocalTokenWithBalance } from 'store/balance'
import { FusionQuoteError, fusionErrors } from '../utils/fusionErrors'
import type { Quote } from '../types'
import {
  getNativeBridgeFee,
  getSourceTokenAdditiveFee
} from '../utils/bridgeFee'
import { useFeeEstimation } from './useFeeEstimation'

/**
 * Validates whether the user's balance is sufficient to cover the swap amount
 * plus gas and bridge fees.
 *
 * For native tokens: checks fromToken.balance >= amount + gasFee + bridgeFee.
 * For non-native tokens: checks nativeTokenBalance >= gasFee (gas is paid in
 * the chain's native asset separately) and fromToken.balance >= amount + additiveFee
 * (non-bridge additive fees in the source token must also be covered).
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
}): FusionQuoteError | undefined => {
  const bridgeFeeSafetyBps = useSelector(selectFusionBridgeFeeSafetyBps)
  const additiveFeesBufferBps = useSelector(selectFusionAdditiveFeesSafetyBps)
  const { getNetwork } = useNetworks()

  const isNative = fromToken?.type === TokenType.NATIVE

  const fromNetwork = useMemo(
    () => (fromToken ? getNetwork(fromToken.networkChainId) : undefined),
    [fromToken, getNetwork]
  )

  const bridgeFee = useMemo(
    () => getNativeBridgeFee(isNative, quote, bridgeFeeSafetyBps),
    [isNative, quote, bridgeFeeSafetyBps]
  )

  const additiveFee = useMemo(
    () => getSourceTokenAdditiveFee(fromToken, quote, additiveFeesBufferBps),
    [fromToken, quote, additiveFeesBufferBps]
  )

  const { gasFee, error, isFetching } = useFeeEstimation({ quote, fromNetwork })

  return useMemo(() => {
    if (error && !isFetching) {
      return fusionErrors.gasEstimationFailed()
    }

    if (!fromToken || gasFee === undefined) return undefined

    if (isNative) {
      if (
        amount !== undefined &&
        fromToken.balance < amount + gasFee + bridgeFee
      )
        return fusionErrors.insufficientBalanceForFees()
      return undefined
    }

    if (nativeTokenBalance !== undefined && nativeTokenBalance < gasFee)
      return fusionErrors.insufficientBalanceForFees()

    // Check additive fee coverage for ERC20/SPL tokens (uses live quote fees)
    if (
      amount !== undefined &&
      additiveFee > 0n &&
      'decimals' in fromToken &&
      fromToken.balance < amount + additiveFee
    ) {
      const maxSwappable = fromToken.balance - additiveFee
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
    gasFee,
    bridgeFee,
    additiveFee
  ])
}
