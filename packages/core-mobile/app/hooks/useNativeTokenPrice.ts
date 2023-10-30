import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'

export function useNativeTokenPrice(customCurrency?: VsCurrencyType) {
  const activeNetwork = useSelector(selectActiveNetwork)
  return useNativeTokenPriceForNetwork(activeNetwork, customCurrency)
}
