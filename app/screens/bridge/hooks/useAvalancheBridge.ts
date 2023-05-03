import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  getMinimumTransferAmount,
  satoshiToBtc,
  useBridgeSDK,
  useHasEnoughForGas
} from '@avalabs/bridge-sdk'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useMemo, useState } from 'react'
import { useSingularAssetBalanceEVM } from 'screens/bridge/hooks/useSingularAssetBalanceEVM'
import { useAssetBalancesEVM } from 'screens/bridge/hooks/useAssetBalancesEVM'
import Big from 'big.js'
import { useAvalancheProvider } from 'hooks/networkProviderHooks'
import { useSelector } from 'react-redux'
import { selectBridgeConfig } from 'store/bridge'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'

/**
 * Hook for when the source is Avalanche
 */
export function useAvalancheBridge(amount: Big, bridgeFee: Big): BridgeAdapter {
  const bridgeConfig = useSelector(selectBridgeConfig)

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
  const network = useSelector(selectActiveNetwork)
  const avalancheProvider = useAvalancheProvider()
  const hasEnoughForNetworkFee = useHasEnoughForGas(
    isAvalancheBridge ? activeAccount?.address : undefined,
    avalancheProvider
  )

  const maximum = sourceBalance?.balance || BIG_ZERO
  const minimum = useMemo(() => {
    if (!bridgeConfig?.config) {
      return BIG_ZERO
    }
    if (currentAssetData?.assetType === AssetType.ERC20) {
      return bridgeFee.mul(3)
    } else {
      return satoshiToBtc(
        getMinimumTransferAmount(
          Blockchain.AVALANCHE,
          bridgeConfig.config,
          amount.toNumber()
        )
      )
    }
  }, [amount, bridgeConfig?.config, bridgeFee, currentAssetData?.assetType])
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
    setTransactionDetails,
    targetBlockchain,
    transferAsset,
    network
  ])

  return {
    sourceBalance,
    assetsWithBalances,
    hasEnoughForNetworkFee,
    loading,
    receiveAmount,
    maximum,
    minimum,
    txHash,
    transfer
  }
}
