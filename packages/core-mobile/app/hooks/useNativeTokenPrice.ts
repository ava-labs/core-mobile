import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { useNetworks } from './networks/useNetworks'

export function useNativeTokenPrice(customCurrency?: VsCurrencyType): {
  nativeTokenPrice: number
} {
  const { activeNetwork } = useNetworks()
  return useNativeTokenPriceForNetwork(activeNetwork, customCurrency)
}
