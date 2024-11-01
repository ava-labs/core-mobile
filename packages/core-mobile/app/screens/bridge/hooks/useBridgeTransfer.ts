import { BridgeAsset, UnifiedBridgeService } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { setPendingTransfer } from 'store/unifiedBridge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { noop } from '@avalabs/core-utils-sdk'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import { buildChain, isUnifiedBridgeAsset } from '../utils/bridgeUtils'

export const useBridgeTransfer = ({
  unifiedBridge,
  amount,
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  unifiedBridge: UnifiedBridgeService | undefined
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

    if (!isUnifiedBridgeAsset(bridgeAsset)) {
      throw new Error('Asset is not supported ')
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

    if (!unifiedBridge) {
      throw new Error('No bridge service')
    }

    const sourceChain = buildChain(sourceNetwork)
    const targetChain = buildChain(targetNetwork)
    const fromAddress = isBitcoinNetwork(sourceNetwork)
      ? activeAccount.addressBTC
      : activeAccount.addressC
    const toAddress = isBitcoinNetwork(targetNetwork)
      ? activeAccount.addressBTC
      : activeAccount.addressC

    const pendingTransfer = await unifiedBridge.transferAsset({
      asset: bridgeAsset,
      fromAddress,
      toAddress,
      amount,
      sourceChain,
      targetChain,
      onStepChange: noop
    })

    unifiedBridge.trackTransfer({
      bridgeTransfer: pendingTransfer,
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
    dispatch,
    unifiedBridge
  ])
}
