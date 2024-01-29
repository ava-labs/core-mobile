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
import { useEffect, useState } from 'react'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useBtcBridge } from 'screens/bridge/hooks/useBtcBridge'
import { useEthBridge } from 'screens/bridge/hooks/useEthBridge'
import { useAvalancheBridge } from 'screens/bridge/hooks/useAvalancheBridge'
import { AssetBalance, BridgeProvider } from 'screens/bridge/utils/types'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useUnifiedBridge } from './useUnifiedBridge/useUnifiedBridge'

export interface BridgeAdapter {
  address?: string
  sourceBalance?: AssetBalance
  targetBalance?: AssetBalance
  assetsWithBalances?: AssetBalance[]
  hasEnoughForNetworkFee: boolean
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
  bridgeFee?: Big
  price: Big
  provider: BridgeProvider
}

export default function useBridge(selectedAsset?: AssetBalance): Bridge {
  const currency = useSelector(selectSelectedCurrency)

  const { currentBlockchain, currentAsset, currentAssetData, setCurrentAsset } =
    useBridgeSDK()

  // reset current asset when unmounting
  useEffect(() => {
    return () => {
      setCurrentAsset('')
    }
  }, [setCurrentAsset])

  const [amount, setAmount] = useState<Big>(new Big(0))
  const price = usePrice(
    currentAssetData?.assetType === AssetType.BTC ? 'bitcoin' : currentAsset,
    currency.toLowerCase() as VsCurrencyType
  )

  const bridgeFee = useBridgeFeeEstimate(amount) || BIG_ZERO
  const minimum = useMinimumTransferAmount(amount)

  const btc = useBtcBridge(amount)
  const eth = useEthBridge(amount, bridgeFee, minimum)
  const avalanche = useAvalancheBridge(amount, bridgeFee, minimum)
  const unified = useUnifiedBridge(amount, selectedAsset)

  const defaults = {
    amount,
    setAmount,
    bridgeFee,
    price,
    minimum,
    provider: BridgeProvider.LEGACY
  }

  const shouldUseUnifiedBridge = unified.isAssetSupported

  if (shouldUseUnifiedBridge) {
    return {
      ...defaults,
      ...unified,
      provider: BridgeProvider.UNIFIED
    }
  } else if (currentBlockchain === Blockchain.BITCOIN) {
    return {
      ...defaults,
      ...btc
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
      hasEnoughForNetworkFee: true,
      transfer: () => Promise.reject('invalid bridge')
    }
  }
}
