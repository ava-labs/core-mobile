import { BridgeTransfer } from '@avalabs/bridge-unified'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectPendingTransfers } from 'store/unifiedBridge/slice'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'

const usePendingBridgeTransactions = (chainId?: number): BridgeTransfer[] => {
  const pendingTransfer = useSelector(selectPendingTransfers)

  return useMemo(() => {
    if (!chainId) {
      return Object.values(pendingTransfer)
    }

    return Object.values(pendingTransfer).filter(
      tx =>
        chainId === getChainIdFromCaip2(tx.sourceChain.chainId) ||
        chainId === getChainIdFromCaip2(tx.targetChain.chainId)
    )
  }, [pendingTransfer, chainId])
}

export default usePendingBridgeTransactions
