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
import { selectActiveAccount } from 'store/account'
import { useEthereumProvider } from 'hooks/networks/networkProviderHooks'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import Logger from 'utils/Logger'
import { noop } from '@avalabs/utils-sdk'
import { useTransferAssetEVM } from './useTransferAssetEVM'

/**
 * Hook for transferring assets from Ethereum to Avalanche (wrapping)
 */
export function useEthBridge({
  amount,
  bridgeFee,
  minimum
}: {
  amount: Big
  bridgeFee: Big
  minimum: Big
}): BridgeAdapter {
  const { currentAssetData } = useBridgeSDK()

  const { createBridgeTransaction } = useBridgeContext()
  const { transfer: transferEVM } = useTransferAssetEVM()
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

  const { activeNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const ethereumProvider = useEthereumProvider()
  const [wrapStatus, setWrapStatus] = useState<WrapStatus>(WrapStatus.INITIAL)

  const maximum =
    useMaxTransferAmount(
      sourceBalance?.balance,
      activeAccount?.addressC,
      ethereumProvider
    ) || undefined

  const receiveAmount = amount.gt(minimum) ? amount.minus(bridgeFee) : BIG_ZERO

  const transfer = useCallback(async () => {
    if (!activeAccount) return Promise.reject('Active account not found')

    if (!currentAssetData) return Promise.reject('Asset not found')

    const timestamp = Date.now()
    const symbol = isNativeAsset(currentAssetData)
      ? currentAssetData.wrappedAssetSymbol
      : currentAssetData.symbol

    // this transfer is part of the Bridge context
    const transactionHash = await transferEVM({
      amount,
      asset: currentAssetData,
      onStatusChange: setWrapStatus,
      onTxHashChange: noop
    })

    if (!transactionHash) return Promise.reject('Failed to transfer')

    AnalyticsService.captureWithEncryption('BridgeTransactionStarted', {
      chainId: activeNetwork.chainId,
      sourceTxHash: transactionHash,
      fromAddress: activeAccount?.addressC
    })

    createBridgeTransaction(
      {
        sourceChain: Blockchain.ETHEREUM,
        sourceTxHash: transactionHash,
        sourceStartedAt: timestamp,
        targetChain: Blockchain.AVALANCHE,
        amount,
        symbol
      },
      activeNetwork
    ).catch(Logger.error)

    return transactionHash
  }, [
    activeAccount,
    currentAssetData,
    transferEVM,
    amount,
    activeNetwork,
    createBridgeTransaction
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    loading,
    receiveAmount,
    maximum,
    wrapStatus,
    transfer
  }
}
