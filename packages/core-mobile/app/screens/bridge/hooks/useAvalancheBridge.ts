import { BIG_ZERO, Blockchain, useBridgeSDK } from '@avalabs/bridge-sdk'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useMemo, useState } from 'react'
import { useAssetBalancesEVM } from 'screens/bridge/hooks/useAssetBalancesEVM'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

/**
 * Hook for when the source is Avalanche
 */
export function useAvalancheBridge(
  amount: Big,
  bridgeFee: Big,
  minimum: Big
): BridgeAdapter {
  const { targetBlockchain, currentAssetData } = useBridgeSDK()
  const { createBridgeTransaction, transferAsset } = useBridgeContext()
  const [txHash, setTxHash] = useState<string>()

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

  const network = useSelector(selectActiveNetwork)

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

    createBridgeTransaction(
      {
        sourceChain: Blockchain.AVALANCHE,
        sourceTxHash: result?.hash ?? '',
        sourceStartedAt: timestamp,
        targetChain: targetBlockchain,
        amount,
        symbol: currentAssetData.symbol
      },
      network
    )

    return result?.hash
  }, [
    amount,
    createBridgeTransaction,
    currentAssetData,
    targetBlockchain,
    transferAsset,
    network
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    loading,
    receiveAmount,
    maximum,
    txHash,
    transfer
  }
}
