import { useEffect, useMemo, useState } from 'react'
import { NetworkFees } from '@avalabs/vm-module-types'
import { BridgeAsset, TokenType } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'
import { AssetBalance, getAssetBalance } from 'common/utils/bridgeUtils'
import { useGetBridgeFees } from './useGetBridgeFees'

const useMaxTransferAmount = ({
  assetsWithBalances,
  selectedBridgeAsset,
  networkFeeRate,
  sourceNetwork,
  targetNetwork
}: {
  assetsWithBalances: AssetBalance[]
  selectedBridgeAsset: BridgeAsset | undefined
  networkFeeRate: NetworkFees | undefined
  sourceNetwork: Network | undefined
  targetNetwork: Network | undefined
}): bigint | undefined => {
  const { getEstimatedGas } = useGetBridgeFees({
    bridgeAsset: selectedBridgeAsset,
    sourceNetwork,
    targetNetwork
  })

  const assetBalance = useMemo(
    () => getAssetBalance(selectedBridgeAsset?.symbol, assetsWithBalances),
    [selectedBridgeAsset, assetsWithBalances]
  )

  const [gasLimit, setGasLimit] = useState<bigint>()

  const networkFee = useMemo(() => {
    if (!networkFeeRate || !gasLimit) return

    return networkFeeRate.low.maxFeePerGas * gasLimit
  }, [gasLimit, networkFeeRate])

  useEffect(() => {
    if (assetBalance?.balance !== undefined) {
      getEstimatedGas(assetBalance.balance)
        .then(estimatedGas => {
          if (estimatedGas) {
            setGasLimit(estimatedGas)
          }
        })
        .catch(e => {
          Logger.error('Failed to get estimated gas', e)
        })
    }
  }, [getEstimatedGas, assetBalance])

  const maxAmount =
    assetBalance?.balance && networkFee
      ? assetBalance.asset.type === TokenType.NATIVE
        ? assetBalance.balance - networkFee
        : assetBalance.balance
      : undefined

  if (maxAmount !== undefined && maxAmount < 0n) {
    // we set the calculated max amount only when it is greater than 0.
    // otherwise we return the asset balance to show the user that they don't have enough balance
    return assetBalance?.balance
  }

  return maxAmount
}

export default useMaxTransferAmount
