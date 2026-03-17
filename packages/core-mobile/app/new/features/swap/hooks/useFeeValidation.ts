import { TokenType } from '@avalabs/vm-module-types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectFusionBridgeFeeSafetyBps } from 'store/posthog'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { LocalTokenWithBalance } from 'store/balance'
import { FusionQuoteError, fusionErrors } from '../utils/fusionErrors'
import type { Quote } from '../types'
import { getNativeBridgeFee } from '../utils/bridgeFee'
import { useFeeEstimation } from './useFeeEstimation'

/**
 * Validates whether the user's balance is sufficient to cover the swap amount
 * plus gas and bridge fees.
 *
 * For native tokens: checks fromToken.balance >= amount + gasFee + bridgeFee.
 * For non-native tokens: checks nativeTokenBalance >= gasFee (gas is paid in
 * the chain's native asset separately; no bridge fee applies).
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

  const { gasFee, error } = useFeeEstimation({ quote, fromNetwork })

  return useMemo(() => {
    if (error) {
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

    return undefined
  }, [
    isNative,
    error,
    fromToken,
    nativeTokenBalance,
    amount,
    gasFee,
    bridgeFee
  ])
}
