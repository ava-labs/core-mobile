import {
  BridgeAsset,
  isErc20Asset,
  isNativeAsset,
  UnifiedBridgeService
} from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { buildChain } from '../utils/bridgeUtils'

export const useGetBridgeFees = ({
  unifiedBridge,
  amount,
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  unifiedBridge: UnifiedBridgeService | undefined
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
    if (
      !bridgeAsset ||
      !targetNetwork ||
      !sourceNetwork ||
      amount === 0n ||
      !unifiedBridge
    ) {
      return undefined
    }

    const feeMap = await unifiedBridge.getFees({
      asset: bridgeAsset,
      amount,
      sourceChain: buildChain(sourceNetwork),
      targetChain: buildChain(targetNetwork)
    })

    if (isNativeAsset(bridgeAsset)) {
      // todo: handle this properly
      return 0n
    } else if (isErc20Asset(bridgeAsset) && bridgeAsset.address) {
      const address = bridgeAsset.address.toLowerCase() as `0x${string}`
      return feeMap[address] ?? 0n
    } else {
      throw new Error('invalid asset')
    }
  }, [amount, bridgeAsset, sourceNetwork, targetNetwork, unifiedBridge])

  const getNetworkFee = useCallback(async () => {
    if (
      !networkFeeRate ||
      !activeAccount ||
      !bridgeAsset ||
      !sourceNetwork ||
      amount === 0n ||
      !unifiedBridge
    )
      return

    if (!activeAccount) {
      throw new Error('no active account found')
    }

    if (!targetNetwork) {
      throw new Error('no target network found')
    }

    const sourceChain = buildChain(sourceNetwork)
    const targetChain = buildChain(targetNetwork)

    const fromAddress = activeAccount.addressC as `0x${string}`

    const gasLimit = await unifiedBridge.estimateGas({
      asset: bridgeAsset,
      fromAddress,
      amount,
      sourceChain,
      targetChain
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
    targetNetwork,
    unifiedBridge
  ])

  return { getBridgeFee, getNetworkFee }
}

export const useGetMinimumTransferAmount = ({
  unifiedBridge,
  amount,
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  unifiedBridge: UnifiedBridgeService | undefined
  amount: bigint
  bridgeAsset: BridgeAsset | undefined
  sourceNetwork: Network | undefined
  targetNetwork: Network | undefined
}): (() => Promise<bigint | undefined>) => {
  return useCallback(async () => {
    if (!bridgeAsset || !targetNetwork || !sourceNetwork || !unifiedBridge) {
      return undefined
    }

    const sourceChain = buildChain(sourceNetwork)
    const targetChain = buildChain(targetNetwork)

    return await unifiedBridge.getMinimumTransferAmount({
      asset: bridgeAsset,
      amount,
      sourceChain,
      targetChain
    })
  }, [amount, bridgeAsset, sourceNetwork, targetNetwork, unifiedBridge])
}
