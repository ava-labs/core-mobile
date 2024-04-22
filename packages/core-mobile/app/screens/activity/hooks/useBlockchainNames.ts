import {
  Blockchain,
  BridgeTransaction,
  useBridgeSDK
} from '@avalabs/bridge-sdk'
import {
  getBlockchainDisplayName,
  isPendingBridgeTransaction
} from 'screens/bridge/utils/bridgeUtils'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'
import { Transaction } from 'store/transaction'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { useNetworks } from 'hooks/networks/useNetworks'

/**
 * Get the source and target blockchain names to display a Bridge transaction.
 * @param tx Assumed to be a Bridge transaction for the active network
 */
export function useBlockchainNames(
  tx: Transaction | BridgeTransaction | BridgeTransfer
): {
  sourceBlockchain: string
  targetBlockchain: string
} {
  const { activeNetwork } = useNetworks()
  const pending = isPendingBridgeTransaction(tx)
  const { avalancheAssets } = useBridgeSDK()

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

  const symbol = (tx.token?.symbol ?? '').split('.')[0] ?? ''

  const txBlockchain = avalancheAssets[symbol]?.nativeNetwork
  const isBridgeToAvalanche = isAvalancheNetwork(activeNetwork)
    ? tx.isIncoming
    : tx.isOutgoing
  const chainDisplayName = getBlockchainDisplayName(txBlockchain) || 'N/A'
  const avalancheDisplay = getBlockchainDisplayName(Blockchain.AVALANCHE)

  return {
    sourceBlockchain: isBridgeToAvalanche ? chainDisplayName : avalancheDisplay,
    targetBlockchain: isBridgeToAvalanche ? avalancheDisplay : chainDisplayName
  }
}

function titleCase(name: string): string {
  if (name.length === 0) return ''
  return name[0]?.toUpperCase() + name.slice(1)
}
