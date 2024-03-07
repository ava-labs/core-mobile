import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  useBridgeFeeEstimate,
  useBridgeSDK,
  useMinimumTransferAmount,
  usePrice,
  WrapStatus
} from '@avalabs/bridge-sdk'
import { useEffect, useMemo, useState } from 'react'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useBtcBridge } from 'screens/bridge/hooks/useBtcBridge'
import { useEthBridge } from 'screens/bridge/hooks/useEthBridge'
import { useAvalancheBridge } from 'screens/bridge/hooks/useAvalancheBridge'
import { AssetBalance, BridgeProvider } from 'screens/bridge/utils/types'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Eip1559Fees } from 'utils/Utils'
import { NetworkTokenUnit } from 'types'
import {
  selectActiveNetwork,
  selectNetwork,
  selectNetworks
} from 'store/network'
import { FeePreset } from 'components/NetworkFeeSelector'
import { selectActiveAccount } from 'store/account'
import { bigToBN } from '@avalabs/utils-sdk'
import Logger from 'utils/Logger'
import BN from 'bn.js'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectBridgeAppConfig } from 'store/bridge'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { isUnifiedBridgeAsset } from '../utils/bridgeUtils'
import { useUnifiedBridge } from './useUnifiedBridge/useUnifiedBridge'
import { useHasEnoughForGas } from './useHasEnoughtForGas'
import { getTargetChainId } from './useUnifiedBridge/utils'

export interface BridgeAdapter {
  address?: string
  sourceBalance?: AssetBalance
  targetBalance?: AssetBalance
  assetsWithBalances?: AssetBalance[]
  hasEnoughForNetworkFee?: boolean
  loading?: boolean
  networkFee?: Big
  bridgeFee?: Big
  /** Amount minus network and bridge fees */
  receiveAmount?: Big
  /** Maximum transfer amount */
  maximum?: Big
  /** Minimum transfer amount */
  minimum?: Big
  wrapStatus?: WrapStatus
  txHash?: string
  /**
   * Transfer funds to the target blockchain
   * @returns the transaction hash
   */
  transfer: () => Promise<string | undefined>
}

interface Bridge extends BridgeAdapter {
  amount: Big
  setAmount: (amount: Big) => void
  price: Big
  provider: BridgeProvider
  bridgeFee: Big
  eip1559Fees: Eip1559Fees<NetworkTokenUnit>
  setEip1559Fees: (fees: Eip1559Fees<NetworkTokenUnit>) => void
  selectedFeePreset: FeePreset
  setSelectedFeePreset: (preset: FeePreset) => void
  denomination: number
  amountBN: BN
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function useBridge(selectedAsset?: AssetBalance): Bridge {
  const config = useSelector(selectBridgeAppConfig)
  const isTestnet = useSelector(selectIsDeveloperMode)
  const allNetworks = useSelector(selectNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const [sourceBalance, setSourceBalance] = useState<AssetBalance>()
  const {
    currentBlockchain,
    currentAsset,
    currentAssetData,
    setCurrentAsset,
    targetBlockchain
  } = useBridgeSDK()

  const targetChainId = useMemo(
    () => getTargetChainId(isTestnet, targetBlockchain),
    [isTestnet, targetBlockchain]
  )

  const targetNetwork = useSelector(selectNetwork(targetChainId))

  // reset current asset when unmounting
  useEffect(() => {
    return () => {
      setCurrentAsset('')
    }
  }, [setCurrentAsset])

  const [amount, setAmount] = useState<Big>(new Big(0))
  const [selectedFeePreset, setSelectedFeePreset] = useState<FeePreset>(
    FeePreset.Normal
  )
  const [eip1559Fees, setEip1559Fees] = useState<Eip1559Fees<NetworkTokenUnit>>(
    {
      gasLimit: 0,
      maxFeePerGas: NetworkTokenUnit.fromNetwork(activeNetwork),
      maxPriorityFeePerGas: NetworkTokenUnit.fromNetwork(activeNetwork)
    }
  )
  const price = usePrice(
    currentAssetData?.assetType === AssetType.BTC ? 'bitcoin' : currentAsset,
    currency.toLowerCase() as VsCurrencyType
  )

  const bridgeFee = useBridgeFeeEstimate(amount) || BIG_ZERO
  const minimum = useMinimumTransferAmount(amount)
  const hasEnoughForNetworkFee = useHasEnoughForGas()

  // btc does not have the concept of gas, maxFeePerGas value below is just the fee rate
  // user set in the network fee selector
  const btc = useBtcBridge(amount, Number(eip1559Fees.maxFeePerGas.toSubUnit()))
  const eth = useEthBridge({ amount, bridgeFee, minimum, eip1559Fees })
  const avalanche = useAvalancheBridge({
    amount,
    bridgeFee,
    minimum,
    eip1559Fees
  })
  const unified = useUnifiedBridge(amount, eip1559Fees, selectedAsset)
  const denomination = useMemo(() => {
    if (!sourceBalance) {
      return 0
    }

    if (isUnifiedBridgeAsset(sourceBalance.asset)) {
      return sourceBalance.asset.decimals
    }

    return sourceBalance.asset.denomination
  }, [sourceBalance])

  const amountBN = useMemo(
    () => bigToBN(amount, denomination),
    [amount, denomination]
  )

  useEffect(() => {
    if (unified.isAssetSupported) {
      setSourceBalance(unified.sourceBalance)
    } else if (currentBlockchain === Blockchain.BITCOIN) {
      setSourceBalance(btc.sourceBalance)
    } else if (currentBlockchain === Blockchain.ETHEREUM) {
      setSourceBalance(eth.sourceBalance)
    } else if (currentBlockchain === Blockchain.AVALANCHE) {
      setSourceBalance(avalanche.sourceBalance)
    } else {
      setSourceBalance(undefined)
    }
  }, [btc, eth, avalanche, unified, currentBlockchain])

  useEffect(() => {
    const getEstimatedGasLimit = async (): Promise<bigint | undefined> => {
      if (
        !activeAccount ||
        !selectedAsset ||
        !currentAssetData ||
        amount.eq(BIG_ZERO)
      )
        return
      let estimatedGasLimit: bigint | undefined

      if (unified.isAssetSupported) {
        estimatedGasLimit = await UnifiedBridgeService.estimateGas({
          asset: selectedAsset.asset,
          amount,
          activeAccount,
          sourceNetwork: activeNetwork,
          targetNetwork
        })
      } else {
        estimatedGasLimit = await BridgeService.estimateGas({
          currentBlockchain,
          amount,
          activeAccount,
          activeNetwork,
          currency,
          allNetworks,
          asset: currentAssetData,
          isTestnet,
          config
        })
      }
      setEip1559Fees(prev => ({
        ...prev,
        gasLimit: Number(estimatedGasLimit ?? 0)
      }))
    }
    getEstimatedGasLimit().catch(e => {
      Logger.error('Failed to estimate gas limit', e)
    })
  }, [
    activeAccount,
    activeNetwork,
    allNetworks,
    amount,
    config,
    currency,
    currentAssetData,
    currentBlockchain,
    isTestnet,
    selectedAsset,
    targetNetwork,
    unified.isAssetSupported
  ])

  const defaults = {
    amount,
    setAmount,
    bridgeFee,
    price,
    minimum,
    hasEnoughForNetworkFee,
    provider: BridgeProvider.LEGACY,
    eip1559Fees,
    setEip1559Fees,
    selectedFeePreset,
    setSelectedFeePreset,
    denomination,
    amountBN
  }

  if (unified.isAssetSupported) {
    return {
      ...defaults,
      ...unified,
      provider: BridgeProvider.UNIFIED
    }
  } else if (currentBlockchain === Blockchain.BITCOIN) {
    return {
      ...defaults,
      ...btc,
      hasEnoughForNetworkFee: true // minimum calc covers this
    }
  } else if (currentBlockchain === Blockchain.ETHEREUM) {
    return {
      ...defaults,
      ...eth
    }
  } else if (currentBlockchain === Blockchain.AVALANCHE) {
    return {
      ...defaults,
      ...avalanche
    }
  } else {
    return {
      ...defaults,
      transfer: () => Promise.reject('invalid bridge')
    }
  }
}
