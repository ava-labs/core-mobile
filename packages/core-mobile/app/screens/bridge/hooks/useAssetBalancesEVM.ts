import { useMemo } from 'react'
import {
  BitcoinConfigAsset,
  Blockchain,
  EthereumAssets,
  EthereumConfigAsset,
  NativeAsset,
  useBridgeSDK,
  useGetTokenSymbolOnNetwork
} from '@avalabs/bridge-sdk'
import { AssetBalance } from 'screens/bridge/utils/types'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance'
import { uniqBy } from 'lodash'
import { isUnifiedBridgeAsset } from '../utils/bridgeUtils'
import { getEVMAssetBalances } from '../handlers/getEVMAssetBalances'
import { useUnifiedBridgeAssets } from './useUnifiedBridgeAssets'

/**
 * Get for the current chain.
 * Get a list of bridge supported assets with the balances of the current blockchain.
 * The list is sorted by balance.
 */
export function useAssetBalancesEVM(
  chain: Blockchain.AVALANCHE | Blockchain.ETHEREUM
): {
  assetsWithBalances: AssetBalance[]
  loading: boolean
} {
  const tokens = useSelector(selectTokensWithBalance)
  const { avalancheAssets, ethereumAssets, currentBlockchain } = useBridgeSDK()
  const { assets: unifiedBridgeAssets } = useUnifiedBridgeAssets()

  const { getTokenSymbolOnNetwork } = useGetTokenSymbolOnNetwork()

  const isAvalanche =
    chain === Blockchain.AVALANCHE || currentBlockchain === Blockchain.AVALANCHE

  const legacyAssets = useMemo(() => {
    const filteredEthereumAssets: EthereumAssets = Object.keys(ethereumAssets)
      .filter(key => ethereumAssets[key]?.symbol !== 'BUSD') // do not allow BUSD.e onboardings
      .filter(key => ethereumAssets[key]?.symbol !== 'USDC') // do not use Legacy Bridge for USDC onboardings
      .reduce<EthereumAssets>((obj, key) => {
        const asset = ethereumAssets[key]
        if (asset) obj[key] = asset
        return obj
      }, {})

    return Object.values<
      NativeAsset | EthereumConfigAsset | BitcoinConfigAsset
    >(isAvalanche ? avalancheAssets : filteredEthereumAssets)
  }, [avalancheAssets, ethereumAssets, isAvalanche])

  // Deduplicate the assets since both Unified & legacy SDKs could allow bridging the same assets.
  // unifiedBridgeAssets go first so that they're not the ones removed (we prefer Unified bridge over legacy)
  const allAssets = useMemo(
    () =>
      uniqBy([...unifiedBridgeAssets, ...legacyAssets], asset => {
        return isUnifiedBridgeAsset(asset)
          ? asset.symbol
          : getTokenSymbolOnNetwork(asset.symbol, chain)
      }),
    [chain, getTokenSymbolOnNetwork, legacyAssets, unifiedBridgeAssets]
  )

  const assetsWithBalances = useMemo(
    () =>
      getEVMAssetBalances(allAssets, tokens).map(token => {
        return {
          ...token,
          symbolOnNetwork: isUnifiedBridgeAsset(token.asset)
            ? token.asset.symbol
            : getTokenSymbolOnNetwork(token.symbol, chain)
        }
      }),
    [allAssets, chain, getTokenSymbolOnNetwork, tokens]
  )

  const sortedAssetsWithBalances = assetsWithBalances.sort(
    (asset1, asset2) => asset2.balance?.cmp(asset1.balance || 0) || 0
  )

  return { assetsWithBalances: sortedAssetsWithBalances, loading: false }
}
