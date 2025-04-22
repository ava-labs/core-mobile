import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import { selectBridgeTransactions } from 'store/bridge'
import { selectPendingTransfers } from 'store/unifiedBridge/slice'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'

const usePendingLegacyBridgeTransactions = (
  network?: Network
): BridgeTransaction[] => {
  const pendingBridgeByTxId = useSelector(selectBridgeTransactions)

  return useMemo(() => {
    if (!network) {
      return Object.values(pendingBridgeByTxId)
    }

    const networkNameToCheck = isBitcoinNetwork(network)
      ? BridgeNetwork.BITCOIN
      : isAvalancheNetwork(network)
      ? BridgeNetwork.AVALANCHE
      : isEthereumNetwork(network)
      ? BridgeNetwork.ETHEREUM
      : null

    return [
      ...Object.values(pendingBridgeByTxId).filter(
        tx =>
          (tx.sourceChain.valueOf() === networkNameToCheck ||
            tx.targetChain.valueOf() === networkNameToCheck) &&
          tx.environment === (network.isTestnet ? 'test' : 'main')
      )
    ]
  }, [network, pendingBridgeByTxId])
}

const usePendingUnifiedBridgeTransactions = (
  network?: Network
): BridgeTransfer[] => {
  const pendingTransfer = useSelector(selectPendingTransfers)

  return useMemo(() => {
    return [
      ...Object.values(pendingTransfer).filter(
        tx =>
          // filter pending transactions that don't belong to the given network
          network?.chainId === getChainIdFromCaip2(tx.sourceChain.chainId) ||
          network?.chainId === getChainIdFromCaip2(tx.targetChain.chainId)
      )
    ]
  }, [pendingTransfer, network?.chainId])
}

const usePendingBridgeTransactions = (
  network?: Network
): Array<BridgeTransaction | BridgeTransfer> => {
  const legacyBridgeTransfers = usePendingLegacyBridgeTransactions(network)
  const unifiedBridgeTransfers = usePendingUnifiedBridgeTransactions(network)

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
