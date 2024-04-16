import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'
import { useNetworks } from './networks/useNetworks'

export function useNativeTokenPrice(customCurrency?: VsCurrencyType): {
  nativeTokenPrice: number
} {
  const { activeNetwork } = useNetworks()
  return useNativeTokenPriceForNetwork(activeNetwork, customCurrency)
}
