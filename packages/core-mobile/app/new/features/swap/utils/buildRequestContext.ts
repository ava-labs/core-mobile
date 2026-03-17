import { TransferStepDetails } from '@avalabs/fusion-sdk'
import { RequestContext } from 'store/rpc/types'

export function buildRequestContext({
  currentSignature,
  requiredSignatures,
  quote
}: TransferStepDetails): Record<string, unknown> {
  const isCrossChainSwap =
    quote.sourceChain.chainId !== quote.targetChain.chainId
  const isIntermediateTransaction = currentSignature < requiredSignatures

  return {
    // Suppresses all toasts and confetti for cross-chain swaps and intermediate steps
    [RequestContext.TOASTS_AND_CONFETTI_DISABLED]:
      isCrossChainSwap || isIntermediateTransaction
  }
}
