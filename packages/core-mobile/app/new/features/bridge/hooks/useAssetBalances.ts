import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectTokensWithBalanceByNetwork } from 'store/balance/slice'
import { useTokenInfoContext } from '@avalabs/core-bridge-sdk'
import { selectTokenVisibility } from 'store/portfolio'
import { isTokenVisible } from 'store/balance/utils'
import { AssetBalance, unwrapAssetSymbol } from 'common/utils/bridgeUtils'
import { getAssetBalances } from 'features/bridge/utils/getAssetBalances'
import { getCoingeckoId } from 'common/utils/getCoingeckoId'
import { useBridgeAssets } from './useBridgeAssets'
import { useAssetBalancePrices } from './useAssetBalancePrices'
/**
 * Get a list of bridge supported assets with the balances.
 * The list is sorted by balance.
 */
export function useAssetBalances(sourceNetworkChainId?: number): {
  assetsWithBalances: AssetBalance[]
} {
  const tokenVisibility = useSelector(selectTokenVisibility)
  const tokens = useSelector(
    selectTokensWithBalanceByNetwork(sourceNetworkChainId)
  )
  const tokenInfoData = useTokenInfoContext()
  const bridgeAssets = useBridgeAssets(sourceNetworkChainId)

  const visibleTokens = useMemo(
    () => tokens.filter(token => isTokenVisible(tokenVisibility, token)),
    [tokens, tokenVisibility]
  )

  const assetsWithBalances = useMemo(
    () =>
      getAssetBalances(bridgeAssets, visibleTokens)
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
    [bridgeAssets, visibleTokens, tokenInfoData]
  )

  const prices = useAssetBalancePrices(assetsWithBalances)

  const sortedAssetsWithBalances = useMemo(() => {
    return assetsWithBalances.toSorted((a, b) => {
      const coingeckoIdA = getCoingeckoId(a.symbol, tokenInfoData)
      const coingeckoIdB = getCoingeckoId(b.symbol, tokenInfoData)
      const aPrice = coingeckoIdA ? prices?.[coingeckoIdA] : undefined
      const bPrice = coingeckoIdB ? prices?.[coingeckoIdB] : undefined
      if (aPrice && bPrice) {
        return bPrice - aPrice
      }
      return 0
    })
  }, [assetsWithBalances, prices, tokenInfoData])

  return { assetsWithBalances: sortedAssetsWithBalances }
}
