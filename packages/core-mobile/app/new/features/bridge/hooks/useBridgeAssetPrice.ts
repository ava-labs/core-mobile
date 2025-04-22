import { BridgeAsset } from '@avalabs/bridge-unified'
import { useCoinGeckoId } from 'hooks/useCoinGeckoId'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSimplePrice } from 'hooks/useSimplePrice'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { getOriginalSymbol } from '../utils/bridgeUtils'

export const useBridgeAssetPrice = (
  bridgeAsset: BridgeAsset | undefined
): Big | undefined => {
  const assetSymbol = bridgeAsset?.symbol
    ? getOriginalSymbol(bridgeAsset.symbol)
    : undefined

  const coingeckoId = useCoinGeckoId(assetSymbol)
  const currency = useSelector(selectSelectedCurrency)

  return useSimplePrice(coingeckoId, currency.toLowerCase() as VsCurrencyType)
}
