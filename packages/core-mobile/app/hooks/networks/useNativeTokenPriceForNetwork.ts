import TokenService from 'services/token/TokenService'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Network } from '@avalabs/chains-sdk'
import { useQuery } from '@tanstack/react-query'

const REFETCH_INTERVAL = 10000 // 10 seconds

/**
 *
 * @param network
 * @param customCurrency
 * @return nativeTokenPrice in AVAX
 */
export const useNativeTokenPriceForNetwork = (
  network: Network | undefined,
  customCurrency?: VsCurrencyType
): { nativeTokenPrice: number } => {
  const selectedCurrency = useSelector(
    selectSelectedCurrency
  ).toLowerCase() as VsCurrencyType
  const currency = customCurrency ?? (selectedCurrency as VsCurrencyType)

  const nativeTokenId = network?.pricingProviders?.coingecko.nativeTokenId ?? ''

  const { data } = useQuery({
    refetchInterval: REFETCH_INTERVAL,
    enabled: Boolean(nativeTokenId),
    queryKey: ['nativeTokenPrice', nativeTokenId, currency],
    queryFn: async () => {
      return TokenService.getPriceWithMarketDataByCoinId(
        nativeTokenId,
        currency
      )
    }
  })

  return { nativeTokenPrice: data?.price ?? 0 }
}
