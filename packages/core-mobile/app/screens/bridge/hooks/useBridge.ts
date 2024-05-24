import {
  Blockchain,
  useBridgeFeeEstimate,
  useBridgeSDK,
  useMinimumTransferAmount,
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
import { selectActiveAccount } from 'store/account'
import { BIG_ZERO, bigToBN } from '@avalabs/utils-sdk'
import Logger from 'utils/Logger'
import BN from 'bn.js'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectBridgeAppConfig } from 'store/bridge'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { useCoinGeckoId } from 'hooks/useCoinGeckoId'
import { useSimplePrice } from 'hooks/useSimplePrice'
import { isUnifiedBridgeAsset } from '../utils/bridgeUtils'
import { useUnifiedBridge } from './useUnifiedBridge/useUnifiedBridge'
import { getTargetChainId } from './useUnifiedBridge/utils'

export interface BridgeAdapter {
  address?: string
  sourceBalance?: AssetBalance
  targetBalance?: AssetBalance
  assetsWithBalances?: AssetBalance[]
  networkFee?: Big
  loading?: boolean
  bridgeFee?: Big
  /** Amount minus network and bridge fees */
  receiveAmount?: Big
  /** Maximum transfer amount */
  maximum?: Big
  /** Minimum transfer amount */
  minimum?: Big
  wrapStatus?: WrapStatus
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
  denomination: number
  amountBN: BN
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function useBridge(selectedAsset?: AssetBalance): Bridge {
  const { activeNetwork, networks, getNetwork } = useNetworks()
  const config = useSelector(selectBridgeAppConfig)
  const isTestnet = useSelector(selectIsDeveloperMode)
  const currency = useSelector(selectSelectedCurrency)
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

  const targetNetwork = getNetwork(targetChainId)

  // reset current asset when unmounting
  useEffect(() => {
    return () => {
      setCurrentAsset('')
    }
  }, [setCurrentAsset])

  const [amount, setAmount] = useState<Big>(new Big(0))
  const [networkFee, setNetworkFee] = useState<Big>()

  const bridgeFee = useBridgeFeeEstimate(amount) || BIG_ZERO
  const minimum = useMinimumTransferAmount(amount)
  const { data: networkFeeRate } = useNetworkFee()

  const btc = useBtcBridge({ amount, bridgeFee, minimum })
  const eth = useEthBridge({ amount, bridgeFee, minimum })
  const avalanche = useAvalancheBridge({
    amount,
    bridgeFee,
    minimum
  })
  const unified = useUnifiedBridge(amount, selectedAsset)

  const coingeckoId = useCoinGeckoId(currentAsset)

  const price = useSimplePrice(
    coingeckoId,
    currency.toLowerCase() as VsCurrencyType
  )

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
  }, [
    btc,
    eth,
    avalanche,
    currentBlockchain,
    unified.isAssetSupported,
    unified.sourceBalance
  ])

  useEffect(() => {
    const getNetworkFee = async (): Promise<bigint | undefined> => {
      if (
        !networkFeeRate ||
        !activeAccount ||
        !selectedAsset ||
        !currentAssetData ||
        amount.eq(BIG_ZERO)
      )
        return

      let gasLimit

      if (unified.isAssetSupported) {
        gasLimit = await UnifiedBridgeService.estimateGas({
          asset: selectedAsset.asset,
          amount,
          activeAccount,
          sourceNetwork: activeNetwork,
          targetNetwork
        })
      } else {
        gasLimit = await BridgeService.estimateGas({
          currentBlockchain,
          amount,
          activeAccount,
          activeNetwork,
          currency,
          allNetworks: networks,
          asset: currentAssetData,
          isTestnet,
          config
        })
      }

      if (gasLimit) {
        setNetworkFee(
          bigintToBig(
            networkFeeRate.low.maxFeePerGas.mul(gasLimit).toSubUnit(),
            activeNetwork.networkToken.decimals
          )
        )
      }
    }

    getNetworkFee().catch(e => {
      Logger.error('Failed to get network fee', e)
    })
  }, [
    activeAccount,
    activeNetwork,
    networks,
    amount,
    config,
    currency,
    currentAssetData,
    currentBlockchain,
    isTestnet,
    selectedAsset,
    targetNetwork,
    networkFeeRate,
    unified.isAssetSupported
  ])

  const defaults = {
    amount,
    setAmount,
    networkFee,
    bridgeFee,
    price,
    minimum,
    provider: BridgeProvider.LEGACY,
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
      transfer: () => Promise.reject('invalid bridge')
    }
  }
}
