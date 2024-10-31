import { BridgeAsset } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { selectActiveAccount } from 'store/account'

export const useGetBridgeFees = ({
  amount,
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  amount: bigint
  bridgeAsset: BridgeAsset | undefined
  sourceNetwork: Network | undefined
  targetNetwork: Network | undefined
}): {
  getBridgeFee: () => Promise<bigint | undefined>
  getNetworkFee: () => Promise<bigint | undefined>
} => {
  const { data: networkFeeRate } = useNetworkFee()
  const activeAccount = useSelector(selectActiveAccount)

  const getBridgeFee = useCallback(async () => {
    if (!bridgeAsset || !targetNetwork || !sourceNetwork || amount === 0n) {
      return undefined
    }

    return await UnifiedBridgeService.getFee({
      asset: bridgeAsset,
      amount,
      sourceNetwork,
      targetNetwork
    })
  }, [amount, bridgeAsset, sourceNetwork, targetNetwork])

  const getNetworkFee = useCallback(async () => {
    if (
      !networkFeeRate ||
      !activeAccount ||
      !bridgeAsset ||
      !sourceNetwork ||
      amount === 0n
    )
      return

    const gasLimit = await UnifiedBridgeService.estimateGas({
      asset: bridgeAsset,
      amount,
      activeAccount,
      sourceNetwork,
      targetNetwork
    })

    if (gasLimit) {
      return networkFeeRate.low.maxFeePerGas * gasLimit
    }
  }, [
    activeAccount,
    amount,
    bridgeAsset,
    networkFeeRate,
    sourceNetwork,
    targetNetwork
  ])

  return { getBridgeFee, getNetworkFee }
}

export const useGetMinimumTransferAmount = ({
  amount,
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  amount: bigint
  bridgeAsset: BridgeAsset | undefined
  sourceNetwork: Network | undefined
  targetNetwork: Network | undefined
}): (() => Promise<bigint | undefined>) => {
  return useCallback(async () => {
    if (!bridgeAsset || !targetNetwork || !sourceNetwork) {
      return undefined
    }

    return await UnifiedBridgeService.getMinimumTransferAmount({
      asset: bridgeAsset,
      amount,
      sourceNetwork,
      targetNetwork
    })
  }, [amount, bridgeAsset, sourceNetwork, targetNetwork])
}
