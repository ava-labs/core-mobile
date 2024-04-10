import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'
import { useNetworks } from './useNetworks'

export function useNativeTokenPrice(customCurrency?: VsCurrencyType): {
  nativeTokenPrice: number
} {
  const { selectActiveNetwork } = useNetworks()
  const activeNetwork = selectActiveNetwork()
  return useNativeTokenPriceForNetwork(activeNetwork, customCurrency)
}
