import Big from 'big.js'
import {
  BIG_ZERO,
  Blockchain,
  isNativeAsset,
  useBridgeSDK,
  useMaxTransferAmount,
  WrapStatus
} from '@avalabs/bridge-sdk'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useAssetBalancesEVM } from 'screens/bridge/hooks/useAssetBalancesEVM'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { useEthereumProvider } from 'hooks/networkProviderHooks'
import { selectBridgeAppConfig } from 'store/bridge'
import { useNetworkFee } from 'hooks/useNetworkFee'
import AnalyticsService from 'services/analytics/AnalyticsService'

/**
 * Hook for when the bridge source chain is Ethereum
 */
export function useEthBridge(
  amount: Big,
  bridgeFee: Big,
  minimum: Big
): BridgeAdapter {
  const { currentAssetData } = useBridgeSDK()

  const { createBridgeTransaction, transferAsset } = useBridgeContext()

  const { assetsWithBalances, loading } = useAssetBalancesEVM(
    Blockchain.ETHEREUM
  )

  const sourceBalance = useMemo(
    () =>
      assetsWithBalances.find(
        ({ asset }) => asset.symbol === currentAssetData?.symbol
      ),
    [assetsWithBalances, currentAssetData?.symbol]
  )

  const network = useSelector(selectActiveNetwork)
  const { data: networkFee } = useNetworkFee(network)
  const activeAccount = useSelector(selectActiveAccount)
  const config = useSelector(selectBridgeAppConfig)
  const ethereumProvider = useEthereumProvider()
  const [wrapStatus, setWrapStatus] = useState<WrapStatus>(WrapStatus.INITIAL)
  const [txHash, setTxHash] = useState<string>()

  const maximum =
    useMaxTransferAmount(
      sourceBalance?.balance,
      activeAccount?.address,
      ethereumProvider
    ) || undefined
  const receiveAmount = amount.gt(minimum) ? amount.minus(bridgeFee) : BIG_ZERO

  const transfer = useCallback(async () => {
    if (!currentAssetData || !network || !config) {
      return Promise.reject()
    }

    const timestamp = Date.now()
    const symbol = isNativeAsset(currentAssetData)
      ? currentAssetData.wrappedAssetSymbol
      : currentAssetData.symbol

    //this transfer is part of the Bridge context
    const result = await transferAsset(
      amount,
      currentAssetData,
      setWrapStatus,
      setTxHash,
      networkFee?.low.maxFeePerGas
    )

    AnalyticsService.captureWithEncryption('BridgeTransactionStarted', {
      chainId: network.chainId,
      sourceTxHash: result?.hash ?? '',
      fromAddress: activeAccount?.address
    })

    createBridgeTransaction(
      {
        sourceChain: Blockchain.ETHEREUM,
        sourceTxHash: result?.hash ?? '',
        sourceStartedAt: timestamp,
        targetChain: Blockchain.AVALANCHE,
        amount,
        symbol
      },
      network
    )

    return result?.hash
  }, [
    currentAssetData,
    network,
    config,
    transferAsset,
    amount,
    networkFee?.low.maxFeePerGas,
    createBridgeTransaction,
    activeAccount
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    loading,
    receiveAmount,
    maximum,
    wrapStatus,
    txHash,
    transfer
  }
}
