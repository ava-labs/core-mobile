import { Transaction } from 'store/transaction'
import { useNetworks } from 'hooks/networks/useNetworks'

/**
 * Get the source and target blockchain names for a transaction whose
 * `bridgeAnalysis` field has been populated by `UnifiedBridgeService.analyzeTx`.
 */
export function useBlockchainNames(tx: Transaction): {
  sourceBlockchain: string | undefined
  targetBlockchain: string | undefined
} {
  const { getNetworkByCaip2ChainId, getNetwork } = useNetworks()

  if (!tx.bridgeAnalysis?.isBridgeTx) {
    return {
      sourceBlockchain: undefined,
      targetBlockchain: undefined
    }
  }

  const { sourceChainId, targetChainId } = tx.bridgeAnalysis

  return {
    sourceBlockchain: sourceChainId
      ? getNetworkByCaip2ChainId(sourceChainId)?.chainName ??
        getNetwork(Number(sourceChainId))?.chainName ??
        sourceChainId
      : undefined,
    targetBlockchain: targetChainId
      ? getNetworkByCaip2ChainId(targetChainId)?.chainName ??
        getNetwork(Number(targetChainId))?.chainName ??
        targetChainId
      : undefined
  }
}
