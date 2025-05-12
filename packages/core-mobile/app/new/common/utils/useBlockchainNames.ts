import { Transaction } from 'store/transaction'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { useNetworks } from 'hooks/networks/useNetworks'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { isPendingBridgeTransaction } from './bridgeUtils'

/**
 * Get the source and target blockchain names to display a Bridge transaction.
 * @param tx Assumed to be a Bridge transaction for the active network
 */
export function useBlockchainNames(
  tx: Transaction | BridgeTransaction | BridgeTransfer
): {
  sourceBlockchain: string | undefined
  targetBlockchain: string | undefined
} {
  const { getNetworkByCaip2ChainId, getNetwork } = useNetworks()
  const pending = isPendingBridgeTransaction(tx)

  if (pending) {
    return {
      sourceBlockchain: titleCase(
        typeof tx.sourceChain === 'object'
          ? tx.sourceChain.chainName
          : tx.sourceChain
      ),
      targetBlockchain: titleCase(
        typeof tx.targetChain === 'object'
          ? tx.targetChain.chainName
          : tx.targetChain
      )
    }
  }

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

function titleCase(name: string): string {
  if (name.length === 0) return ''
  return name[0]?.toUpperCase() + name.slice(1)
}
