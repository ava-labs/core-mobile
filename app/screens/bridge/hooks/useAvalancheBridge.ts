import {
  BIG_ZERO,
  Blockchain,
  useBridgeSDK,
  useHasEnoughForGas
} from '@avalabs/bridge-sdk'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useState } from 'react'
import { useSingularAssetBalanceEVM } from 'screens/bridge/hooks/useSingularAssetBalanceEVM'
import { useAssetBalancesEVM } from 'screens/bridge/hooks/useAssetBalancesEVM'
import Big from 'big.js'
import { useAvalancheProvider } from 'hooks/networkProviderHooks'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'

/**
 * Hook for when the source is Avalanche
 */
export function useAvalancheBridge(
  amount: Big,
  bridgeFee: Big,
  minimum: Big
): BridgeAdapter {
  const {
    targetBlockchain,
    currentBlockchain,
    setTransactionDetails,
    currentAssetData
  } = useBridgeSDK()

  const { createBridgeTransaction, transferAsset } = useBridgeContext()

  const isAvalancheBridge = currentBlockchain === Blockchain.AVALANCHE
  const [txHash, setTxHash] = useState<string>()

  const sourceBalance = useSingularAssetBalanceEVM(
    isAvalancheBridge ? currentAssetData : undefined,
    Blockchain.AVALANCHE
  )

  const { assetsWithBalances, loading } = useAssetBalancesEVM(
    Blockchain.AVALANCHE
  )

  const activeAccount = useSelector(selectActiveAccount)
  const avalancheProvider = useAvalancheProvider()
  const hasEnoughForNetworkFee = useHasEnoughForGas(
    isAvalancheBridge ? activeAccount?.address : undefined,
    avalancheProvider
  )

  const maximum = sourceBalance?.balance || BIG_ZERO
  const receiveAmount = amount.gt(minimum) ? amount.minus(bridgeFee) : BIG_ZERO

  const transfer = useCallback(async () => {
    if (!currentAssetData) {
      return Promise.reject()
    }

    const timestamp = Date.now()
    const result = await transferAsset(
      amount,
      currentAssetData,
      () => {
        //not used
      },
      setTxHash
    )

    setTransactionDetails({
      tokenSymbol: currentAssetData.symbol,
      amount
    })

    createBridgeTransaction({
      sourceChain: Blockchain.AVALANCHE,
      sourceTxHash: result?.hash ?? '',
      sourceStartedAt: timestamp,
      targetChain: targetBlockchain,
      amount,
      symbol: currentAssetData.symbol
    })

    return result?.hash
  }, [
    amount,
    createBridgeTransaction,
    currentAssetData,
    setTransactionDetails,
    targetBlockchain,
    transferAsset
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    hasEnoughForNetworkFee,
    loading,
    receiveAmount,
    maximum,
    txHash,
    transfer
  }
}
