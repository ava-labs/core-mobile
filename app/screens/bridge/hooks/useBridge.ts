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
import { useState } from 'react'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useBtcBridge } from 'screens/bridge/hooks/useBtcBridge'
import { useEthBridge } from 'screens/bridge/hooks/useEthBridge'
import { useAvalancheBridge } from 'screens/bridge/hooks/useAvalancheBridge'
import { AssetBalance } from 'screens/bridge/utils/types'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

export interface BridgeAdapter {
  address?: string
  sourceBalance?: AssetBalance
  targetBalance?: AssetBalance
  assetsWithBalances?: AssetBalance[]
  hasEnoughForNetworkFee: boolean
  loading?: boolean
  networkFee?: Big
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

export default function useBridge() {
  const currency = useSelector(selectSelectedCurrency)

  const { currentBlockchain, currentAsset, currentAssetData } = useBridgeSDK()

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

  const defaults = {
    amount,
    setAmount,
    bridgeFee,
    price,
    minimum
  }

  if (currentBlockchain === Blockchain.BITCOIN) {
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
