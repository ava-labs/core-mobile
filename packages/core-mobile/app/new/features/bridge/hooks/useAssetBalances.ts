import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectTokensWithBalanceByNetwork } from 'store/balance/slice'
import { useTokenInfoContext } from '@avalabs/core-bridge-sdk'
import { selectTokenVisibility } from 'store/portfolio'
import { isTokenVisible } from 'store/balance/utils'
import { AssetBalance, unwrapAssetSymbol } from 'common/utils/bridgeUtils'
import { getAssetBalances } from 'features/bridge/utils/getAssetBalances'
import { getCoingeckoId } from 'common/utils/getCoingeckoId'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { selectEnabledChainIds } from 'store/network'
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
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const visibleTokens = useMemo(
    () =>
      tokens.filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      ),
    [tokens, tokenVisibility, enabledChainIds]
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

  const assetsWithBalancesInCurrency = useMemo(() => {
    return assetsWithBalances.map(asset => {
      const coingeckoId = getCoingeckoId(asset.symbol, tokenInfoData)
      const priceInCurrency = coingeckoId ? prices?.[coingeckoId] : undefined
      return {
        ...asset,
        priceInCurrency
      }
    })
  }, [assetsWithBalances, prices, tokenInfoData])

  const sortedAssetsWithBalances = useMemo(() => {
    return assetsWithBalancesInCurrency.toSorted((a, b) => {
      const balanceInCurrencyA =
        a.priceInCurrency && a.balance
          ? bigintToBig(a.balance, a.asset.decimals).toNumber() *
            a.priceInCurrency
          : undefined
      const balanceInCurrencyB =
        b.priceInCurrency && b.balance
          ? bigintToBig(b.balance, b.asset.decimals).toNumber() *
            b.priceInCurrency
          : undefined
      if (balanceInCurrencyA === undefined) {
        return 1
      }
      if (balanceInCurrencyB === undefined) {
        return -1
      }
      return balanceInCurrencyB - balanceInCurrencyA
    })
  }, [assetsWithBalancesInCurrency])

  return { assetsWithBalances: sortedAssetsWithBalances }
}
