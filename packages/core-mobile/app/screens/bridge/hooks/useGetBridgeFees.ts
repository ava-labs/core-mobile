import { BridgeAsset } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { selectActiveAccount } from 'store/account'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'

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
  getEstimatedGas: () => Promise<bigint | undefined>
} => {
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

  const getEstimatedGas = useCallback(async () => {
    if (!activeAccount || !bridgeAsset || !sourceNetwork || amount === 0n)
      return

    if (!activeAccount) {
      throw new Error('no active account found')
    }

    if (!targetNetwork) {
      throw new Error('no target network found')
    }

    const fromAddress = isBitcoinNetwork(sourceNetwork)
      ? activeAccount.addressBTC
      : activeAccount.addressC

    const gasLimit = await UnifiedBridgeService.estimateGas({
      asset: bridgeAsset,
      fromAddress,
      amount,
      sourceNetwork,
      targetNetwork
    })

    if (gasLimit) {
      return gasLimit
    }
  }, [activeAccount, amount, bridgeAsset, sourceNetwork, targetNetwork])

  return { getBridgeFee, getEstimatedGas }
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
