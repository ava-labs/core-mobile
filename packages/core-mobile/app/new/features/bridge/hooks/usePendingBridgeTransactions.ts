import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { selectBridgeTransactions } from 'store/bridge'
import { selectPendingTransfers } from 'store/unifiedBridge/slice'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const usePendingLegacyBridgeTransactions = (
  chainId?: number
): BridgeTransaction[] => {
  const pendingBridgeByTxId = useSelector(selectBridgeTransactions)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useMemo(() => {
    if (!chainId) {
      return Object.values(pendingBridgeByTxId)
    }

    const networkNameToCheck = isBitcoinChainId(chainId)
      ? BridgeNetwork.BITCOIN
      : isAvalancheCChainId(chainId)
      ? BridgeNetwork.AVALANCHE
      : isEthereumChainId(chainId)
      ? BridgeNetwork.ETHEREUM
      : null

    return [
      ...Object.values(pendingBridgeByTxId).filter(
        tx =>
          (tx.sourceChain.valueOf() === networkNameToCheck ||
            tx.targetChain.valueOf() === networkNameToCheck) &&
          tx.environment === (isDeveloperMode ? 'test' : 'main')
      )
    ]
  }, [chainId, pendingBridgeByTxId, isDeveloperMode])
}

const usePendingUnifiedBridgeTransactions = (
  chainId?: number
): BridgeTransfer[] => {
  const pendingTransfer = useSelector(selectPendingTransfers)

  return useMemo(() => {
    return [
      ...Object.values(pendingTransfer).filter(
        tx =>
          // filter pending transactions that don't belong to the given network
          chainId === getChainIdFromCaip2(tx.sourceChain.chainId) ||
          chainId === getChainIdFromCaip2(tx.targetChain.chainId)
      )
    ]
  }, [pendingTransfer, chainId])
}

const usePendingBridgeTransactions = (
  chainId?: number
): Array<BridgeTransaction | BridgeTransfer> => {
  const legacyBridgeTransfers = usePendingLegacyBridgeTransactions(chainId)
  const unifiedBridgeTransfers = usePendingUnifiedBridgeTransactions(chainId)

  return useMemo(() => {
    return [
      ...Object.values(legacyBridgeTransfers),
      ...Object.values(unifiedBridgeTransfers)
    ]
  }, [unifiedBridgeTransfers, legacyBridgeTransfers])
}

enum BridgeNetwork {
  AVALANCHE = 'avalanche',
  BITCOIN = 'bitcoin',
  ETHEREUM = 'ethereum'
}

export default usePendingBridgeTransactions
