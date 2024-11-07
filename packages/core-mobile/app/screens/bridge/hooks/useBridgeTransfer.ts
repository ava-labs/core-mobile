import { BridgeAsset } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { setPendingTransfer } from 'store/unifiedBridge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'

export const useBridgeTransfer = ({
  amount,
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  amount: bigint
  bridgeAsset: BridgeAsset | undefined
  sourceNetwork: Network | undefined
  targetNetwork: Network | undefined
}): (() => Promise<string | undefined>) => {
  const activeAccount = useSelector(selectActiveAccount)
  const dispatch = useDispatch()

  return useCallback(async () => {
    if (!bridgeAsset) {
      throw new Error('No asset chosen')
    }

    if (!sourceNetwork) {
      throw new Error('Invalid source network')
    }

    if (!targetNetwork) {
      throw new Error('Invalid target network')
    }

    if (!activeAccount) {
      throw new Error('No active account')
    }

    const fromAddress = isBitcoinNetwork(sourceNetwork)
      ? activeAccount.addressBTC
      : activeAccount.addressC
    const toAddress = isBitcoinNetwork(targetNetwork)
      ? activeAccount.addressBTC
      : activeAccount.addressC

    const pendingTransfer = await UnifiedBridgeService.transfer({
      asset: bridgeAsset,
      fromAddress,
      toAddress,
      amount,
      sourceNetwork,
      targetNetwork,
      updateListener: updatedTransfer => {
        dispatch(setPendingTransfer(updatedTransfer))
      }
    })

    AnalyticsService.capture('UnifedBridgeTransferStarted', {
      bridgeType: 'CCTP',
      activeChainId: sourceNetwork.chainId,
      targetChainId: targetNetwork.chainId
    })

    AnalyticsService.captureWithEncryption('BridgeTransactionStarted', {
      chainId: sourceNetwork.chainId,
      sourceTxHash: pendingTransfer.sourceTxHash,
      fromAddress: pendingTransfer.fromAddress,
      toAddress: pendingTransfer.toAddress
    })

    dispatch(setPendingTransfer(pendingTransfer))

    return pendingTransfer.sourceTxHash
  }, [
    bridgeAsset,
    targetNetwork,
    activeAccount,
    amount,
    sourceNetwork,
    dispatch
  ])
}
