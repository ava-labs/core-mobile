import { useMemo } from 'react'
import { AssetBalance } from 'screens/bridge/utils/types'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance/slice'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { useTokenInfoContext } from '@avalabs/core-bridge-sdk'
import { getAssetBalances } from '../handlers/getAssetBalances'
import { unwrapAssetSymbol } from '../utils/bridgeUtils'
import { useBridgeAssets } from './useBridgeAssets'

/**
 * Get a list of bridge supported assets with the balances.
 * The list is sorted by balance.
 */
export function useAssetBalances(): {
  assetsWithBalances: AssetBalance[]
} {
  const tokens = useSelector(selectTokensWithBalance)
  const tokenInfoData = useTokenInfoContext()
  const { bridgeAssets } = useBridgeAssets()

  const assetsWithBalances = useMemo(
    () =>
      getAssetBalances(bridgeAssets, tokens)
        .map(token => {
          return {
            ...token,
            logoUri:
              token.logoUri ??
              tokenInfoData?.[unwrapAssetSymbol(token.asset.symbol)]?.logo,
            symbolOnNetwork: token.asset.symbol
          }
        })
        .filter(token => token.balance !== undefined),
    [bridgeAssets, tokens, tokenInfoData]
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

  return { assetsWithBalances: sortedAssetsWithBalances }
}
