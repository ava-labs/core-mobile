import { BIG_ZERO, Blockchain, useBridgeSDK } from '@avalabs/bridge-sdk'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useMemo, useState } from 'react'
import { useAssetBalancesEVM } from 'screens/bridge/hooks/useAssetBalancesEVM'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { NetworkTokenUnit } from 'types'
import { Eip1559Fees } from 'utils/Utils'

/**
 * Hook for when the source is Avalanche
 */
export function useAvalancheBridge({
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
  const { targetBlockchain, currentAssetData } = useBridgeSDK()
  const { createBridgeTransaction, transferAsset } = useBridgeContext()
  const [txHash, setTxHash] = useState<string>()
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
    currentAssetData,
    transferAsset,
    amount,
    eip1559Fees,
    createBridgeTransaction,
    targetBlockchain,
    network,
    activeAccount
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
