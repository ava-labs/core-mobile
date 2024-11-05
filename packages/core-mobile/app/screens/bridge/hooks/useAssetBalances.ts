import { useMemo } from 'react'
import { AssetBalance } from 'screens/bridge/utils/types'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance/slice'
import { uniqBy } from 'lodash'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { UnifiedBridgeService } from '@avalabs/bridge-unified'
import { getAssetBalances } from '../handlers/getAssetBalances'
import { useUnifiedBridgeAssets } from './useUnifiedBridgeAssets'

/**
 * Get for the current chain.
 * Get a list of bridge supported assets with the balances of the current blockchain.
 * The list is sorted by balance.
 */
export function useAssetBalances(
  unifiedBridge: UnifiedBridgeService | undefined
): {
  assetsWithBalances: AssetBalance[]
  loading: boolean
} {
  const tokens = useSelector(selectTokensWithBalance)
  const { data } = useUnifiedBridgeAssets(unifiedBridge)
  const bridgeAssets = useMemo(() => data?.bridgeAssets ?? [], [data])

  // const isAvalanche = network !== undefined && isAvalancheNetwork(network)

  // const getFilteredEthereumAssets = useCallback((): EthereumAssets => {
  //   const filteredEthereumAssets: EthereumAssets = Object.keys(ethereumAssets)
  //     .filter(
  //       key =>
  //         ethereumAssets[key]?.symbol !== 'BUSD' && // do not allow BUSD.e onboardings
  //         ethereumAssets[key]?.symbol !== 'USDC' // do not use Legacy Bridge for USDC onboardings
  //     )
  //     .reduce<EthereumAssets>((obj, key) => {
  //       const asset = ethereumAssets[key]
  //       if (asset) obj[key] = asset
  //       return obj
  //     }, {})

  //   return filteredEthereumAssets
  // }, [ethereumAssets])

  // Deduplicate the assets since both Unified & legacy SDKs could allow bridging the same assets.
  // unifiedBridgeAssets go first so that they're not the ones removed (we prefer Unified bridge over legacy)
  const allAssets = useMemo(
    () => uniqBy([...bridgeAssets], asset => asset.symbol),
    [bridgeAssets]
  )

  const assetsWithBalances = useMemo(
    () =>
      getAssetBalances(allAssets, tokens).map(token => {
        return {
          ...token,
          symbolOnNetwork: token.asset.symbol
        }
      }),
    [allAssets, tokens]
  )

  const sortedAssetsWithBalances = assetsWithBalances.sort((asset1, asset2) => {
    const asset1Balance = bigintToBig(
      asset1.balance || 0n,
      asset1.asset.decimals
    )
    const asset2Balance = bigintToBig(
      asset2.balance || 0n,
      asset2.asset.decimals
    )

    return asset2Balance.cmp(asset1Balance)
  })

  return { assetsWithBalances: sortedAssetsWithBalances, loading: false }
}
