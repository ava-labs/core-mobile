import { BridgeAsset } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { useNetworkFee } from 'hooks/useNetworkFee'
import Logger from 'utils/Logger'

export const useEstimatedReceiveAmount = ({
  amount,
  bridgeAsset,
  sourceNetwork,
  targetNetwork
}: {
  amount: bigint
  bridgeAsset: BridgeAsset | undefined
  sourceNetwork: Network | undefined
  targetNetwork: Network | undefined
}): bigint | undefined => {
  const activeAccount = useSelector(selectActiveAccount)
  const { data: networkFeeRate } = useNetworkFee()

  const [estimatedAmount, setEstimatedAmount] = useState<bigint | undefined>()

  useEffect(() => {
    async function getEstimatedReceiveAmount(): Promise<bigint | undefined> {
      if (!bridgeAsset || !sourceNetwork || !targetNetwork || !activeAccount) {
        return
      }

      const fromAddress = isBitcoinNetwork(sourceNetwork)
        ? activeAccount.addressBTC
        : activeAccount.addressC

      const { amount: _estimatedAmount } =
        await UnifiedBridgeService.estimateReceiveAmount({
          asset: bridgeAsset,
          fromAddress,
          amount,
          sourceNetwork,
          targetNetwork,
          gasSettings:
            sourceNetwork && networkFeeRate && isBitcoinNetwork(sourceNetwork)
              ? { price: networkFeeRate.low.maxFeePerGas }
              : undefined
        })

      return _estimatedAmount
    }

    getEstimatedReceiveAmount().then(setEstimatedAmount).catch(Logger.error)
  }, [
    bridgeAsset,
    targetNetwork,
    activeAccount,
    amount,
    sourceNetwork,
    networkFeeRate
  ])

  return estimatedAmount
}
