import { BridgeAsset } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { selectActiveAccount } from 'store/account'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'

export const useGetBridgeFees = ({
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  bridgeAsset: BridgeAsset | undefined
  sourceNetwork: Network | undefined
  targetNetwork: Network | undefined
}): {
  getBridgeFee: (amount: bigint) => Promise<bigint | undefined>
  getEstimatedGas: (amount: bigint) => Promise<bigint | undefined>
} => {
  const activeAccount = useSelector(selectActiveAccount)

  const getBridgeFee = useCallback(
    async (amount: bigint) => {
      if (!bridgeAsset || !targetNetwork || !sourceNetwork || amount === 0n) {
        return undefined
      }

      return await UnifiedBridgeService.getFee({
        asset: bridgeAsset,
        amount,
        sourceNetwork,
        targetNetwork
      })
    },
    [bridgeAsset, sourceNetwork, targetNetwork]
  )

  const getEstimatedGas = useCallback(
    async (amount: bigint) => {
      if (!activeAccount || !bridgeAsset || !sourceNetwork) return

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
    },
    [activeAccount, bridgeAsset, sourceNetwork, targetNetwork]
  )

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
