import { useEffect, useMemo, useState } from 'react'
import { AssetBalance } from 'screens/bridge/utils/types'
import Big from 'big.js'
import Logger from 'utils/Logger'
import { Network } from '@avalabs/core-chains-sdk'
import { BridgeAsset, BridgeType } from '@avalabs/bridge-unified'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { getAssetBalance, unwrapAssetSymbol } from '../utils/bridgeUtils'
import { useAssetBalances } from './useAssetBalances'
import { useBridgeAssets } from './useBridgeAssets'
import {
  useGetBridgeFees,
  useGetMinimumTransferAmount
} from './useGetBridgeFees'
import { useBridgeAssetPrice } from './useBridgeAssetPrice'
import { useBridgeType } from './useBridgeType'
import { useBridgeTransfer } from './useBridgeTransfer'
import {
  useBridgeSourceNetworks,
  useBridgeTargetNetworks
} from './useBridgeNetworks'
import useMaxTransferAmount from './useMaxTransferAmount'
import { useEstimatedReceiveAmount } from './useEstimatedReceiveAmount'

interface Bridge {
  assetBalance?: AssetBalance
  assetsWithBalances?: AssetBalance[]
  networkFee?: bigint
  bridgeFee: bigint
  /** Maximum transfer amount */
  maximum?: bigint
  /** Minimum transfer amount */
  minimum?: bigint
  /**
   * Transfer funds to the target network
   * @returns the transaction hash
   */
  transfer: () => Promise<string | undefined>

  sourceNetworks: Network[]
  targetNetworks: Network[]
  sourceNetwork?: Network
  setSourceNetwork: (network: Network) => void
  targetNetwork?: Network
  setTargetNetwork: (network: Network) => void
  bridgeAssets: BridgeAsset[]
  selectedBridgeAsset?: BridgeAsset
  setSelectedBridgeAsset: (asset: BridgeAsset) => void
  error: Error | undefined
  bridgeType: BridgeType | undefined

  inputAmount: bigint | undefined
  setInputAmount: (amount: bigint | undefined) => void
  amount: bigint
  price: Big | undefined
  estimatedReceiveAmount: bigint | undefined
}

export default function useBridge(): Bridge {
  const [sourceNetwork, setSourceNetwork] = useState<Network>()
  const [targetNetwork, setTargetNetwork] = useState<Network>()
  const [selectedBridgeAsset, setSelectedBridgeAsset] = useState<BridgeAsset>()
  const { bridgeAssets } = useBridgeAssets(sourceNetwork?.chainId)
  const [bridgeError, setBridgeError] = useState<Error>()
  const [minimum, setMinimum] = useState<bigint>()
  const [bridgeFee, setBridgeFee] = useState<bigint>(0n)
  const [inputAmount, setInputAmount] = useState<bigint>()
  const amount = useMemo(() => inputAmount ?? 0n, [inputAmount])
  const { assetsWithBalances } = useAssetBalances()
  const { data: networkFeeRate } = useNetworkFee()

  const assetBalance = useMemo(
    () => getAssetBalance(selectedBridgeAsset?.symbol, assetsWithBalances),
    [selectedBridgeAsset, assetsWithBalances]
  )

  const sourceNetworks = useBridgeSourceNetworks()
  const targetNetworks = useBridgeTargetNetworks(selectedBridgeAsset)

  const [gasLimit, setGasLimit] = useState<bigint>()
  const networkFee = useMemo(() => {
    if (!networkFeeRate || !gasLimit) return

    return networkFeeRate.low.maxFeePerGas * gasLimit
  }, [gasLimit, networkFeeRate])
  const price = useBridgeAssetPrice(selectedBridgeAsset)
  const bridgeType = useBridgeType(selectedBridgeAsset, targetNetwork?.chainId)
  const transfer = useBridgeTransfer({
    amount,
    bridgeAsset: selectedBridgeAsset,
    sourceNetwork,
    targetNetwork,
    bridgeType
  })

  const maximum = useMaxTransferAmount({
    assetsWithBalances,
    selectedBridgeAsset,
    networkFeeRate,
    sourceNetwork,
    targetNetwork
  })

  const { getBridgeFee, getEstimatedGas } = useGetBridgeFees({
    bridgeAsset: selectedBridgeAsset,
    sourceNetwork,
    targetNetwork
  })

  const getMinimumTransferAmount = useGetMinimumTransferAmount({
    amount,
    bridgeAsset: selectedBridgeAsset,
    sourceNetwork,
    targetNetwork
  })

  const estimatedReceiveAmount = useEstimatedReceiveAmount({
    amount,
    bridgeAsset: selectedBridgeAsset,
    sourceNetwork,
    targetNetwork
  })

  useEffect(() => {
    getEstimatedGas(amount)
      .then(estimatedGas => {
        if (estimatedGas) {
          setGasLimit(estimatedGas)
        }
      })
      .catch(e => {
        Logger.error('Failed to get estimated gas', e)
      })
  }, [getEstimatedGas, amount])

  useEffect(() => {
    getBridgeFee(amount)
      .then(fee => {
        if (fee !== undefined) {
          setBridgeFee(fee)
        }
      })
      .catch(error => {
        Logger.error(error)
        setBridgeError(error)
      })
  }, [getBridgeFee, amount])

  useEffect(() => {
    if (!selectedBridgeAsset || !sourceNetwork || !targetNetwork) {
      return
    }

    getMinimumTransferAmount()
      .then(minimumAmount => setMinimum(minimumAmount))
      .catch(error => {
        Logger.error('Failed to get minimum transfer amount', error)
        setMinimum(undefined)
      })
  }, [
    selectedBridgeAsset,
    sourceNetwork,
    targetNetwork,
    amount,
    getMinimumTransferAmount
  ])

  useEffect(() => {
    if (targetNetworks.length === 0) {
      return
    }

    if (
      !targetNetwork ||
      !targetNetworks.find(network => network.chainId === targetNetwork.chainId)
    ) {
      setTargetNetwork(targetNetworks[0])
    }
  }, [targetNetworks, targetNetwork])

  useEffect(() => {
    if (!selectedBridgeAsset) return

    const bridgeAssetSymbol = selectedBridgeAsset.symbol

    const bridgeAsset =
      bridgeAssets.find(asset => asset.symbol === bridgeAssetSymbol) ??
      bridgeAssets.find(
        asset => asset.symbol === unwrapAssetSymbol(bridgeAssetSymbol)
      )

    if (bridgeAsset) {
      setSelectedBridgeAsset(bridgeAsset)
    } else {
      setSelectedBridgeAsset(undefined)
    }
  }, [sourceNetwork, bridgeAssets, selectedBridgeAsset])

  useEffect(() => {
    setInputAmount(undefined)
  }, [selectedBridgeAsset])

  return {
    assetBalance,
    assetsWithBalances,
    bridgeFee,
    maximum,
    minimum,
    transfer,
    sourceNetworks,
    targetNetworks,
    sourceNetwork,
    setSourceNetwork,
    targetNetwork,
    setTargetNetwork,
    bridgeAssets,
    selectedBridgeAsset,
    setSelectedBridgeAsset,
    error: bridgeError,
    bridgeType,
    inputAmount,
    setInputAmount,
    amount,
    networkFee,
    price,
    estimatedReceiveAmount
  }
}
