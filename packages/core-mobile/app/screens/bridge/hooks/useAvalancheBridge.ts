import { BIG_ZERO, Blockchain, useBridgeSDK } from '@avalabs/core-bridge-sdk'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useMemo } from 'react'
import { useAssetBalancesEVM } from 'screens/bridge/hooks/useAssetBalancesEVM'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { useNetworks } from 'hooks/networks/useNetworks'
import Logger from 'utils/Logger'
import { noop } from '@avalabs/core-utils-sdk'
import { useTransferAssetEVM } from './useTransferAssetEVM'

/**
 * Hook for transferring assets from Avalanche to Ethereum (unwrapping)
 */
export function useAvalancheBridge({
  amount,
  bridgeFee,
  minimum
}: {
  amount: Big
  bridgeFee: Big
  minimum: Big
}): BridgeAdapter {
  const { activeNetwork } = useNetworks()
  const { targetBlockchain, currentAssetData } = useBridgeSDK()
  const { createBridgeTransaction } = useBridgeContext()
  const { transfer: transferEVM } = useTransferAssetEVM()
  const activeAccount = useSelector(selectActiveAccount)

  const { assetsWithBalances, loading } = useAssetBalancesEVM(
    Blockchain.AVALANCHE
  )

  const sourceBalance = useMemo(
    () =>
      assetsWithBalances.find(
        ({ asset }) => asset.symbol === currentAssetData?.symbol
      ),
    [assetsWithBalances, currentAssetData?.symbol]
  )

  const maximum = sourceBalance?.balance || BIG_ZERO
  const receiveAmount = amount.gt(minimum) ? amount.minus(bridgeFee) : BIG_ZERO

  const transfer = useCallback(async () => {
    if (!currentAssetData) return Promise.reject('Asset not found')

    const timestamp = Date.now()

    const transactionHash = await transferEVM({
      amount,
      asset: currentAssetData,
      onStatusChange: noop,
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
        sourceChain: Blockchain.AVALANCHE,
        sourceTxHash: transactionHash,
        sourceStartedAt: timestamp,
        targetChain: targetBlockchain,
        amount,
        symbol: currentAssetData.symbol
      },
      activeNetwork
    ).catch(Logger.error)

    return transactionHash
  }, [
    currentAssetData,
    transferEVM,
    amount,
    activeNetwork,
    activeAccount?.addressC,
    createBridgeTransaction,
    targetBlockchain
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    loading,
    receiveAmount,
    maximum,
    transfer
  }
}
