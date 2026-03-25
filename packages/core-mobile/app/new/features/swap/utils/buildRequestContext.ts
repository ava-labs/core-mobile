import { TransferStepDetails } from '@avalabs/fusion-sdk'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { RequestContext } from 'store/rpc/types'

export function buildRequestContext({
  currentSignature,
  requiredSignatures,
  quote
}: TransferStepDetails): Record<string, unknown> {
  const isCrossChainSwap =
    quote.sourceChain.chainId !== quote.targetChain.chainId
  const isIntermediateTransaction = currentSignature < requiredSignatures

  if (isCrossChainSwap || isIntermediateTransaction) {
    // Suppress all transaction feedback — no toasts or confetti at any stage
    return { [RequestContext.SUPPRESS_TX_FEEDBACK]: true }
  }

  const numericChainId = getChainIdFromCaip2(quote.sourceChain.chainId)
  const isAvalanche =
    numericChainId !== undefined && isAvalancheChainId(numericChainId)

  if (isAvalanche) {
    // ApprovalController handles Avalanche in-app swaps via isInAppAvalancheRequest:
    // onTransactionPending → "Transaction sent" + confetti
    // onTransactionConfirmed → nothing
    return {}
  }

  // Non-Avalanche same-chain final step (e.g. Solana): show "Transaction sent"
  // immediately and suppress the success toast and confetti — the notification
  // center tracks the authoritative final status
  return {
    [RequestContext.IMMEDIATE_SENT_TOAST]: true,
    [RequestContext.SUCCESS_TOAST_DISABLED]: true,
    [RequestContext.CONFETTI_DISABLED]: true
  }
}
