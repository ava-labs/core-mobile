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
import { useHasEnoughForGas } from './useHasEnoughtForGas'

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
  const activeAccount = useSelector(selectActiveAccount)
  const config = useSelector(selectBridgeAppConfig)
  const ethereumProvider = useEthereumProvider()
  const hasEnoughForNetworkFee = useHasEnoughForGas()
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
      setTxHash
    )

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
    createBridgeTransaction
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    hasEnoughForNetworkFee,
    loading,
    receiveAmount,
    maximum,
    wrapStatus,
    txHash,
    transfer
  }
}
