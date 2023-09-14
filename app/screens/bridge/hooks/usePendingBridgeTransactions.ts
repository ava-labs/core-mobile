import { Network } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { selectBridgeTransactions } from 'store/bridge'

const usePendingBridgeTransactions = (network: Network) => {
  const pendingBridgeByTxId = useSelector(selectBridgeTransactions)

  return Object.values(pendingBridgeByTxId).filter(
    tx => tx.symbol === network.networkToken.symbol
  )
}

export default usePendingBridgeTransactions
