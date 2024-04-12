import Big from 'big.js'
import { BIG_ZERO, bigToBigInt, bigintToBig } from '@avalabs/utils-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Blockchain, useBridgeSDK } from '@avalabs/bridge-sdk'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { selectActiveAccount } from 'store/account/slice'
import { setPendingTransfer } from 'store/unifiedBridge/slice'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NetworkTokenUnit } from 'types'
import { useNetworks } from 'hooks/useNetworks'
import { isUnifiedBridgeAsset } from '../../utils/bridgeUtils'
import { AssetBalance } from '../../utils/types'
import { useUnifiedBridgeAssets } from '../useUnifiedBridgeAssets'
import { useAssetBalancesEVM } from '../useAssetBalancesEVM'
import { BridgeAdapter } from '../useBridge'
import { Eip1559Fees } from '../../../../utils/Utils'
import {
  getIsAssetSupported,
  getSourceBalance,
  getTargetChainId
} from './utils'

interface UnifiedBridge extends BridgeAdapter {
  isAssetSupported: boolean
}

/**
 * Hook for when the Unified Bridge SDK can handle the transfer
 */
export const useUnifiedBridge = (
  amount: Big,
  eip1559Fees: Eip1559Fees<NetworkTokenUnit>,
  selectedAsset?: AssetBalance
): UnifiedBridge => {
  const dispatch = useDispatch()
  const { activeNetwork, getNetwork } = useNetworks()
  const { currentBlockchain, targetBlockchain } = useBridgeSDK()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const { assets } = useUnifiedBridgeAssets()
  const [receiveAmount, setReceiveAmount] = useState<Big>()
  const [minimum, setMinimum] = useState<Big>()
  const [bridgeFee, setBridgeFee] = useState<Big>()

  const isEthereum = currentBlockchain === Blockchain.ETHEREUM

  const { assetsWithBalances, loading } = useAssetBalancesEVM(
    isEthereum ? Blockchain.ETHEREUM : Blockchain.AVALANCHE
  )

  const targetChainId = useMemo(
    () => getTargetChainId(isDeveloperMode, targetBlockchain),
    [isDeveloperMode, targetBlockchain]
  )

  const targetNetwork = getNetwork(targetChainId)

  const isAssetSupported = useMemo(
    () => getIsAssetSupported(selectedAsset, assets, targetChainId),
    [assets, selectedAsset, targetChainId]
  )

  const sourceBalance = useMemo(
    () => getSourceBalance(selectedAsset, assetsWithBalances),
    [selectedAsset, assetsWithBalances]
  )

  const [txHash, setTxHash] = useState<string>()

  const maximum = sourceBalance?.balance

  useEffect(() => {
    const getFee = async (): Promise<void> => {
      const hasAmount = amount && !amount.eq(BIG_ZERO)

      if (
        selectedAsset &&
        isUnifiedBridgeAsset(selectedAsset.asset) &&
        hasAmount &&
        targetNetwork
      ) {
        const fee = await UnifiedBridgeService.getFee({
          asset: selectedAsset.asset,
          amount: bigToBigInt(amount, selectedAsset.asset.decimals),
          sourceNetwork: activeNetwork,
          targetNetwork: targetNetwork
        })

        const feeBig = bigintToBig(fee, selectedAsset.asset.decimals)

        setBridgeFee(feeBig)
        setMinimum(feeBig)
        setReceiveAmount(amount.sub(feeBig))
      }
    }

    getFee().catch(Logger.error)
  }, [
    amount,
    targetChainId,
    sourceBalance,
    selectedAsset?.asset,
    targetNetwork,
    activeNetwork,
    selectedAsset
  ])

  const transfer = useCallback(async () => {
    if (!selectedAsset) {
      throw new Error('No asset chosen')
    }

    if (!isUnifiedBridgeAsset(selectedAsset.asset)) {
      throw new Error('Asset is not supported ')
    }

    if (!targetNetwork) {
      throw new Error('Invalid target network')
    }

    if (!activeAccount) {
      throw new Error('No active account')
    }

    const pendingTransfer = await UnifiedBridgeService.transfer({
      asset: selectedAsset.asset,
      amount: bigToBigInt(amount, selectedAsset.asset.decimals),
      targetNetwork,
      activeNetwork,
      activeAccount,
      updateListener: updatedTransfer => {
        dispatch(setPendingTransfer(updatedTransfer))
      },
      eip1559Fees
    })

    AnalyticsService.capture('UnifedBridgeTransferStarted', {
      bridgeType: 'CCTP',
      activeChainId: activeNetwork.chainId,
      targetChainId: targetNetwork.chainId
    })

    AnalyticsService.captureWithEncryption('BridgeTransactionStarted', {
      chainId: activeNetwork.chainId,
      sourceTxHash: pendingTransfer.sourceTxHash,
      fromAddress: pendingTransfer.fromAddress,
      toAddress: pendingTransfer.toAddress
    })

    dispatch(setPendingTransfer(pendingTransfer))
    setTxHash(pendingTransfer.sourceTxHash)

    return pendingTransfer.sourceTxHash
  }, [
    selectedAsset,
    targetNetwork,
    activeAccount,
    amount,
    activeNetwork,
    eip1559Fees,
    dispatch
  ])

  return {
    sourceBalance,
    loading,
    assetsWithBalances,
    receiveAmount,
    bridgeFee,
    maximum,
    minimum,
    txHash,
    transfer,
    isAssetSupported
  }
}
