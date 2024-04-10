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
import { useEthereumProvider } from 'hooks/networkProviderHooks'
import { selectBridgeAppConfig } from 'store/bridge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Eip1559Fees } from 'utils/Utils'
import { NetworkTokenUnit } from 'types'
import { useNetworks } from 'hooks/useNetworks'

/**
 * Hook for when the bridge source chain is Ethereum
 */
export function useEthBridge({
  amount,
  bridgeFee,
  minimum,
  eip1559Fees
}: {
  amount: Big
  bridgeFee: Big
  minimum: Big
  eip1559Fees: Eip1559Fees<NetworkTokenUnit>
}): BridgeAdapter {
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

  const { selectActiveNetwork } = useNetworks()
  const network = selectActiveNetwork()
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
      eip1559Fees
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
    eip1559Fees,
    activeAccount?.address,
    createBridgeTransaction
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
