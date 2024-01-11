import { BridgeTransaction } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import { selectBridgeTransactions } from 'store/bridge'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'

const usePendingBridgeTransactions = (
  network?: Network
): BridgeTransaction[] => {
  const pendingBridgeByTxId = useSelector(selectBridgeTransactions)

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

  return Object.values(pendingBridgeByTxId).filter(
    tx =>
      (tx.sourceChain.valueOf() === networkNameToCheck ||
        tx.targetChain.valueOf() === networkNameToCheck) &&
      tx.environment === (network.isTestnet ? 'test' : 'main')
  )
}

enum BridgeNetwork {
  AVALANCHE = 'avalanche',
  BITCOIN = 'bitcoin',
  ETHEREUM = 'ethereum'
}

export default usePendingBridgeTransactions
