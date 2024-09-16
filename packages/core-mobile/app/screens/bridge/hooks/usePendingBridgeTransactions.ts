import { BridgeTransfer } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectPendingTransfers } from 'store/unifiedBridge/slice'
import { caipToChainId } from 'utils/data/caip'

const usePendingBridgeTransactions = (
  network?: Network
): Array<BridgeTransfer> => {
  const pendingTransfer = useSelector(selectPendingTransfers)

  return useMemo(() => {
    return [
      ...Object.values(pendingTransfer).filter(
        tx =>
          // filter pending transactions that don't belong to the given network
          network?.chainId === caipToChainId(tx.sourceChain.chainId) ||
          network?.chainId === caipToChainId(tx.targetChain.chainId)
      )
    ]
  }, [pendingTransfer, network?.chainId])
}

export default usePendingBridgeTransactions
