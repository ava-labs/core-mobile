import Big from 'big.js'
import { BIG_ZERO, bigToBigInt, bigintToBig } from '@avalabs/core-utils-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Blockchain } from '@avalabs/core-bridge-sdk'
import { useDispatch, useSelector } from 'react-redux'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { selectActiveAccount } from 'store/account/slice'
import { setPendingTransfer } from 'store/unifiedBridge/slice'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useNetworksFromCaip2ChainIds } from 'temp/caip2ChainIds'
import { Network } from '@avalabs/core-chains-sdk'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { isUnifiedBridgeAsset } from '../../utils/bridgeUtils'
import { useUnifiedBridgeAssets } from '../useUnifiedBridgeAssets'
import { useAssetBalancesEVM } from '../useAssetBalancesEVM'
import { BridgeAdapter } from '../useBridge'
import { getSourceBalance } from './utils'
interface UnifiedBridge extends BridgeAdapter {
  isAssetSupported: boolean
}

/**
 * Hook for when the Unified Bridge SDK can handle the transfer
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export const useUnifiedBridge = (amount: Big): UnifiedBridge => {
  const { request } = useInAppRequest()
  const dispatch = useDispatch()
  const [sourceNetwork, setSourceNetwork] = useState<Network>()
  const [targetNetwork, setTargetNetwork] = useState<Network>()
  const [selectedBridgeAsset, setSelectedBridgeAsset] = useState<BridgeAsset>()
  const activeAccount = useSelector(selectActiveAccount)
  const { bridgeAssets, chainAssetMap } = useUnifiedBridgeAssets()
  const [bridgeError, setBridgeError] = useState<Error>()

  const [receiveAmount, setReceiveAmount] = useState<Big>()
  const [minimum, setMinimum] = useState<Big>()
  const [bridgeFee, setBridgeFee] = useState<Big>()

  const { assetsWithBalances, loading } = useAssetBalancesEVM(
    sourceNetwork && isEthereumNetwork(sourceNetwork)
      ? Blockchain.ETHEREUM
      : Blockchain.AVALANCHE
  )

  const sourceBalance = useMemo(
    () => getSourceBalance(selectedBridgeAsset, assetsWithBalances),
    [selectedBridgeAsset, assetsWithBalances]
  )

  const sourceNetworks = useNetworksFromCaip2ChainIds(
    Object.keys(chainAssetMap ?? [])
  )

  const targetNetworks = useNetworksFromCaip2ChainIds(
    Object.keys(selectedBridgeAsset?.destinations ?? [])
  )

  useEffect(() => {
    const getFee = async (): Promise<void> => {
      const hasAmount = amount && !amount.eq(BIG_ZERO)

      if (selectedBridgeAsset && hasAmount && targetNetwork && sourceNetwork) {
        const fee = await UnifiedBridgeService.getFee({
          asset: selectedBridgeAsset,
          amount: bigToBigInt(amount, selectedBridgeAsset.decimals),
          sourceNetwork: sourceNetwork,
          targetNetwork: targetNetwork
        })

        const feeBig = bigintToBig(fee, selectedBridgeAsset.decimals)

        setBridgeFee(feeBig)
        setMinimum(feeBig)
        setReceiveAmount(amount.sub(feeBig))
      }
    }

    getFee().catch(error => {
      Logger.error(error)
      setBridgeError(error)
    })
  }, [amount, sourceBalance, selectedBridgeAsset, targetNetwork, sourceNetwork])

  const transfer = useCallback(async () => {
    if (!selectedBridgeAsset) {
      throw new Error('No asset chosen')
    }

    if (!isUnifiedBridgeAsset(selectedBridgeAsset)) {
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

    const pendingTransfer = await UnifiedBridgeService.transfer({
      asset: selectedBridgeAsset,
      amount: bigToBigInt(amount, selectedBridgeAsset.decimals),
      targetNetwork,
      sourceNetwork,
      activeAccount,
      updateListener: updatedTransfer => {
        dispatch(setPendingTransfer(updatedTransfer))
      },
      request
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
    selectedBridgeAsset,
    targetNetwork,
    activeAccount,
    amount,
    sourceNetwork,
    dispatch,
    request
  ])

  useEffect(() => {
    if (!selectedBridgeAsset) {
      setSelectedBridgeAsset(bridgeAssets[0])
    }
  }, [selectedBridgeAsset, bridgeAssets])

  useEffect(() => {
    if (targetNetworks.length === 0) {
      return
    }

    if (
      !targetNetwork ||
      !targetNetworks.find(network => network.chainId === targetNetwork.chainId)
    ) {
      setTargetNetwork(targetNetworks[0])
    }
  }, [targetNetworks, targetNetwork])

  return {
    sourceBalance,
    loading,
    assetsWithBalances,
    receiveAmount,
    bridgeFee,
    maximum: sourceBalance?.balance,
    minimum,
    transfer,
    isAssetSupported: true,
    sourceNetworks,
    targetNetworks,
    sourceNetwork,
    setSourceNetwork,
    targetNetwork,
    setTargetNetwork,
    bridgeAssets,
    selectedBridgeAsset,
    setSelectedBridgeAsset,
    error: bridgeError
  }
}
