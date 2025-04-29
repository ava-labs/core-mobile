import { KNOWN_IDS } from 'hooks/useCoinGeckoId'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSimplePrices } from 'hooks/useSimplePrices'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useTokenInfoContext } from '@avalabs/core-bridge-sdk'
import { useMemo } from 'react'
import { AssetBalance, getOriginalSymbol } from 'common/utils/bridgeUtils'
import { Prices } from './useBridge'

export const useAssetBalancePrices = (
  assetsWithBalances: AssetBalance[] | undefined
): Prices | undefined => {
  const tokenInfoData = useTokenInfoContext()

  const coingeckoIds = useMemo(() => {
    if (!assetsWithBalances) {
      return []
    }
    return assetsWithBalances
      .map(asset => {
        const assetSymbol = getOriginalSymbol(asset.symbol)
        return (
          KNOWN_IDS[assetSymbol] || tokenInfoData?.[assetSymbol]?.coingeckoId
        )
      })
      .filter(item => item !== undefined)
  }, [assetsWithBalances, tokenInfoData])

  const currency = useSelector(selectSelectedCurrency)

  const { data } = useSimplePrices(
    coingeckoIds,
    currency.toLowerCase() as VsCurrencyType
  )

  return data
}
