import {
  Blockchain,
  useBridgeFeeEstimate,
  useBridgeSDK,
  useMinimumTransferAmount,
  WrapStatus
} from '@avalabs/core-bridge-sdk'
import { useEffect, useMemo, useState } from 'react'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useBtcBridge } from 'screens/bridge/hooks/useBtcBridge'
import { AssetBalance, BridgeProvider } from 'screens/bridge/utils/types'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectActiveAccount } from 'store/account'
import { BIG_ZERO, bigToBigInt } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectBridgeAppConfig } from 'store/bridge'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { useCoinGeckoId } from 'hooks/useCoinGeckoId'
import { useSimplePrice } from 'hooks/useSimplePrice'
import { Network } from '@avalabs/core-chains-sdk'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { isUnifiedBridgeAsset, networkToBlockchain } from '../utils/bridgeUtils'
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
}

interface Bridge extends BridgeAdapter {
  amount: Big
  setAmount: (amount: Big | undefined) => void
  price: Big | undefined
  provider: BridgeProvider
  bridgeFee: Big
  denomination: number
  amountBN: bigint | undefined
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function useBridge(): Bridge {
  const { activeNetwork, networks, getNetwork } = useNetworks()
  const config = useSelector(selectBridgeAppConfig)
  const isTestnet = useSelector(selectIsDeveloperMode)
  const currency = useSelector(selectSelectedCurrency)
  const activeAccount = useSelector(selectActiveAccount)
  const [sourceBalance, setSourceBalance] = useState<AssetBalance>()
  const {
    currentBlockchain,
    setCurrentBlockchain,
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

  const [inputAmount, setAmount] = useState<Big>()
  const [networkFee, setNetworkFee] = useState<Big>()

  const amount = inputAmount || BIG_ZERO

  const bridgeFee = useBridgeFeeEstimate(amount) || BIG_ZERO
  const minimum = useMinimumTransferAmount(amount)
  const { data: networkFeeRate } = useNetworkFee()

  const btc = useBtcBridge({ amount, bridgeFee, minimum })
  const unified = useUnifiedBridge(amount)

  const coingeckoId = useCoinGeckoId(unified.selectedBridgeAsset?.symbol)

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
    () =>
      inputAmount !== undefined
        ? bigToBigInt(inputAmount, denomination)
        : undefined,
    [inputAmount, denomination]
  )

  useEffect(() => {
    if (unified.isAssetSupported) {
      setSourceBalance(unified.sourceBalance)
    } else if (currentBlockchain === Blockchain.BITCOIN) {
      setSourceBalance(btc.sourceBalance)
    } else {
      setSourceBalance(undefined)
    }
  }, [btc, currentBlockchain, unified.isAssetSupported, unified.sourceBalance])

  useEffect(() => {
    const getNetworkFee = async (): Promise<bigint | undefined> => {
      if (
        !networkFeeRate ||
        !activeAccount ||
        !unified.selectedBridgeAsset ||
        !currentAssetData ||
        amount.eq(BIG_ZERO)
      )
        return

      let gasLimit: bigint | undefined

      if (unified.isAssetSupported) {
        gasLimit = await UnifiedBridgeService.estimateGas({
          asset: unified.selectedBridgeAsset,
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
            networkFeeRate.low.maxFeePerGas * gasLimit,
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
    targetNetwork,
    networkFeeRate,
    unified
  ])

  // Derive bridge Blockchain from active network
  useEffect(() => {
    const networkBlockchain = networkToBlockchain(activeNetwork)
    if (currentBlockchain !== networkBlockchain) {
      setCurrentBlockchain(networkBlockchain)
    }
  }, [activeNetwork, currentBlockchain, setCurrentBlockchain])

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
  } else {
    return {
      ...defaults,
      transfer: () => Promise.reject('invalid bridge')
    }
  }
}
