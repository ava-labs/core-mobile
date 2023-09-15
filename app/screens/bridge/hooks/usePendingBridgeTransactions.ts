import { Network } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { selectBridgeTransactions } from 'store/bridge'

const usePendingBridgeTransactions = (network?: Network) => {
  const pendingBridgeByTxId = useSelector(selectBridgeTransactions)

  if (network) {
    return Object.values(pendingBridgeByTxId).filter(
      tx => tx.symbol === network.networkToken.symbol
    )
  } else {
    return Object.values(pendingBridgeByTxId)
  }
}

export default usePendingBridgeTransactions
