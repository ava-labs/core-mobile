import Big from 'big.js'
import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  useBridgeConfig,
  useBridgeSDK,
  useHasEnoughForGas,
  useMaxTransferAmount,
  WrapStatus
} from '@avalabs/bridge-sdk'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useSingularAssetBalanceEVM } from 'screens/bridge/hooks/useSingularAssetBalanceEVM'
import { useAssetBalancesEVM } from 'screens/bridge/hooks/useAssetBalancesEVM'
import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import networkService from 'services/network/NetworkService'

/**
 * Hook for when the bridge source chain is Ethereum
 */
export function useEthBridge(amount: Big, bridgeFee: Big): BridgeAdapter {
  const {
    currentAsset,
    currentAssetData,
    setTransactionDetails,
    currentBlockchain
  } = useBridgeSDK()

  const isEthereumBridge = currentBlockchain === Blockchain.ETHEREUM

  const { createBridgeTransaction, transferAsset } = useBridgeContext()
  const sourceBalance = useSingularAssetBalanceEVM(
    isEthereumBridge ? currentAssetData : undefined,
    Blockchain.ETHEREUM
  )
  const { assetsWithBalances, loading } = useAssetBalancesEVM(
    Blockchain.ETHEREUM
  )

  const network = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const config = useBridgeConfig().config
  const ethereumProvider = networkService.getEthereumProvider(network.isTestnet)
  const hasEnoughForNetworkFee = useHasEnoughForGas(
    isEthereumBridge ? activeAccount?.address : undefined,
    ethereumProvider
  )
  const [wrapStatus, setWrapStatus] = useState<WrapStatus>(WrapStatus.INITIAL)
  const [txHash, setTxHash] = useState<string>()

  const maximum =
    useMaxTransferAmount(
      sourceBalance?.balance,
      activeAccount?.address,
      ethereumProvider
    ) || undefined
  const minimum = bridgeFee?.mul(3)
  const receiveAmount = amount.gt(minimum) ? amount.minus(bridgeFee) : BIG_ZERO

  const transfer = useCallback(async () => {
    if (!currentAssetData || !network || !config) {
      return Promise.reject()
    }

    const timestamp = Date.now()
    const symbol =
      currentAssetData.assetType === AssetType.NATIVE
        ? currentAssetData.wrappedAssetSymbol
        : currentAsset || ''

    //this transfer is part of the Bridge context
    const result = await transferAsset(
      amount,
      currentAssetData,
      setWrapStatus,
      setTxHash
    )

    setTransactionDetails({
      tokenSymbol: symbol,
      amount
    })

    createBridgeTransaction({
      sourceChain: Blockchain.ETHEREUM,
      sourceTxHash: result?.hash ?? '',
      sourceStartedAt: timestamp,
      targetChain: Blockchain.AVALANCHE,
      amount,
      symbol
    })

    return result?.hash
  }, [
    amount,
    currentAssetData,
    createBridgeTransaction,
    currentAsset,
    setTransactionDetails,
    transferAsset
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    hasEnoughForNetworkFee,
    loading,
    receiveAmount,
    maximum,
    minimum,
    wrapStatus,
    txHash,
    transfer
  }
}
